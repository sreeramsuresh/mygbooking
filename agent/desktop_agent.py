import os
import sys
import json
import time
import uuid
import socket
import getpass
import threading
import requests
import configparser
from datetime import datetime
from PyQt5.QtWidgets import (QApplication, QSystemTrayIcon, QMenu, QAction, 
                           QMainWindow, QLabel, QLineEdit, QPushButton, 
                           QVBoxLayout, QWidget, QMessageBox, QHBoxLayout)
from PyQt5.QtGui import QIcon, QPixmap
from PyQt5.QtCore import Qt, QTimer, pyqtSignal, pyqtSlot

# Constants
CONFIG_FILE = os.path.join(os.path.expanduser('~'), '.office_agent_config')
ICON_PATH = 'icon.png'  # Replace with your icon path or bundle it
API_BASE_URL = 'http://localhost:9600/api/desktop'  # Replace with your server URL


class NetworkMonitor:
    """Class to monitor network connection and get network details"""
    
    @staticmethod
    def get_mac_address():
        """Get the MAC address of the machine"""
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff)
                         for elements in range(0, 8*6, 8)][::-1])
        return mac
    
    @staticmethod
    def get_computer_name():
        """Get the computer hostname"""
        return socket.gethostname()
    
    @staticmethod
    def get_ip_address():
        """Get the IP address of the machine"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"  # Return localhost if can't determine IP
    
    @staticmethod
    def get_current_ssid():
        """Get the current SSID"""
        ssid = "Unknown"
        
        # This is a simplified approach. In a real app, you'd use platform-specific code
        # Windows: use subprocess to call 'netsh wlan show interfaces'
        # macOS: use subprocess to call '/System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport -I'
        # Linux: read from /proc/net/wireless or use iwconfig
        
        if sys.platform == 'win32':
            try:
                import subprocess
                output = subprocess.check_output(['netsh', 'wlan', 'show', 'interfaces']).decode('utf-8')
                for line in output.split('\n'):
                    if 'SSID' in line and 'BSSID' not in line:
                        ssid = line.split(':')[1].strip()
                        break
            except Exception:
                pass
        elif sys.platform == 'darwin':  # macOS
            try:
                import subprocess
                output = subprocess.check_output(['/System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport', '-I']).decode('utf-8')
                for line in output.split('\n'):
                    if ' SSID:' in line:
                        ssid = line.split(':')[1].strip()
                        break
            except Exception:
                pass
        elif sys.platform.startswith('linux'):
            try:
                import subprocess
                output = subprocess.check_output(['iwgetid', '-r']).decode('utf-8').strip()
                if output:
                    ssid = output
            except Exception:
                pass
                
        return ssid


class ApiClient:
    """Class to handle API communication with the server"""
    
    def __init__(self):
        self.access_token = None
        self.user_data = None
        self.session = requests.Session()
        self.connected = False
        self.connection_start_time = None
        self.last_heartbeat_time = None
    
    def login(self, email, password):
        """Authenticate with the server"""
        try:
            payload = {
                "email": email,
                "password": password,
                "macAddress": NetworkMonitor.get_mac_address(),
                "ssid": NetworkMonitor.get_current_ssid()
            }
            
            response = self.session.post(f"{API_BASE_URL}/login", json=payload)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('success'):
                self.access_token = response_data['data']['accessToken']
                self.user_data = response_data['data']
                self.session.headers.update({
                    'Authorization': f"Bearer {self.access_token}"
                })
                return True, response_data['message']
            else:
                return False, response_data.get('message', 'Login failed')
        except Exception as e:
            return False, f"Login error: {str(e)}"
    
    def logout(self):
        """Logout from the server"""
        if not self.access_token:
            return True, "Not logged in"
        
        try:
            response = self.session.post(f"{API_BASE_URL}/logout")
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('success'):
                self.access_token = None
                self.user_data = None
                self.session.headers.pop('Authorization', None)
                return True, response_data['message']
            else:
                return False, response_data.get('message', 'Logout failed')
        except Exception as e:
            return False, f"Logout error: {str(e)}"
    
    def track_connection(self, is_connect=True):
        """Record connection/disconnection events"""
        if not self.access_token:
            return False, "Not authenticated"
        
        try:
            current_time = int(time.time())
            formatted_time = datetime.fromtimestamp(current_time).strftime('%Y-%m-%d %H:%M:%S')
            
            if is_connect:
                payload = {
                    "event_type": "connect",
                    "ssid": NetworkMonitor.get_current_ssid(),
                    "email": self.user_data['email'],
                    "ip_address": NetworkMonitor.get_ip_address(),
                    "mac_address": NetworkMonitor.get_mac_address(),
                    "computer_name": NetworkMonitor.get_computer_name(),
                    "connection_start_time": current_time,
                    "connection_start_time_formatted": formatted_time
                }
                self.connection_start_time = current_time
                self.connected = True
            else:
                # Calculate duration
                duration = 0
                if self.connection_start_time:
                    duration = current_time - self.connection_start_time
                
                # Format duration as HH:MM:SS
                hours, remainder = divmod(duration, 3600)
                minutes, seconds = divmod(remainder, 60)
                duration_formatted = f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"
                
                payload = {
                    "event_type": "disconnect",
                    "ssid": NetworkMonitor.get_current_ssid(),
                    "email": self.user_data['email'],
                    "mac_address": NetworkMonitor.get_mac_address(),
                    "connection_duration": duration,
                    "connection_duration_formatted": duration_formatted
                }
                self.connected = False
            
            response = self.session.post(f"{API_BASE_URL}/track-connection", json=payload)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('success'):
                return True, response_data['message']
            else:
                return False, response_data.get('message', 'Tracking failed')
        except Exception as e:
            return False, f"Tracking error: {str(e)}"


class ConfigManager:
    """Class to handle configuration file operations"""
    
    @staticmethod
    def save_credentials(email, password):
        """Save credentials to config file"""
        config = configparser.ConfigParser()
        config['Credentials'] = {
            'email': email,
            'password': password  # In a real app, consider encrypting this
        }
        
        with open(CONFIG_FILE, 'w') as configfile:
            config.write(configfile)
        
        # Set appropriate permissions
        os.chmod(CONFIG_FILE, 0o600)  # User read/write only
    
    @staticmethod
    def load_credentials():
        """Load credentials from config file"""
        if not os.path.exists(CONFIG_FILE):
            return None, None
        
        config = configparser.ConfigParser()
        config.read(CONFIG_FILE)
        
        if 'Credentials' in config:
            return config['Credentials'].get('email'), config['Credentials'].get('password')
        
        return None, None
    
    @staticmethod
    def clear_credentials():
        """Clear saved credentials"""
        if os.path.exists(CONFIG_FILE):
            os.remove(CONFIG_FILE)


class LoginWindow(QMainWindow):
    """Login window for first-time authentication"""
    login_successful = pyqtSignal(str, str)
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Office Attendance - Login")
        self.setFixedSize(350, 200)
        self.setWindowFlags(Qt.WindowStaysOnTopHint)
        
        main_widget = QWidget()
        layout = QVBoxLayout()
        
        # Email field
        email_layout = QHBoxLayout()
        email_label = QLabel("Email:")
        self.email_input = QLineEdit()
        email_layout.addWidget(email_label)
        email_layout.addWidget(self.email_input)
        layout.addLayout(email_layout)
        
        # Password field
        password_layout = QHBoxLayout()
        password_label = QLabel("Password:")
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        password_layout.addWidget(password_label)
        password_layout.addWidget(self.password_input)
        layout.addLayout(password_layout)
        
        # Login button
        self.login_button = QPushButton("Login")
        self.login_button.clicked.connect(self.perform_login)
        layout.addWidget(self.login_button)
        
        # Status label
        self.status_label = QLabel("")
        layout.addWidget(self.status_label)
        
        main_widget.setLayout(layout)
        self.setCentralWidget(main_widget)
        
        # API client
        self.api_client = ApiClient()
        
        # Center window on screen
        self.center_on_screen()
    
    def center_on_screen(self):
        """Center the window on the screen"""
        qr = self.frameGeometry()
        cp = QApplication.desktop().availableGeometry().center()
        qr.moveCenter(cp)
        self.move(qr.topLeft())
    
    def perform_login(self):
        """Handle login button click"""
        email = self.email_input.text()
        password = self.password_input.text()
        
        if not email or not password:
            self.status_label.setText("Please enter both email and password")
            return
        
        self.login_button.setEnabled(False)
        self.status_label.setText("Logging in...")
        
        # Perform login in a separate thread to avoid UI freezing
        threading.Thread(target=self._login_worker, args=(email, password)).start()
    
    def _login_worker(self, email, password):
        """Worker function to perform login in a separate thread"""
        success, message = self.api_client.login(email, password)
        
        # Update UI in the main thread
        QApplication.instance().callEvent(
            lambda: self._handle_login_result(success, message, email, password)
        )
    
    def _handle_login_result(self, success, message, email, password):
        """Handle login result"""
        self.login_button.setEnabled(True)
        
        if success:
            self.status_label.setText(f"Success: {message}")
            # Save credentials
            ConfigManager.save_credentials(email, password)
            # Emit signal for successful login
            self.login_successful.emit(email, password)
            # Close login window
            self.close()
        else:
            self.status_label.setText(f"Error: {message}")


class DesktopAgent(QSystemTrayIcon):
    """Main desktop agent class that manages the system tray icon and background operations"""
    
    def __init__(self):
        super().__init__()
        
        # Setup tray icon
        icon = QIcon(ICON_PATH) if os.path.exists(ICON_PATH) else QIcon.fromTheme("network-idle")
        self.setIcon(icon)
        self.setToolTip("Office Attendance Agent")
        self.setVisible(True)
        
        # Create menu
        self.menu = QMenu()
        
        # Status action (read-only)
        self.status_action = QAction("Status: Not connected")
        self.status_action.setEnabled(False)
        self.menu.addAction(self.status_action)
        
        # Network action (read-only)
        self.network_action = QAction("Network: Unknown")
        self.network_action.setEnabled(False)
        self.menu.addAction(self.network_action)
        
        self.menu.addSeparator()
        
        # Force connect action
        self.connect_action = QAction("Connect Manually")
        self.connect_action.triggered.connect(self.manual_connect)
        self.menu.addAction(self.connect_action)
        
        # Force disconnect action
        self.disconnect_action = QAction("Disconnect Manually")
        self.disconnect_action.triggered.connect(self.manual_disconnect)
        self.disconnect_action.setEnabled(False)
        self.menu.addAction(self.disconnect_action)
        
        self.menu.addSeparator()
        
        # Logout action
        self.logout_action = QAction("Logout")
        self.logout_action.triggered.connect(self.logout)
        self.menu.addAction(self.logout_action)
        
        # Exit action
        self.exit_action = QAction("Exit")
        self.exit_action.triggered.connect(self.exit_application)
        self.menu.addAction(self.exit_action)
        
        # Set menu
        self.setContextMenu(self.menu)
        
        # API client
        self.api_client = ApiClient()
        
        # Timer for network checking
        self.network_timer = QTimer(self)
        self.network_timer.timeout.connect(self.check_network)
        
        # Get login credentials
        self.email, self.password = ConfigManager.load_credentials()
        
        # Initialize login window
        self.login_window = None
        
        # Start application
        self.initialize()
    
    def initialize(self):
        """Initialize the application"""
        if self.email and self.password:
            # Authenticate with saved credentials
            success, message = self.api_client.login(self.email, self.password)
            
            if success:
                self.show_notification("Office Attendance Agent", "Successfully logged in")
                self.start_monitoring()
            else:
                # Failed with saved credentials, show login window
                self.show_notification("Login Failed", message)
                self.show_login_window()
        else:
            # No saved credentials, show login window
            self.show_login_window()
            
    def send_heartbeat(self):
        """Send heartbeat to server to confirm connection is still active"""
        if self.api_client.connected:
            try:
                # Send heartbeat using the same trackConnection endpoint
                # but with a special heartbeat event type
                current_time = int(time.time())
                formatted_time = datetime.fromtimestamp(current_time).strftime('%Y-%m-%d %H:%M:%S')
                
                payload = {
                    "event_type": "heartbeat",
                    "ssid": NetworkMonitor.get_current_ssid(),
                    "email": self.api_client.user_data['email'],
                    "ip_address": NetworkMonitor.get_ip_address(),
                    "mac_address": NetworkMonitor.get_mac_address(),
                    "computer_name": NetworkMonitor.get_computer_name(),
                    "heartbeat_time": current_time,
                    "heartbeat_time_formatted": formatted_time
                }
                
                # Send the heartbeat in a separate thread to avoid blocking the UI
                threading.Thread(
                    target=self._send_heartbeat_worker,
                    args=(payload,)
                ).start()
            except Exception as e:
                print(f"Error sending heartbeat: {str(e)}")
                
    def _send_heartbeat_worker(self, payload):
        """Worker function to send heartbeat in a separate thread"""
        try:
            response = self.api_client.session.post(f"{API_BASE_URL}/track-connection", json=payload)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('success'):
                # Update status (silently, no notification)
                self.api_client.last_heartbeat_time = payload['heartbeat_time']
                print(f"Heartbeat sent successfully at {payload['heartbeat_time_formatted']}")
            else:
                print(f"Heartbeat failed: {response_data.get('message', 'Unknown error')}")
                
                # If server cannot find the session, try to reconnect
                if "No active session found" in response_data.get('message', ''):
                    print("Session not found on server, attempting to reconnect...")
                    self.handle_network_connect()
        except Exception as e:
            print(f"Error in heartbeat worker: {str(e)}")
    
    def show_login_window(self):
        """Show the login window"""
        self.login_window = LoginWindow()
        self.login_window.login_successful.connect(self.on_login_successful)
        self.login_window.show()
    
    def on_login_successful(self, email, password):
        """Handle successful login from login window"""
        self.email = email
        self.password = password
        self.start_monitoring()
    
    def start_monitoring(self):
        """Start network monitoring"""
        # Update initial status
        self.update_network_status()
        
        # Start the network timer
        self.network_timer.start(30000)  # Check every 30 seconds
        
        # Start heartbeat timer for status updates (every 2 minutes)
        self.heartbeat_timer = QTimer(self)
        self.heartbeat_timer.timeout.connect(self.send_heartbeat)
        self.heartbeat_timer.start(120000)  # Send heartbeat every 2 minutes
    
    def check_network(self):
        """Check network status periodically"""
        current_ssid = NetworkMonitor.get_current_ssid()
        
        # Update status display
        self.update_network_status()
        
        # If connected to network, but not logged in, perform connect
        if current_ssid != "Unknown" and not self.api_client.connected:
            self.handle_network_connect()
        
        # If disconnected from network but still logged in, perform disconnect
        elif current_ssid == "Unknown" and self.api_client.connected:
            self.handle_network_disconnect()
    
    def update_network_status(self):
        """Update network status in the menu"""
        current_ssid = NetworkMonitor.get_current_ssid()
        
        # Update network action
        self.network_action.setText(f"Network: {current_ssid}")
        
        # Update status action
        status = "Connected" if self.api_client.connected else "Not connected"
        self.status_action.setText(f"Status: {status}")
        
        # Update icon based on connection status
        if self.api_client.connected:
            icon = QIcon(ICON_PATH) if os.path.exists(ICON_PATH) else QIcon.fromTheme("network-transmit-receive")
            self.setIcon(icon)
        else:
            icon = QIcon(ICON_PATH) if os.path.exists(ICON_PATH) else QIcon.fromTheme("network-idle")
            self.setIcon(icon)
        
        # Update connect/disconnect actions
        self.connect_action.setEnabled(not self.api_client.connected)
        self.disconnect_action.setEnabled(self.api_client.connected)
    
    def handle_network_connect(self):
        """Handle network connection"""
        success, message = self.api_client.track_connection(is_connect=True)
        
        if success:
            self.show_notification("Connected", f"Connected to {NetworkMonitor.get_current_ssid()}")
        else:
            self.show_notification("Connection Error", message)
        
        self.update_network_status()
    
    def handle_network_disconnect(self):
        """Handle network disconnection"""
        success, message = self.api_client.track_connection(is_connect=False)
        
        if success:
            self.show_notification("Disconnected", "Disconnected from network")
        else:
            self.show_notification("Disconnection Error", message)
        
        self.update_network_status()
    
    def manual_connect(self):
        """Manual connection triggered by user"""
        self.handle_network_connect()
    
    def manual_disconnect(self):
        """Manual disconnection triggered by user"""
        self.handle_network_disconnect()
    
    def logout(self):
        """Logout from the system"""
        # First disconnect if connected
        if self.api_client.connected:
            self.handle_network_disconnect()
        
        # Then logout
        success, message = self.api_client.logout()
        
        if success:
            # Clear saved credentials
            ConfigManager.clear_credentials()
            self.show_notification("Logged Out", "Successfully logged out")
            # Show login window
            self.show_login_window()
        else:
            self.show_notification("Logout Error", message)
    
    def exit_application(self):
        """Exit the application"""
        # First disconnect if connected
        if self.api_client.connected:
            self.handle_network_disconnect()
        
        # Then logout
        if self.api_client.access_token:
            self.api_client.logout()
        
        # Exit application
        QApplication.quit()
    
    def show_notification(self, title, message):
        """Show a system notification"""
        self.showMessage(title, message, QSystemTrayIcon.Information, 3000)


# Add an event call function to QApplication to handle threading
class Application(QApplication):
    def __init__(self, argv):
        super().__init__(argv)
        self._callbacks = {}
        
        # Call callbacks every 100ms
        self.timer = QTimer(self)
        self.timer.timeout.connect(self._process_callbacks)
        self.timer.start(100)
    
    def callEvent(self, callback):
        """Call a function in the main thread"""
        callback_id = id(callback)
        self._callbacks[callback_id] = callback
        return callback_id
    
    def _process_callbacks(self):
        """Process all registered callbacks"""
        callbacks = list(self._callbacks.items())
        for callback_id, callback in callbacks:
            callback()
            del self._callbacks[callback_id]


if __name__ == "__main__":
    # Create application
    app = Application(sys.argv)
    app.setQuitOnLastWindowClosed(False)  # Keep running when windows are closed
    
    # Create tray icon
    tray_icon = DesktopAgent()
    
    # Start the application event loop
    sys.exit(app.exec_())
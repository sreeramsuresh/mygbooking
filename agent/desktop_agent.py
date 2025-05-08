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

# Constants
CONFIG_FILE = os.path.join(os.path.expanduser('~'), '.office_agent_config')
# API_BASE_URL = 'http://192.168.1.8:9600/api/desktop'  # Replace with your server URL
API_BASE_URL = 'http://localhost:9600/api/desktop'  # Replace with your server URL
# API_BASE_URL = 'https://gbooking.giglabz.co.in/api/desktop'  # Replace with your server URL

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
    
    def send_heartbeat(self):
        """Send heartbeat to server to confirm connection is still active"""
        if not self.connected:
            return False, "Not connected"
            
        try:
            current_time = int(time.time())
            formatted_time = datetime.fromtimestamp(current_time).strftime('%Y-%m-%d %H:%M:%S')
            
            payload = {
                "event_type": "heartbeat",
                "ssid": NetworkMonitor.get_current_ssid(),
                "email": self.user_data['email'],
                "ip_address": NetworkMonitor.get_ip_address(),
                "mac_address": NetworkMonitor.get_mac_address(),
                "computer_name": NetworkMonitor.get_computer_name(),
                "heartbeat_time": current_time,
                "heartbeat_time_formatted": formatted_time
            }
            
            response = self.session.post(f"{API_BASE_URL}/track-connection", json=payload)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('success'):
                self.last_heartbeat_time = current_time
                print(f"Heartbeat sent successfully at {formatted_time}")
                return True, response_data['message']
            else:
                print(f"Heartbeat failed: {response_data.get('message', 'Unknown error')}")
                
                # If server cannot find the session, try to reconnect
                if "No active session found" in response_data.get('message', ''):
                    print("Session not found on server, attempting to reconnect...")
                    return False, "Session not found"
                
                return False, response_data.get('message', 'Heartbeat failed')
        except Exception as e:
            return False, f"Heartbeat error: {str(e)}"


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


class OfficeAgent:
    """Main agent class for monitoring network and tracking attendance"""
    
    def __init__(self, email=None, password=None):
        # API client
        self.api_client = ApiClient()
        
        # Store credentials
        self.email = email
        self.password = password
        
        # Current status
        self.is_running = False
        self.previous_ssid = "Unknown"
        
    def initialize(self, gui_get_credentials=None):
        """Initialize the agent
        
        Args:
            gui_get_credentials: Optional function to get credentials via GUI
                                Should return (email, password) tuple or (None, None) if canceled
        """
        # If no credentials provided, try to load from config
        if not self.email or not self.password:
            self.email, self.password = ConfigManager.load_credentials()
        
        # If still no credentials and we have a GUI function, use it
        if (not self.email or not self.password) and gui_get_credentials:
            self.email, self.password = gui_get_credentials()
            
            # If user canceled login
            if not self.email or not self.password:
                print("Login canceled by user")
                return False
        
        # If we still have no credentials, we can't proceed
        if not self.email or not self.password:
            print("No credentials available")
            return False
        
        # Authenticate
        success, message = self.api_client.login(self.email, self.password)
        
        if success:
            print(f"Successfully logged in: {message}")
            # Save credentials for next time
            ConfigManager.save_credentials(self.email, self.password)
            return True
        else:
            print(f"Login failed: {message}")
            return False
    
    def check_network(self):
        """Check network status and handle connections/disconnections"""
        current_ssid = NetworkMonitor.get_current_ssid()
        
        # Print current status
        print(f"Current network: {current_ssid}")
        
        # Handle connections
        if current_ssid != "Unknown" and self.previous_ssid == "Unknown":
            success, message = self.api_client.track_connection(is_connect=True)
            if success:
                print(f"Connected to {current_ssid}: {message}")
            else:
                print(f"Connection tracking failed: {message}")
        
        # Handle disconnections
        elif current_ssid == "Unknown" and self.previous_ssid != "Unknown":
            success, message = self.api_client.track_connection(is_connect=False)
            if success:
                print(f"Disconnected from {self.previous_ssid}: {message}")
            else:
                print(f"Disconnection tracking failed: {message}")
        
        # Handle SSID changes (when connected to a different network)
        elif current_ssid != "Unknown" and self.previous_ssid != "Unknown" and current_ssid != self.previous_ssid:
            # First disconnect from previous network
            success, message = self.api_client.track_connection(is_connect=False)
            if success:
                print(f"Disconnected from {self.previous_ssid}: {message}")
            else:
                print(f"Disconnection tracking failed: {message}")
            
            # Then connect to new network
            success, message = self.api_client.track_connection(is_connect=True)
            if success:
                print(f"Connected to {current_ssid}: {message}")
            else:
                print(f"Connection tracking failed: {message}")
        
        # Update previous SSID
        self.previous_ssid = current_ssid
    
    def run(self):
        """Run the agent in a loop"""
        if not self.initialize():
            print("Failed to initialize. Exiting.")
            return
        
        self.is_running = True
        heartbeat_counter = 0
        
        # Set up signal handling for proper termination
        import signal
        
        def signal_handler(sig, frame):
            print("\nStopping Office Agent...")
            self.stop()
            sys.exit(0)
        
        # Register the signal handler for SIGINT (Ctrl+C)
        signal.signal(signal.SIGINT, signal_handler)
        
        print("Office Agent is running. Press Ctrl+C to exit.")
        
        # Initial network check
        self.check_network()
        
        try:
            while self.is_running:
                # Use shorter sleep intervals to check for interruption more frequently
                for _ in range(6):  # 6 x 5 seconds = 30 seconds
                    time.sleep(5)
                    if not self.is_running:
                        break
                        
                if not self.is_running:
                    break
                
                # Check network
                self.check_network()
                
                # Send heartbeat every 2 minutes (4 cycles)
                heartbeat_counter += 1
                if heartbeat_counter >= 4:
                    if self.api_client.connected:
                        success, message = self.api_client.send_heartbeat()
                        if not success and message == "Session not found":
                            # Force reconnect
                            self.api_client.track_connection(is_connect=True)
                    
                    heartbeat_counter = 0
                
        except KeyboardInterrupt:
            print("\nStopping Office Agent via KeyboardInterrupt...")
            self.stop()
    
    def stop(self):
        """Properly stop the agent"""
        self.is_running = False
        
        # Disconnect if connected
        if self.api_client.connected:
            success, message = self.api_client.track_connection(is_connect=False)
            if success:
                print(f"Disconnected: {message}")
            else:
                print(f"Failed to disconnect: {message}")
            
        # Logout
        success, message = self.api_client.logout()
        if success:
            print(f"Logged out: {message}")
        else:
            print(f"Failed to logout: {message}")
        
        print("Office Agent stopped.")


if __name__ == "__main__":
    # Create and run the agent
    agent = OfficeAgent()
    agent.run()
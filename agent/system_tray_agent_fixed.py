import os
import sys
import time
import threading
import traceback
import subprocess  # Make sure this import is included
from PyQt5 import QtWidgets, QtGui, QtCore

# Ensure we're running without a console window when packaged
if getattr(sys, 'frozen', False):
    # Running as compiled executable - redirect stdout/stderr to log file
    log_file = os.path.join(os.path.expanduser('~'), '.office_agent_log.txt')
    
    def log_to_file(message):
        """Write log messages to file instead of console"""
        try:
            with open(log_file, 'a') as f:
                timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                f.write(f"{timestamp} - {message}\n")
        except Exception:
            pass  # Silently fail if we can't write to log
    
    # Redirect standard output and error
    sys.stdout = type('RedirectOutput', (), {'write': lambda self, x: log_to_file(x), 'flush': lambda self: None})()
    sys.stderr = type('RedirectError', (), {'write': lambda self, x: log_to_file(f"ERROR: {x}"), 'flush': lambda self: None})()
    
    # Make print function log to file
    print = log_to_file
else:
    # In development mode, define log_to_file but keep normal console printing
    log_file = os.path.join(os.path.expanduser('~'), '.office_agent_log.txt')
    
    def log_to_file(message):
        """Write log messages to file in addition to console"""
        try:
            with open(log_file, 'a') as f:
                timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                f.write(f"{timestamp} - {message}\n")
        except Exception:
            pass

# Import desktop agent module
try:
    from desktop_agent_fixed import OfficeAgent, ConfigManager, NetworkMonitor
    log_to_file("Successfully imported desktop_agent_fixed module")
except ImportError:
    try:
        # Fallback to original module if fixed version not available
        from desktop_agent import OfficeAgent, ConfigManager, NetworkMonitor
        log_to_file("Using original desktop_agent module")
    except Exception as e:
        log_to_file(f"CRITICAL ERROR: Could not import agent modules: {str(e)}\n{traceback.format_exc()}")
        # Show error dialog before exiting if possible
        if 'PyQt5.QtWidgets' in sys.modules:
            app = QtWidgets.QApplication(sys.argv)
            error_dialog = QtWidgets.QMessageBox()
            error_dialog.setIcon(QtWidgets.QMessageBox.Critical)
            error_dialog.setText("Failed to start Office Agent")
            error_dialog.setInformativeText(f"Error: {str(e)}")
            error_dialog.setWindowTitle("Office Agent Error")
            error_dialog.exec_()
        sys.exit(1)

class LoginDialog(QtWidgets.QDialog):
    """Dialog for collecting login credentials"""
    
    def __init__(self, parent=None):
        super(LoginDialog, self).__init__(parent)
        
        self.setWindowTitle("Office Agent Login")
        self.setFixedWidth(300)
        self.setFixedHeight(150)
        
        # Create layout
        layout = QtWidgets.QVBoxLayout()
        
        # Email field
        email_layout = QtWidgets.QHBoxLayout()
        email_label = QtWidgets.QLabel("Email:")
        self.email_input = QtWidgets.QLineEdit()
        email_layout.addWidget(email_label)
        email_layout.addWidget(self.email_input)
        layout.addLayout(email_layout)
        
        # Password field
        password_layout = QtWidgets.QHBoxLayout()
        password_label = QtWidgets.QLabel("Password:")
        self.password_input = QtWidgets.QLineEdit()
        self.password_input.setEchoMode(QtWidgets.QLineEdit.Password)
        password_layout.addWidget(password_label)
        password_layout.addWidget(self.password_input)
        layout.addLayout(password_layout)
        
        # Buttons
        button_layout = QtWidgets.QHBoxLayout()
        self.login_button = QtWidgets.QPushButton("Login")
        self.login_button.clicked.connect(self.accept)
        self.cancel_button = QtWidgets.QPushButton("Cancel")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.login_button)
        button_layout.addWidget(self.cancel_button)
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
    
    def get_credentials(self):
        """Get credentials entered by user"""
        return self.email_input.text(), self.password_input.text()


class SystemTrayAgent(QtWidgets.QSystemTrayIcon):
    """System tray application for the Office Agent"""
    
    # Define signals for thread-safe UI updates
    status_signal = QtCore.pyqtSignal(str)
    
    def __init__(self, parent=None):
        QtWidgets.QSystemTrayIcon.__init__(self, parent)
        
        try:
            log_to_file("Initializing SystemTrayAgent")
            
            # Set the tray icon
            self.setIcon(QtGui.QIcon(self.get_icon_path()))
            
            # Create the menu
            self.menu = QtWidgets.QMenu(parent)
            
            # Add status item (disabled, just for display)
            self.status_action = self.menu.addAction("Status: Initializing...")
            self.status_action.setEnabled(False)
            
            self.menu.addSeparator()
            
            # Add control actions
            self.start_action = self.menu.addAction("Start Monitoring")
            self.start_action.triggered.connect(self.start_monitoring)
            
            self.stop_action = self.menu.addAction("Stop Monitoring")
            self.stop_action.triggered.connect(self.stop_monitoring)
            
            self.menu.addSeparator()
            
            # Add logout and exit options
            self.logout_action = self.menu.addAction("Logout")
            self.logout_action.triggered.connect(self.logout)
            
            exit_action = self.menu.addAction("Exit")
            exit_action.triggered.connect(self.exit_app)
            
            # Set the menu
            self.setContextMenu(self.menu)
            
            # Set up signals
            self.status_signal.connect(self.update_status)
            
            # Show the icon
            self.show()
            
            # Set tooltip
            self.setToolTip("Office Agent")
            
            # Initialize the agent
            self.agent = OfficeAgent()
            self.agent_thread = None
            
            # Auto-start the agent
            log_to_file("Starting automatic initialization")
            self.initialize_agent()
            
            # Make sure agent can find us
            self.activated.connect(self.on_tray_activated)
            
            # Set initial state for buttons
            self.stop_action.setEnabled(False)
            
        except Exception as e:
            log_to_file(f"Error in SystemTrayAgent.__init__: {str(e)}\n{traceback.format_exc()}")
            self.show_error("Initialization Error", f"Error initializing application: {str(e)}")
    
    def on_tray_activated(self, reason):
        """Handle tray icon activation (click)"""
        if reason == QtWidgets.QSystemTrayIcon.DoubleClick:
            # On double-click, show status as a notification
            self.show_status_notification()
    
    def show_status_notification(self):
        """Show current status in a notification balloon"""
        if hasattr(self.agent, 'api_client') and self.agent.api_client:
            if self.agent.api_client.connected:
                self.showMessage(
                    "Office Agent - Connected",
                    f"Connected to network: {self.agent.previous_ssid}\n"
                    f"Last heartbeat: {time.strftime('%H:%M:%S', time.localtime(self.agent.api_client.last_heartbeat_time or 0))}", 
                    QtWidgets.QSystemTrayIcon.Information, 
                    3000
                )
            else:
                self.showMessage(
                    "Office Agent - Disconnected",
                    "Not currently connected to an office network.",
                    QtWidgets.QSystemTrayIcon.Information,
                    3000
                )
        else:
            self.showMessage(
                "Office Agent - Status",
                "Agent is not fully initialized.",
                QtWidgets.QSystemTrayIcon.Information,
                3000
            )
    
    def get_gui_credentials(self):
        """Show login dialog to get credentials"""
        try:
            dialog = LoginDialog(self.parent())
            result = dialog.exec_()
            
            if result == QtWidgets.QDialog.Accepted:
                credentials = dialog.get_credentials()
                log_to_file(f"Credentials received from dialog: {credentials[0]}")
                return credentials
            else:
                log_to_file("User canceled login dialog")
            
            return None, None
        except Exception as e:
            log_to_file(f"Error in get_gui_credentials: {str(e)}\n{traceback.format_exc()}")
            return None, None
    
    def initialize_agent(self):
        """Initialize and start the agent"""
        try:
            # Initialize the agent
            if not self.agent.initialize(self.get_gui_credentials):
                self.update_status("Status: Initialization failed")
                self.showMessage(
                    "Office Agent", 
                    "Failed to initialize agent. Please check your credentials.", 
                    QtWidgets.QSystemTrayIcon.Critical, 
                    3000
                )
                log_to_file("Agent initialization failed")
                return
                
            # Set status
            self.update_status("Status: Running")
            
            # Start the agent thread
            self.start_agent_thread()
            
            # Update action states
            self.start_action.setEnabled(False)
            self.stop_action.setEnabled(True)
            
            # Show success notification
            self.showMessage(
                "Office Agent", 
                "Agent is now monitoring your office presence", 
                QtWidgets.QSystemTrayIcon.Information, 
                3000
            )
            
        except Exception as e:
            log_to_file(f"Error in initialize_agent: {str(e)}\n{traceback.format_exc()}")
            self.update_status("Status: Error initializing")
            self.show_error("Initialization Error", str(e))
    
    def start_agent_thread(self):
        """Start the agent in a separate thread"""
        try:
            if self.agent_thread and self.agent_thread.is_alive():
                log_to_file("Agent thread is already running")
                return
                
            log_to_file("Starting agent thread")
            self.agent.is_running = True
            self.agent_thread = threading.Thread(target=self.run_agent_loop)
            self.agent_thread.daemon = True
            self.agent_thread.start()
            log_to_file("Agent thread started")
        except Exception as e:
            log_to_file(f"Error starting agent thread: {str(e)}\n{traceback.format_exc()}")
            self.show_error("Thread Error", f"Could not start monitoring thread: {str(e)}")
    
    def run_agent_loop(self):
        """The main agent loop running in a thread"""
        try:
            log_to_file("Agent loop started")
            heartbeat_counter = 0
            
            # Initial network check
            self.agent.check_network()
            
            while self.agent.is_running:
                try:
                    # Use shorter sleep intervals
                    for _ in range(6):  # 6 x 5 seconds = 30 seconds
                        time.sleep(5)
                        if not self.agent.is_running:
                            break
                            
                    if not self.agent.is_running:
                        break
                    
                    # Check network status
                    self.agent.check_network()
                    
                    # Send heartbeat every 1 minute (2 cycles) - more frequent to prevent timeouts
                    heartbeat_counter += 1
                    if heartbeat_counter >= 2:
                        heartbeat_counter = 0
                        
                        # Always check current connection state  
                        current_ssid = NetworkMonitor.get_current_ssid()
                        
                        # Debug connection state
                        log_to_file(f"Heartbeat check: connected={self.agent.api_client.connected}, current_ssid={current_ssid}, previous_ssid={self.agent.previous_ssid}")
                        
                        try:
                            # Check if SSID changed
                            if current_ssid != self.agent.previous_ssid and current_ssid != "Unknown":
                                log_to_file(f"SSID changed during heartbeat check: {self.agent.previous_ssid} -> {current_ssid}")
                                # Update previous SSID
                                self.agent.previous_ssid = current_ssid
                                
                                # Force reconnection with new SSID
                                log_to_file("Forcing reconnection due to SSID change")
                                reconnect_success, reconnect_message = self.agent.api_client.track_connection(is_connect=True)
                                if reconnect_success:
                                    self.agent.api_client.connected = True
                                    log_to_file(f"Successfully reconnected after SSID change: {reconnect_message}")
                                    self.status_signal.emit(f"Status: Connected to {current_ssid}")
                                else:
                                    log_to_file(f"Failed to reconnect after SSID change: {reconnect_message}")
                            elif self.agent.api_client.connected:
                                # Normal heartbeat
                                log_to_file(f"Sending heartbeat at {time.strftime('%H:%M:%S')}")
                                success, message = self.agent.api_client.send_heartbeat()
                                if not success:
                                    # If heartbeat fails, force a reconnection
                                    log_to_file(f"Heartbeat failed with message: {message}. Forcing reconnection...")
                                    reconnect_success, reconnect_message = self.agent.api_client.track_connection(is_connect=True)
                                    if reconnect_success:
                                        self.agent.api_client.connected = True
                                        log_to_file(f"Successfully reconnected after heartbeat failure: {reconnect_message}")
                                        self.status_signal.emit("Status: Reconnected")
                                    else:
                                        log_to_file(f"Failed to reconnect after heartbeat failure: {reconnect_message}")
                            else:
                                # Not connected, try to connect
                                log_to_file("Not connected during heartbeat check, attempting to connect...")
                                connect_success, connect_message = self.agent.api_client.track_connection(is_connect=True)
                                if connect_success:
                                    self.agent.api_client.connected = True
                                    log_to_file(f"Successfully connected during heartbeat check: {connect_message}")
                                    self.status_signal.emit("Status: Connected")
                                else:
                                    log_to_file(f"Failed to connect during heartbeat check: {connect_message}")
                        except Exception as e:
                            log_to_file(f"Critical error during heartbeat check: {str(e)}")
                            # Try to reconnect on error
                            try:
                                self.agent.api_client.track_connection(is_connect=True)
                            except:
                                pass
                except Exception as inner_e:
                    log_to_file(f"Error in agent loop iteration: {str(inner_e)}")
                    # Continue running despite errors in a single iteration
                    time.sleep(30)
            
            log_to_file("Agent loop exited normally")
        except Exception as e:
            log_to_file(f"Critical error in agent thread: {str(e)}\n{traceback.format_exc()}")
            self.status_signal.emit(f"Status: Thread error")
    
    def start_monitoring(self):
        """Start agent monitoring"""
        try:
            if not self.agent.is_running:
                log_to_file("User requested to start monitoring")
                
                # If the agent was initialized but stopped
                if hasattr(self.agent, 'api_client') and self.agent.api_client.access_token:
                    # Just restart the thread
                    self.start_agent_thread()
                    self.update_status("Status: Running")
                else:
                    # Need to reinitialize
                    self.initialize_agent()
                
                self.start_action.setEnabled(False)
                self.stop_action.setEnabled(True)
                
                self.showMessage("Office Agent", "Monitoring started", QtWidgets.QSystemTrayIcon.Information, 2000)
        except Exception as e:
            log_to_file(f"Error starting monitoring: {str(e)}")
            self.show_error("Monitoring Error", f"Could not start monitoring: {str(e)}")
    
    def stop_monitoring(self):
        """Stop agent monitoring"""
        try:
            if self.agent.is_running:
                log_to_file("User requested to stop monitoring")
                
                # Stop the agent thread
                self.agent.is_running = False
                
                # Wait for thread to exit (non-blocking)
                if self.agent_thread and self.agent_thread.is_alive():
                    self.agent_thread.join(0.1)  # Short timeout
                
                self.update_status("Status: Stopped")
                self.start_action.setEnabled(True)
                self.stop_action.setEnabled(False)
                
                self.showMessage("Office Agent", "Monitoring stopped", QtWidgets.QSystemTrayIcon.Information, 2000)
        except Exception as e:
            log_to_file(f"Error stopping monitoring: {str(e)}")
    
    def get_icon_path(self):
        """Get the path to the icon file, works both when running as script and as frozen executable"""
        try:
            if getattr(sys, 'frozen', False):
                base_path = sys._MEIPASS
            else:
                base_path = os.path.dirname(os.path.abspath(__file__))
                
            icon_path = os.path.join(base_path, "icon.ico")
            
            if not os.path.exists(icon_path):
                log_to_file(f"Icon file not found at {icon_path}. Using system icon.")
                
                # Try system icons in order of preference
                for system_icon in [
                    "C:\\Windows\\System32\\imageres.dll,15",  # Default app icon
                    "C:\\Windows\\System32\\shell32.dll,1",    # Document icon
                ]:
                    return system_icon
            else:
                log_to_file(f"Using icon at: {icon_path}")
                return icon_path
        except Exception as e:
            log_to_file(f"Error getting icon path: {str(e)}")
            # Fallback to a standard Windows icon
            return "C:\\Windows\\System32\\shell32.dll,1"

    def logout(self):
        """Logout and clear credentials"""
        try:
            log_to_file("User initiated logout")
            
            # Stop the agent if running
            if self.agent.is_running:
                self.agent.is_running = False
                
                # Wait for thread to exit (non-blocking)
                if self.agent_thread and self.agent_thread.is_alive():
                    self.agent_thread.join(0.1)  # Short timeout
            
            # Disconnect and logout from API
            if hasattr(self.agent, 'api_client') and self.agent.api_client.connected:
                self.agent.api_client.track_connection(is_connect=False)
                self.agent.api_client.logout()
            
            # Clear credentials
            ConfigManager.clear_credentials()
            
            self.showMessage("Office Agent", "Logged out successfully", QtWidgets.QSystemTrayIcon.Information, 2000)
            self.update_status("Status: Logged out")
            
            # Reset UI state
            self.start_action.setEnabled(True)
            self.stop_action.setEnabled(False)
            
            # Reset the agent
            self.agent = OfficeAgent()
            
        except Exception as e:
            log_to_file(f"Error in logout: {str(e)}\n{traceback.format_exc()}")
            self.show_error("Logout Error", f"Error during logout: {str(e)}")

    def exit_app(self):
        """Exit the application"""
        try:
            log_to_file("User initiated exit")
            
            # Stop the agent and clean up
            if self.agent.is_running:
                self.agent.stop()  # This handles disconnection and logout
            
            # Exit the application
            QtWidgets.QApplication.quit()
            
        except Exception as e:
            log_to_file(f"Error in exit_app: {str(e)}\n{traceback.format_exc()}")
            # Force quit even if there was an error
            QtWidgets.QApplication.quit()
    
    def update_status(self, status_text):
        """Update the status text in the menu (thread-safe)"""
        try:
            self.status_action.setText(status_text)
        except Exception as e:
            log_to_file(f"Error updating status: {str(e)}")
    
    def show_error(self, title, message):
        """Show an error message to the user"""
        try:
            self.showMessage(
                title,
                message, 
                QtWidgets.QSystemTrayIcon.Critical, 
                5000
            )
        except Exception as e:
            log_to_file(f"Error showing error message: {str(e)}")


def check_single_instance():
    """Ensure only one instance of the app is running"""
    # This is a simple implementation - consider using a proper mutex for production
    lock_file = os.path.join(os.path.expanduser('~'), '.office_agent.lock')
    
    try:
        # If the lock file exists and is less than 1 minute old, assume another instance is running
        if os.path.exists(lock_file):
            file_time = os.path.getmtime(lock_file)
            if time.time() - file_time < 60:  # 60 seconds
                return False
        
        # Create/update the lock file
        with open(lock_file, 'w') as f:
            f.write(str(os.getpid()))
        return True
    except Exception as e:
        log_to_file(f"Error checking single instance: {str(e)}")
        # If we can't check, proceed anyway
        return True


def main():
    """Main entry point for the application"""
    try:
        # Make sure only one instance runs
        if not check_single_instance():
            print("Another instance is already running. Exiting.")
            # If we're in GUI mode, show a message
            app = QtWidgets.QApplication(sys.argv)
            QtWidgets.QMessageBox.information(
                None, 
                "Office Agent", 
                "Another instance of Office Agent is already running."
            )
            sys.exit(0)
        
        log_to_file("----- Starting Office Agent application -----")
        
        # Create Qt application
        app = QtWidgets.QApplication(sys.argv)
        app.setQuitOnLastWindowClosed(False)  # Keep running when all windows are closed
        
        # Create a hidden main window to own the system tray
        window = QtWidgets.QWidget()
        window.setWindowFlags(QtCore.Qt.FramelessWindowHint)
        window.setAttribute(QtCore.Qt.WA_TranslucentBackground)
        window.setGeometry(0, 0, 0, 0)
        
        # Create the system tray agent
        tray_agent = SystemTrayAgent(window)
        
        log_to_file("Application started, entering event loop")
        sys.exit(app.exec_())
        
    except Exception as e:
        log_to_file(f"Fatal error in main: {str(e)}\n{traceback.format_exc()}")
        
        # Try to show an error dialog
        try:
            app = QtWidgets.QApplication(sys.argv)
            error_dialog = QtWidgets.QMessageBox()
            error_dialog.setIcon(QtWidgets.QMessageBox.Critical)
            error_dialog.setText("Office Agent Error")
            error_dialog.setInformativeText(f"A fatal error occurred:\n{str(e)}")
            error_dialog.setWindowTitle("Office Agent Error")
            error_dialog.exec_()
        except:
            pass  # If we can't show the dialog, just exit
        
        sys.exit(1)


if __name__ == "__main__":
    main()
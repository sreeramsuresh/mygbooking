import os
import sys
import time
import threading
from PyQt5 import QtWidgets, QtGui, QtCore
from desktop_agent import OfficeAgent, ConfigManager

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
    def __init__(self, parent=None):
        QtWidgets.QSystemTrayIcon.__init__(self, parent)
        
        # Set the tray icon
        self.setIcon(QtGui.QIcon(self.get_icon_path()))
        
        # Create the menu
        self.menu = QtWidgets.QMenu(parent)
        
        # Add menu items
        self.status_action = self.menu.addAction("Status: Initializing...")
        self.status_action.setEnabled(False)
        
        self.menu.addSeparator()
        
        self.logout_action = self.menu.addAction("Logout")
        self.logout_action.triggered.connect(self.logout)
        
        exit_action = self.menu.addAction("Exit")
        exit_action.triggered.connect(self.exit_app)
        
        # Set the menu
        self.setContextMenu(self.menu)
        
        # Show the icon
        self.show()
        
        # Set tooltip
        self.setToolTip("Office Agent")
        
        # Initialize the agent
        self.agent = OfficeAgent()
        self.agent_thread = None
        
        # Auto-start the agent
        self.start_agent()
    
    def get_icon_path(self):
        """Get the path to the icon file, works both when running as script and as frozen executable"""
        if getattr(sys, 'frozen', False):
            # Running as compiled executable
            base_path = sys._MEIPASS
        else:
            # Running as script
            base_path = os.path.dirname(os.path.abspath(__file__))
        
        # Default icon path - you should replace this with your own icon
        icon_path = os.path.join(base_path, "icon.ico")
        
        # If icon doesn't exist, use a system icon
        if not os.path.exists(icon_path):
            for system_icon in [
                "C:\\Windows\\System32\\imageres.dll,15",  # Default app icon
                "C:\\Windows\\System32\\shell32.dll,1",    # Document icon
            ]:
                return system_icon
        
        return icon_path
    
    def get_gui_credentials(self):
        """Show login dialog to get credentials"""
        dialog = LoginDialog(self.parent())
        result = dialog.exec_()
        
        if result == QtWidgets.QDialog.Accepted:
            return dialog.get_credentials()
        
        return None, None
    
    def start_agent(self):
        """Start the agent in a separate thread"""
        if self.agent_thread and self.agent_thread.is_alive():
            self.showMessage("Office Agent", "Agent is already running", QtWidgets.QSystemTrayIcon.Information, 2000)
            return
        
        # Initialize the agent if needed
        if not self.agent.initialize(self.get_gui_credentials):
            self.showMessage("Office Agent", "Failed to initialize agent", QtWidgets.QSystemTrayIcon.Critical, 2000)
            return
        
        # Set status
        self.status_action.setText("Status: Running")
        
        # Create and start the thread
        self.agent.is_running = True
        self.agent_thread = threading.Thread(target=self.run_agent_loop)
        self.agent_thread.daemon = True
        self.agent_thread.start()
        
        self.showMessage("Office Agent", "Agent started successfully", QtWidgets.QSystemTrayIcon.Information, 2000)
    
    def run_agent_loop(self):
        """The main agent loop running in a thread"""
        heartbeat_counter = 0
        
        # Initial network check
        self.agent.check_network()
        
        try:
            while self.agent.is_running:
                # Use shorter sleep intervals
                for _ in range(6):  # 6 x 5 seconds = 30 seconds
                    time.sleep(5)
                    if not self.agent.is_running:
                        break
                        
                if not self.agent.is_running:
                    break
                
                # Check network
                self.agent.check_network()
                
                # Send heartbeat every 2 minutes (4 cycles)
                heartbeat_counter += 1
                if heartbeat_counter >= 4:
                    if self.agent.api_client.connected:
                        success, message = self.agent.api_client.send_heartbeat()
                        if not success and message == "Session not found":
                            # Force reconnect
                            self.agent.api_client.track_connection(is_connect=True)
                    
                    heartbeat_counter = 0
        except Exception as e:
            print(f"Error in agent thread: {str(e)}")
            self.status_action.setText(f"Status: Error - {str(e)}")
    
    def logout(self):
        """Logout and clear credentials"""
        # Stop agent first if running
        if self.agent_thread and self.agent_thread.is_alive():
            self.agent.stop()
            self.agent.is_running = False
            self.agent_thread.join(2.0)  # Wait for thread to finish with timeout
        
        # Clear credentials
        ConfigManager.clear_credentials()
        
        self.showMessage("Office Agent", "Logged out and credentials cleared", QtWidgets.QSystemTrayIcon.Information, 2000)
        
        # Reset agent and restart
        self.agent = OfficeAgent()
        self.start_agent()
    
    def exit_app(self):
        """Exit the application"""
        # Stop the agent first if running
        if self.agent_thread and self.agent_thread.is_alive():
            # Call the agent's stop method but don't update UI
            self.agent.stop()
            self.agent.is_running = False
            self.agent_thread.join(2.0)  # Wait for thread to finish with timeout
        
        QtWidgets.QApplication.quit()


def main():
    # Create application
    app = QtWidgets.QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)  # Don't quit when last window closed
    
    # Create window for parenting dialogs
    window = QtWidgets.QWidget()
    window.resize(1, 1)
    window.setWindowTitle("Office Agent")
    window.hide()
    
    # Create tray icon
    tray_agent = SystemTrayAgent(window)
    
    # Run the app
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
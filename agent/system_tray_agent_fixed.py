import os
import sys
import time
import threading
import traceback
from PyQt5 import QtWidgets, QtGui, QtCore

# Redirect stdout and stderr to prevent console window from showing
class NullWriter:
    def write(self, text):
        pass
    def flush(self):
        pass

# Only redirect if not in development mode
if getattr(sys, 'frozen', False):  # Running as compiled executable
    sys.stdout = NullWriter()
    sys.stderr = NullWriter()

# Create a log file for debugging purposes
log_file = os.path.join(os.path.expanduser('~'), '.office_agent_log.txt')

def log_to_file(message):
    """Write log messages to file instead of console"""
    try:
        with open(log_file, 'a') as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}\n")
    except:
        pass  # Silently fail if we can't write to log

# Replace print with log_to_file
print = log_to_file

# Import the agent module
try:
    from desktop_agent_fixed import OfficeAgent, ConfigManager
    log_to_file("Successfully imported desktop_agent_fixed module")
except Exception as e:
    log_to_file(f"Error importing desktop_agent_fixed: {str(e)}\n{traceback.format_exc()}")
    raise

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
    
    def start_agent(self):
        """Start the agent in a separate thread"""
        if self.agent_thread and self.agent_thread.is_alive():
            self.showMessage("Office Agent", "Agent is already running", QtWidgets.QSystemTrayIcon.Information, 2000)
            return

        try:
            self.status_action.setText("Status: Running")
            self.agent_thread = threading.Thread(target=self.agent.run)
            self.agent_thread.setDaemon(True)
            self.agent_thread.start()
        except Exception as e:
            log_to_file(f"Error starting agent: {str(e)}")
            self.status_action.setText("Status: Error")

    def get_icon_path(self):
        """Get the path to the icon file, works both when running as script and as frozen executable"""
        try:
            if getattr(sys, 'frozen', False):
                base_path = sys._MEIPASS
            else:
                base_path = os.path.dirname(os.path.abspath(__file__))
            icon_path = os.path.join(base_path, "icon.ico")
            if not os.path.exists(icon_path):
                log_to_file("Icon file not found. Using default system icon.")
                return "C:\\Windows\\System32\\shell32.dll,1"
            return icon_path
        except Exception as e:
            log_to_file(f"Error getting icon path: {str(e)}")
            return "C:\\Windows\\System32\\shell32.dll,1"

    def logout(self):
        """Logout and clear credentials"""
        log_to_file("User initiated logout")
        ConfigManager.clear_credentials()
        self.showMessage("Office Agent", "Logged out and credentials cleared", QtWidgets.QSystemTrayIcon.Information, 2000)
        self.status_action.setText("Status: Logged out")

    def exit_app(self):
        QtWidgets.QApplication.quit()


def main():
    app = QtWidgets.QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    window = QtWidgets.QWidget()
    tray_agent = SystemTrayAgent(window)
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()

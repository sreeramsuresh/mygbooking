#!/usr/bin/env python3
# Part 1: Installation, UI, and System Tray

import os
import sys
import json
import platform
from datetime import datetime
import tkinter as tk
from tkinter import scrolledtext, messagebox
import keyring
import threading
import uuid
import time
import queue

# Handle platform-specific imports
if platform.system() == "Windows":
    import pystray
    from PIL import Image
    import win32api
    import win32con
    import win32gui
    import win32process
elif platform.system() == "Darwin":  # macOS
    import pystray
    from PIL import Image
    import subprocess
    import objc
    from Foundation import NSBundle
else:  # Linux
    import pystray
    from PIL import Image
    import gi
    gi.require_version('Gtk', '3.0')
    from gi.repository import Gtk, GLib

# Configuration
APP_NAME = "AttendanceTracker"
CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".attendance_tracker")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")
LOG_FILE = os.path.join(CONFIG_DIR, "app.log")
ICON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icon.png")

# Default configuration
DEFAULT_CONFIG = {
    "api_base_url": "http://localhost:9600",
    "target_ssid": "GIGLABZ_5G",
    "auto_start": True,
    "first_run": True
}

class AttendanceApp:
    def __init__(self):
        self.root = None
        self.tray_icon = None
        self.config = self.load_config()
        self.running = True
        self.is_logged_in = False
        self.access_token = None
        self.user_email = None
        self._mainloop_running = False  # Track if mainloop is running
        
        # Create a queue for thread-safe UI updates
        self.ui_queue = queue.Queue()
        
        # Ensure config directory exists
        if not os.path.exists(CONFIG_DIR):
            os.makedirs(CONFIG_DIR)
            
        # Setup logging
        self.setup_logging()
        
        # Initialize system tray
        self.setup_tray()
        
        # Check if first run
        if self.config.get("first_run", True):
            self.show_license_agreement()
        else:
            self.minimize_to_tray()
            
    def process_ui_queue(self):
        """Process any pending UI updates from the queue"""
        try:
            while True:
                # Get a task from the queue without blocking
                task, args, kwargs = self.ui_queue.get_nowait()
                try:
                    # Execute the task
                    task(*args, **kwargs)
                except Exception as e:
                    self.log(f"Error in UI task: {str(e)}", "error")
                # Mark the task as done
                self.ui_queue.task_done()
        except queue.Empty:
            # Queue is empty, schedule to check again
            if self.root and hasattr(self.root, 'winfo_exists'):
                try:
                    if self.root.winfo_exists():
                        self.root.after(100, self.process_ui_queue)
                except tk.TclError:
                    pass
    
    def schedule_ui_task(self, task, *args, **kwargs):
        """Schedule a task to be executed on the main thread"""
        self.ui_queue.put((task, args, kwargs))
        # If root exists, start processing the queue
        if self.root and hasattr(self.root, 'winfo_exists'):
            try:
                if self.root.winfo_exists():
                    self.root.after(0, self.process_ui_queue)
            except tk.TclError:
                pass

    def load_config(self):
        """Load configuration from file or create default if not exists"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r') as f:
                    return json.load(f)
            except:
                return DEFAULT_CONFIG
        else:
            return DEFAULT_CONFIG

    def save_config(self):
        """Save configuration to file"""
        with open(CONFIG_FILE, 'w') as f:
            json.dump(self.config, f)

    def setup_logging(self):
        """Set up basic logging to file"""
        import logging
        logging.basicConfig(
            filename=LOG_FILE,
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(APP_NAME)
        self.logger.info("Application started")

    def log(self, message, level="info"):
        """Log a message with specified level"""
        try:
            # Create a formatted message with thread information
            thread_id = threading.get_ident()
            thread_name = threading.current_thread().name
            formatted_msg = f"[Thread {thread_id} - {thread_name}] {message}"
            
            # Log to the appropriate level
            if level == "info":
                self.logger.info(formatted_msg)
            elif level == "error":
                self.logger.error(formatted_msg)
            elif level == "warning":
                self.logger.warning(formatted_msg)
                
            # For critical errors, also print to console
            if level == "error":
                print(f"ERROR: {message}")
                
        except Exception as e:
            # If logging fails, try printing to console
            print(f"Logging error: {str(e)}")
            print(f"Original message ({level}): {message}")

    def setup_tray(self):
        """Set up system tray icon and menu"""
        # Create tray icon
        try:
            image = Image.open(ICON_PATH) if os.path.exists(ICON_PATH) else self.create_default_icon()
            
            # Define the callback function for the Open menu item
            def on_open_clicked(icon, item):
                if self.is_logged_in:
                    self.show_main_window()
                else:
                    self.show_login()
            
            menu = (
                pystray.MenuItem('Open', on_open_clicked),
                pystray.MenuItem('Exit', self.exit_app)
            )
            self.tray_icon = pystray.Icon(APP_NAME, image, APP_NAME, menu)
            threading.Thread(target=self.tray_icon.run, daemon=True).start()
            self.log("System tray icon initialized")
        except Exception as e:
            self.log(f"Failed to initialize system tray: {str(e)}", "error")
            # Fallback to just showing the main window
            self.show_login()

    def create_default_icon(self):
        """Create a basic icon if none is provided"""
        img = Image.new('RGB', (64, 64), color=(66, 133, 244))
        return img

    def show_license_agreement(self):
        """Display license agreement window"""
        self.root = tk.Tk()
        self.root.title("License Agreement")
        self.root.geometry("600x500")
        self.root.resizable(False, False)
        self.root.protocol("WM_DELETE_WINDOW", self.exit_app)
        
        # Header
        header_label = tk.Label(self.root, text="Software License Agreement", font=("Arial", 16, "bold"))
        header_label.pack(pady=10)
        
        # License text
        license_frame = tk.Frame(self.root, padx=20, pady=10)
        license_frame.pack(fill="both", expand=True)
        
        license_text = scrolledtext.ScrolledText(license_frame, wrap=tk.WORD, font=("Arial", 10))
        license_text.pack(fill="both", expand=True)
        license_text.insert(tk.END, """
SOFTWARE LICENSE AGREEMENT

PLEASE READ THIS LICENSE AGREEMENT CAREFULLY BEFORE USING THE SOFTWARE.

By clicking "I Accept" below, you agree to be bound by the terms of this agreement.

1. GRANT OF LICENSE
This application is licensed, not sold. This license gives you the right to install and use the software on your computer.

2. DESCRIPTION OF OTHER RIGHTS AND LIMITATIONS
The software will collect information about your WiFi connections for attendance tracking purposes.
You may not reverse engineer, decompile, or disassemble the software.

3. COPYRIGHT
All title and copyrights in and to the software are owned by the software provider.

4. PRIVACY POLICY
The application collects the following information:
- Your WiFi connection details
- Computer name and MAC address
- IP address
- Connection timestamps

This information is used solely for attendance tracking purposes.
        """)
        license_text.config(state="disabled")
        
        # Buttons
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)
        
        accept_button = tk.Button(button_frame, text="I Accept", command=self.accept_license)
        accept_button.pack(side=tk.LEFT, padx=10)
        
        decline_button = tk.Button(button_frame, text="I Decline", command=self.exit_app)
        decline_button.pack(side=tk.LEFT, padx=10)
        
        self.center_window(self.root)
        self.root.mainloop()

    def accept_license(self):
        """Handle license acceptance"""
        self.config["first_run"] = False
        self.save_config()
        self.log("License agreement accepted")
        
        # Schedule minimizing to tray after destroying the root window
        # to avoid race condition
        self.root.destroy()
        self.root = None
        
        # Add a small delay before minimizing to tray
        time.sleep(0.1)
        self.show_login()

    def show_login(self, icon=None):
        """Display login window"""
        self.log("Attempting to show login window")
        
        # Check if we already have a valid root window
        if self.root and hasattr(self.root, 'winfo_exists'):
            try:
                if self.root.winfo_exists():
                    self.log("Existing root window found, showing it")
                    # Clear any existing widgets
                    for widget in self.root.winfo_children():
                        widget.destroy()
                else:
                    self.log("Root window exists but is invalid, creating new one")
                    self.root = None
            except tk.TclError as e:
                self.log(f"Tkinter error with existing root: {str(e)}", "error")
                # Root is invalid, we'll create a new one
                self.root = None
        
        # Create a new login window if needed
        if not self.root:
            try:
                self.log("Creating new login window")
                self.root = tk.Tk()
                # Set window properties
                self.root.title(f"{APP_NAME} - Login")
                self.root.geometry("350x250")
                self.root.resizable(False, False)
                self.root.protocol("WM_DELETE_WINDOW", self.minimize_to_tray)
            except Exception as e:
                self.log(f"Error creating login window: {str(e)}", "error")
                print(f"Error creating login window: {str(e)}")
                return
        
        try:
            # Create main frame
            frame = tk.Frame(self.root, padx=20, pady=20)
            frame.pack(fill="both", expand=True)
            
            # Username/Email field
            tk.Label(frame, text="Email:").grid(row=0, column=0, sticky="w", pady=(0, 5))
            self.email_var = tk.StringVar()
            email_entry = tk.Entry(frame, textvariable=self.email_var, width=30)
            email_entry.grid(row=0, column=1, pady=(0, 5))
            
            # Password field
            tk.Label(frame, text="Password:").grid(row=1, column=0, sticky="w", pady=(0, 5))
            self.password_var = tk.StringVar()
            password_entry = tk.Entry(frame, textvariable=self.password_var, show="*", width=30)
            password_entry.grid(row=1, column=1, pady=(0, 5))
            
            # Login button
            login_button = tk.Button(frame, text="Login", command=self.handle_login)
            login_button.grid(row=2, column=0, columnspan=2, pady=15)
            
            # Status label
            self.status_var = tk.StringVar()
            status_label = tk.Label(frame, textvariable=self.status_var, fg="red")
            status_label.grid(row=3, column=0, columnspan=2)
            
            # Center the window
            self.center_window(self.root)
            
            # Pre-fill email if available
            if self.user_email:
                self.log(f"Pre-filling email: {self.user_email}")
                self.email_var.set(self.user_email)
                password_entry.focus()
            else:
                email_entry.focus()
            
            # Make sure the window is visible
            self.root.deiconify()
            self.root.lift()  # Bring window to front
            
            # Start processing the UI queue
            self.root.after(100, self.process_ui_queue)
            
            # Run the main loop if needed
            if not self._mainloop_running:
                self.log("Starting mainloop for login window")
                self._mainloop_running = True
                self.root.mainloop()
            else:
                self.log("Mainloop already running, not starting new one")
                
            self.log("Login window setup complete")
                
        except Exception as e:
            self.log(f"Error setting up login UI: {str(e)}", "error")
            print(f"Error setting up login UI: {str(e)}")
    
    def show_main_window(self):
        """Display main application window after successful login"""
        self.log("Attempting to show main window")
        
        # Check if root exists and is valid
        is_root_valid = False
        if self.root and hasattr(self.root, 'winfo_exists'):
            try:
                if self.root.winfo_exists():
                    is_root_valid = True
                    self.log("Root window exists, clearing existing widgets")
                    for widget in self.root.winfo_children():
                        widget.destroy()
                else:
                    self.log("Root window reference exists but window is invalid")
                    is_root_valid = False
            except tk.TclError as e:
                self.log(f"Tcl error checking root window: {str(e)}", "error")
                is_root_valid = False
        else:
            self.log("No valid root window, creating new one")
        
        if not is_root_valid:
            try:
                self.log("Creating new main window")
                self.root = tk.Tk()
                self.root.title(f"{APP_NAME} - Connected")
                self.root.geometry("400x300")
                self.root.protocol("WM_DELETE_WINDOW", self.minimize_to_tray)
            except Exception as e:
                self.log(f"Error creating main window: {str(e)}", "error")
                return
        
        try:
            self.log("Setting up main window UI components")
            
            frame = tk.Frame(self.root, padx=20, pady=20)
            frame.pack(fill="both", expand=True)
            
            # Welcome message
            welcome_label = tk.Label(frame, text=f"Welcome, {self.user_email}", font=("Arial", 14))
            welcome_label.pack(pady=(0, 20))
            
            # Status information
            status_frame = tk.LabelFrame(frame, text="Connection Status", padx=10, pady=10)
            status_frame.pack(fill="x", pady=10)
            
            self.wifi_status_var = tk.StringVar(value="Monitoring WiFi...")
            wifi_status = tk.Label(status_frame, textvariable=self.wifi_status_var)
            wifi_status.pack(anchor="w")
            
            self.connection_status_var = tk.StringVar(value="Not connected to target network")
            connection_status = tk.Label(status_frame, textvariable=self.connection_status_var)
            connection_status.pack(anchor="w")
            
            # Buttons
            button_frame = tk.Frame(frame)
            button_frame.pack(pady=20)
            
            disconnect_button = tk.Button(button_frame, text="Disconnect", command=self.handle_logout)
            disconnect_button.pack(side=tk.LEFT, padx=5)
            
            minimize_button = tk.Button(button_frame, text="Minimize to Tray", command=self.minimize_to_tray)
            minimize_button.pack(side=tk.LEFT, padx=5)
            
            # Force connect button
            force_connect_button = tk.Button(button_frame, text="Force Connect", 
                                             command=self.force_connect_to_office)
            force_connect_button.pack(side=tk.LEFT, padx=5)
            
            self.center_window(self.root)
            
            # Make sure the window is visible
            self.root.deiconify()
            self.root.lift()  # Bring window to front
            
            # Start processing the UI queue
            self.root.after(100, self.process_ui_queue)
            
            # Start mainloop if not already running
            if not self._mainloop_running:
                self.log("Starting mainloop for main window")
                self._mainloop_running = True
                self.root.mainloop()
            else:
                self.log("Mainloop already running, not starting new one")
                
            self.log("Main window setup complete")
            
        except Exception as e:
            self.log(f"Error setting up main window: {str(e)}", "error")
            print(f"Error setting up main window: {str(e)}")
    
    def handle_login(self):
        """Handle login button click - will be implemented in Part 2"""
        email = self.email_var.get()
        password = self.password_var.get()
        
        if not email or not password:
            self.status_var.set("Please enter both email and password")
            return
            
        # This will be handled in Part 2
        self.status_var.set("Logging in...")
        # Pass control to authentication module
        
    def handle_logout(self):
        """Handle logout button click - will be implemented in Part 2"""
        # This will be handled in Part 2
        self.status_var.set("Logging out...")
        # Pass control to authentication module
    
    def minimize_to_tray(self):
        """Minimize application to system tray"""
        if self.root and hasattr(self.root, 'winfo_exists') and self.root.winfo_exists():
            self.root.withdraw()
        self.log("Application minimized to tray")
    
    def update_wifi_status(self, connected, ssid=None):
        """Update WiFi status display"""
        if not hasattr(self, 'wifi_status_var') or not hasattr(self, 'connection_status_var'):
            return
            
        # Define the actual update function to run on the main thread
        def _update_wifi_status():
            try:
                if connected and ssid:
                    self.wifi_status_var.set(f"Connected to: {ssid}")
                    if ssid == self.config["target_ssid"]:
                        self.connection_status_var.set("✓ Connected to office network")
                    else:
                        self.connection_status_var.set("✗ Not connected to office network")
                else:
                    self.wifi_status_var.set("Not connected to WiFi")
                    self.connection_status_var.set("✗ Not connected to office network")
            except Exception as e:
                self.log(f"Error updating WiFi status: {str(e)}", "error")
        
        # Schedule this to run on the main thread
        self.schedule_ui_task(_update_wifi_status)
    
    def exit_app(self, icon=None):
        """Clean exit of the application"""
        self.running = False
        self.log("Application shutting down")
        
        # Stop the tray icon if it exists
        if self.tray_icon:
            try:
                self.tray_icon.stop()
            except:
                pass
        
        # Destroy the root window if it exists
        if self.root and hasattr(self.root, 'winfo_exists') and self.root.winfo_exists():
            try:
                self.root.quit()
                self.root.destroy()
            except:
                pass
        
        # More cleanup will be handled in Part 3
        sys.exit(0)
    
    def center_window(self, window):
        """Center a tkinter window on the screen"""
        if not window:
            return
            
        try:
            window.update_idletasks()
            width = window.winfo_width()
            height = window.winfo_height()
            x = (window.winfo_screenwidth() // 2) - (width // 2)
            y = (window.winfo_screenheight() // 2) - (height // 2)
            window.geometry(f"{width}x{height}+{x}+{y}")
        except:
            pass
            
    def force_connect_to_office(self):
        """Force connection to office network regardless of actual SSID"""
        self.log("Forcing connection to office network")
        
        # Access the wifi_monitor through the app
        if hasattr(self, 'wifi_monitor'):
            # Set the current SSID to target SSID to force connection
            target_ssid = self.config.get("target_ssid", "GIGLABZ_5G")
            self.wifi_monitor.current_ssid = target_ssid
            self.current_ssid = target_ssid
            
            # Manually trigger connection logic
            if self.wifi_monitor.last_ssid != target_ssid:
                self.wifi_monitor.last_ssid = target_ssid
                self.wifi_monitor.is_connected_to_target = True
                self.wifi_monitor.connection_start_time = time.time()
                
                # Update saved state
                self.wifi_monitor.offline_db.save_connection_state(
                    True, target_ssid, self.wifi_monitor.connection_start_time
                )
                
                # Update UI
                self.update_wifi_status(True, target_ssid)
                
                # Create and send connect event
                self.log("Creating forced connection event")
                connection_data = {
                    "ssid": target_ssid,
                    "ip_address": "127.0.0.1",  # Placeholder
                    "mac_address": self.get_mac_address(),
                    "computer_name": self.get_computer_name(),
                    "timestamp": time.time(),
                    "connection_start_time": time.time(),
                    "connection_start_time_formatted": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "event_type": "connect",
                    "email": self.user_email or ""
                }
                
                # Save locally and send to server if possible
                local_event_id = self.wifi_monitor.offline_db.add_event(connection_data)
                
                if hasattr(self, 'api_client'):
                    def callback(success, message, data=None):
                        if success:
                            self.wifi_monitor.offline_db.mark_as_synced(local_event_id)
                            self.log(f"Forced connection event synced: {local_event_id}")
                            
                    self.api_client.track_connection("connect", connection_data, callback)
                    
                self.log("Force connection completed")
    
    def get_mac_address(self):
        """Get device MAC address"""
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                         for elements in range(0, 48, 8)][::-1])
        return mac

    def get_computer_name(self):
        """Get computer hostname"""
        return platform.node()

# Global app instance
app = None

def main():
    global app
    app = AttendanceApp()

if __name__ == "__main__":
    main()
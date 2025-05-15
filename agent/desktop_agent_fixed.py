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
import traceback
from datetime import datetime

# ===== SUBPROCESS HANDLING - PREVENT COMMAND WINDOWS =====
# This section must be at the top before any other imports that might use subprocess
import subprocess

# Create startupinfo object for Windows to hide console windows
if sys.platform == 'win32':
    STARTUPINFO = subprocess.STARTUPINFO()
    STARTUPINFO.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    CREATE_NO_WINDOW = 0x08000000
    
    # Store original subprocess functions
    original_popen = subprocess.Popen
    original_call = subprocess.call
    original_check_call = subprocess.check_call
    original_check_output = subprocess.check_output
    original_run = getattr(subprocess, 'run', None)  # May not exist in older Python versions
    
    # Override subprocess functions to always hide windows
    def hidden_popen(*args, **kwargs):
        """Ensure Popen never shows a console window"""
        kwargs.setdefault('startupinfo', STARTUPINFO)
        kwargs.setdefault('creationflags', CREATE_NO_WINDOW)
        return original_popen(*args, **kwargs)
    
    def hidden_call(*args, **kwargs):
        """Ensure call never shows a console window"""
        kwargs.setdefault('startupinfo', STARTUPINFO)
        kwargs.setdefault('creationflags', CREATE_NO_WINDOW)
        return original_call(*args, **kwargs)
    
    def hidden_check_call(*args, **kwargs):
        """Ensure check_call never shows a console window"""
        kwargs.setdefault('startupinfo', STARTUPINFO)
        kwargs.setdefault('creationflags', CREATE_NO_WINDOW)
        return original_check_call(*args, **kwargs)
    
    def hidden_check_output(*args, **kwargs):
        """Ensure check_output never shows a console window"""
        kwargs.setdefault('startupinfo', STARTUPINFO)
        kwargs.setdefault('creationflags', CREATE_NO_WINDOW)
        return original_check_output(*args, **kwargs)
    
    # Replace original functions with hidden versions
    subprocess.Popen = hidden_popen
    subprocess.call = hidden_call
    subprocess.check_call = hidden_check_call
    subprocess.check_output = hidden_check_output
    
    # Also replace run if it exists
    if original_run:
        def hidden_run(*args, **kwargs):
            """Ensure run never shows a console window"""
            kwargs.setdefault('startupinfo', STARTUPINFO)
            kwargs.setdefault('creationflags', CREATE_NO_WINDOW)
            return original_run(*args, **kwargs)
        
        subprocess.run = hidden_run

# Define a logger if system_tray_agent hasn't defined one
if 'log_to_file' not in globals():
    log_file = os.path.join(os.path.expanduser('~'), '.office_agent_log.txt')
    
    def log_to_file(message):
        """Write log messages to file instead of console"""
        try:
            with open(log_file, 'a') as f:
                f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}\n")
        except:
            pass  # Silently fail if we can't write to log
    
    # Only redirect output in packaged app
    if getattr(sys, 'frozen', False):
        # Replace print with logging function
        print = log_to_file

# Constants
CONFIG_FILE = os.path.join(os.path.expanduser('~'), '.office_agent_config')
# API_BASE_URL = 'http://192.168.1.8:9600/api/desktop'  # Replace with your server URL
# API_BASE_URL = 'http://localhost:9600/api/desktop'  # Replace with your server URL
API_BASE_URL = 'https://gbooking.giglabz.co.in/api/desktop'  # Replace with your server URL

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
        """Get the current SSID using methods that don't show console windows"""
        ssid = "Unknown"
        
        try:
            # Windows-specific methods
            if sys.platform == 'win32':
                # Method 1: Using netsh (with hidden window)
                try:
                    # Make sure subprocess settings are properly set
                    startupinfo = subprocess.STARTUPINFO()
                    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                    create_no_window = 0x08000000
                    
                    # Execute netsh command with hidden window
                    output = subprocess.check_output(
                        ['netsh', 'wlan', 'show', 'interfaces'], 
                        startupinfo=startupinfo,
                        creationflags=create_no_window,
                        stderr=subprocess.STDOUT
                    ).decode('utf-8', errors='ignore')
                    
                    # Parse the output to find SSID
                    for line in output.split('\n'):
                        if 'SSID' in line and 'BSSID' not in line:
                            parts = line.split(':')
                            if len(parts) >= 2:
                                possible_ssid = parts[1].strip()
                                if possible_ssid and possible_ssid != "":
                                    ssid = possible_ssid
                                    break
                    
                    log_to_file(f"SSID detected via netsh: {ssid}")
                    if ssid != "Unknown":
                        return ssid
                except Exception as e:
                    log_to_file(f"SSID detection via netsh failed: {str(e)}")
                
                # Method 2: Using WMI (doesn't use subprocess)
                try:
                    import wmi
                    c = wmi.WMI()
                    
                    # Try to get Wi-Fi connection information from WMI
                    for network in c.MSFT_WlanConnection():
                        if network.ProfileName:
                            ssid = network.ProfileName
                            log_to_file(f"SSID detected via WMI MSFT_WlanConnection: {ssid}")
                            return ssid
                            
                    # Alternative WMI approach
                    for nic in c.Win32_NetworkAdapter():
                        if nic.NetConnectionStatus == 2:  # 2 = Connected
                            if nic.Name and ("Wi-Fi" in nic.Name or "Wireless" in nic.Name or "WLAN" in nic.Name):
                                connection_id = nic.NetConnectionID
                                if connection_id:
                                    log_to_file(f"SSID detected via Win32_NetworkAdapter: {connection_id}")
                                    return connection_id
                except Exception as e:
                    log_to_file(f"SSID detection via WMI failed: {str(e)}")
                
                # Method 3: Using PowerShell (with hidden window)
                try:
                    startupinfo = subprocess.STARTUPINFO()
                    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                    create_no_window = 0x08000000
                    
                    # Execute PowerShell command with hidden window
                    ps_command = "(Get-NetConnectionProfile).Name"
                    output = subprocess.check_output(
                        ['powershell', '-Command', ps_command],
                        startupinfo=startupinfo,
                        creationflags=create_no_window,
                        stderr=subprocess.STDOUT
                    ).decode('utf-8', errors='ignore').strip()
                    
                    if output and output != "":
                        ssid = output
                        log_to_file(f"SSID detected via PowerShell: {ssid}")
                        return ssid
                except Exception as e:
                    log_to_file(f"SSID detection via PowerShell failed: {str(e)}")
                
                # Method 4: Use the Windows API directly (no subprocess)
                try:
                    import ctypes
                    from ctypes import windll, byref, Structure, POINTER, WINFUNCTYPE
                    from ctypes.wintypes import DWORD, HANDLE, BOOL
                    
                    class WLAN_INTERFACE_INFO_LIST(Structure):
                        pass
                    
                    wlanapi = windll.LoadLibrary('wlanapi.dll')
                    
                    # Open handle to WLAN API
                    handle = HANDLE()
                    client_version = DWORD()
                    negotiated_version = DWORD()
                    wlanapi.WlanOpenHandle(2, None, byref(client_version), byref(handle))
                    
                    # Enumerate interfaces
                    interfaces = POINTER(WLAN_INTERFACE_INFO_LIST)()
                    wlanapi.WlanEnumInterfaces(handle, None, byref(interfaces))
                    
                    # Get connection info for first interface with "connected" status (1)
                    if interfaces and interfaces.contents.dwNumberOfItems > 0:
                        from ctypes.wintypes import BYTE, UINT
                        
                        class DOT11_MAC_ADDRESS(Structure):
                            _fields_ = [("ucDot11MacAddress", BYTE * 6)]
                        
                        class DOT11_SSID(Structure):
                            _fields_ = [
                                ("uSSIDLength", UINT),
                                ("ucSSID", BYTE * 32)
                            ]
                        
                        class WLAN_CONNECTION_ATTRIBUTES(Structure):
                            _fields_ = [
                                ("isState", UINT),
                                ("wlanConnectionMode", UINT),
                                ("strProfileName", ctypes.c_wchar * 256),
                                ("dot11Ssid", DOT11_SSID),
                                ("dot11BssType", UINT),
                                ("dot11BssidList", DOT11_MAC_ADDRESS),
                                ("wlanSignalQuality", UINT),
                                ("rxRate", UINT),
                                ("txRate", UINT)
                            ]
                        
                        conn_info = POINTER(WLAN_CONNECTION_ATTRIBUTES)()
                        for i in range(interfaces.contents.dwNumberOfItems):
                            interface_guid = interfaces.contents.InterfaceInfo[i].InterfaceGuid
                            wlanapi.WlanQueryInterface(
                                handle,
                                byref(interface_guid),
                                7,  # wlan_intf_opcode_current_connection
                                None,
                                byref(client_version),
                                byref(conn_info),
                                None
                            )
                            if conn_info and conn_info.contents.isState == 1:  # connected
                                ssid_bytes = conn_info.contents.dot11Ssid.ucSSID
                                ssid_len = conn_info.contents.dot11Ssid.uSSIDLength
                                if ssid_len > 0:
                                    ssid = "".join(chr(ssid_bytes[i]) for i in range(ssid_len))
                                    log_to_file(f"SSID detected via Windows API: {ssid}")
                                    return ssid
                    
                    # Clean up
                    wlanapi.WlanCloseHandle(handle, None)
                except Exception as e:
                    log_to_file(f"SSID detection via Windows API failed: {str(e)}")
            
            # macOS-specific methods
            elif sys.platform == 'darwin':
                try:
                    # Method 1: Using airport command
                    output = subprocess.check_output(
                        ['/System/Library/PrivateFrameworks/Apple80211.framework/Resources/airport', '-I']
                    ).decode('utf-8')
                    for line in output.split('\n'):
                        if ' SSID:' in line:
                            ssid = line.split(':')[1].strip()
                            log_to_file(f"SSID detected via airport command: {ssid}")
                            return ssid
                except Exception as e:
                    log_to_file(f"SSID detection on macOS failed: {str(e)}")
            
            # Linux-specific methods
            elif sys.platform.startswith('linux'):
                try:
                    # Method 1: Using iwgetid
                    output = subprocess.check_output(['iwgetid', '-r']).decode('utf-8').strip()
                    if output:
                        ssid = output
                        log_to_file(f"SSID detected via iwgetid: {ssid}")
                        return ssid
                except Exception as e:
                    log_to_file(f"SSID detection via iwgetid failed: {str(e)}")
                    
                try:
                    # Method 2: Using nmcli (NetworkManager)
                    output = subprocess.check_output(
                        ['nmcli', '-t', '-f', 'active,ssid', 'dev', 'wifi']
                    ).decode('utf-8')
                    for line in output.split('\n'):
                        if line.startswith('yes:'):
                            ssid = line.split(':')[1]
                            log_to_file(f"SSID detected via nmcli: {ssid}")
                            return ssid
                except Exception as e:
                    log_to_file(f"SSID detection via nmcli failed: {str(e)}")
            
            log_to_file(f"All SSID detection methods failed, returning: {ssid}")
            return ssid
                
        except Exception as outer_e:
            log_to_file(f"Critical error in get_current_ssid: {str(outer_e)}")
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
            
            # Get fresh network information 
            current_ssid = NetworkMonitor.get_current_ssid()
            current_ip = NetworkMonitor.get_ip_address()
            current_mac = NetworkMonitor.get_mac_address()
            computer_name = NetworkMonitor.get_computer_name()
            
            if is_connect:
                payload = {
                    "event_type": "connect",
                    "ssid": current_ssid,
                    "email": self.user_data['email'],
                    "ip_address": current_ip,
                    "mac_address": current_mac,
                    "computer_name": computer_name,
                    "connection_start_time": current_time,
                    "connection_start_time_formatted": formatted_time
                }
                print(f"Attempting to connect with SSID: {current_ssid}, IP: {current_ip}")
                self.connection_start_time = current_time
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
                    "ssid": current_ssid,
                    "email": self.user_data['email'],
                    "ip_address": current_ip,
                    "mac_address": current_mac,
                    "computer_name": computer_name,
                    "connection_duration": duration,
                    "connection_duration_formatted": duration_formatted
                }
                print(f"Disconnecting from {current_ssid} after {duration_formatted}")
            
            # Set a timeout for the request to avoid hanging
            try:
                response = self.session.post(
                    f"{API_BASE_URL}/track-connection", 
                    json=payload,
                    timeout=15  # 15-second timeout
                )
                response_data = response.json()
                
                if response.status_code == 200 and response_data.get('success'):
                    # Update connection status based on request type
                    if is_connect:
                        self.connected = True
                        # Reset the heartbeat counter after successful connection
                        self.last_heartbeat_time = current_time
                    else:
                        self.connected = False
                        self.connection_start_time = None
                        
                    return True, response_data['message']
                else:
                    error_msg = response_data.get('message', 'Tracking failed') 
                    print(f"Connection tracking failed: {error_msg}")
                    return False, error_msg
                    
            except requests.exceptions.RequestException as req_err:
                print(f"Network error during connection tracking: {str(req_err)}")
                return False, f"Network error: {str(req_err)}"
                
        except Exception as e:
            print(f"Critical error in track_connection: {str(e)}")
            return False, f"Tracking error: {str(e)}"
    
    def send_heartbeat(self):
        """Send heartbeat to server to confirm connection is still active"""
        if not self.connected:
            return False, "Not connected"
            
        try:
            current_time = int(time.time())
            formatted_time = datetime.fromtimestamp(current_time).strftime('%Y-%m-%d %H:%M:%S')
            
            # Get fresh network information with each heartbeat
            current_ssid = NetworkMonitor.get_current_ssid()
            current_ip = NetworkMonitor.get_ip_address()
            
            payload = {
                "event_type": "heartbeat",
                "ssid": current_ssid,
                "email": self.user_data['email'],
                "ip_address": current_ip,
                "mac_address": NetworkMonitor.get_mac_address(),
                "computer_name": NetworkMonitor.get_computer_name(),
                "heartbeat_time": current_time,
                "heartbeat_time_formatted": formatted_time
            }
            
            # Set a timeout for the request to avoid hanging
            try:
                response = self.session.post(
                    f"{API_BASE_URL}/track-connection", 
                    json=payload,
                    timeout=15  # 15-second timeout
                )
                response_data = response.json()
                
                if response.status_code == 200 and response_data.get('success'):
                    self.last_heartbeat_time = current_time
                    print(f"Heartbeat sent successfully at {formatted_time} on network {current_ssid}")
                    return True, response_data['message']
                else:
                    print(f"Heartbeat failed: {response_data.get('message', 'Unknown error')}")
                    
                    # Return failure for any error message from server
                    return False, response_data.get('message', 'Heartbeat failed')
                    
            except requests.exceptions.RequestException as req_err:
                print(f"Network error during heartbeat: {str(req_err)}")
                return False, f"Network error: {str(req_err)}"
                
        except Exception as e:
            print(f"Critical error in send_heartbeat: {str(e)}")
            # If there's an exception during heartbeat, signal reconnection needed
            return False, f"Critical heartbeat error: {str(e)}"


class ConfigManager:
    """Class to handle configuration file operations"""
    
    @staticmethod
    def save_credentials(email, password):
        """Save credentials to config file"""
        try:
            # Create parent directory if it doesn't exist
            config_dir = os.path.dirname(CONFIG_FILE)
            if not os.path.exists(config_dir) and config_dir:
                os.makedirs(config_dir, exist_ok=True)
                
            config = configparser.ConfigParser()
            config['Credentials'] = {
                'email': email,
                'password': password  # In a real app, consider encrypting this
            }
            
            print(f"Writing config to: {CONFIG_FILE}")
            with open(CONFIG_FILE, 'w') as configfile:
                config.write(configfile)
            
            # Set appropriate permissions
            try:
                os.chmod(CONFIG_FILE, 0o600)  # User read/write only
            except Exception as perm_error:
                print(f"Warning: Could not set file permissions: {str(perm_error)}")
                
            return True
        except Exception as e:
            print(f"Error saving credentials: {str(e)}")
            raise
    
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
        try:
            print(f"Attempting to login with email: {self.email}")
            print(f"API URL: {API_BASE_URL}")
            success, message = self.api_client.login(self.email, self.password)
            
            if success:
                print(f"Successfully logged in: {message}")
                # Save credentials for next time
                try:
                    ConfigManager.save_credentials(self.email, self.password)
                    print(f"Credentials saved to {CONFIG_FILE}")
                except Exception as config_error:
                    print(f"Warning: Could not save credentials: {str(config_error)}")
                return True
            else:
                print(f"Login failed: {message}")
                return False
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            raise
    
    def check_network(self):
        """Check network status and handle connections/disconnections"""
        try:
            current_ssid = NetworkMonitor.get_current_ssid()
            
            # Print current status
            print(f"Current network: {current_ssid}")
            
            # For Windows Subsystem for Linux (WSL) or when can't detect network properly
            if sys.platform == 'win32' or 'linux' in sys.platform.lower():
                # If we previously weren't connected, try to connect now
                if self.previous_ssid == "Unknown" and not self.api_client.connected:
                    print("Forcing connection in Windows/Linux environment")
                    try:
                        success, message = self.api_client.track_connection(is_connect=True)
                        if success:
                            print(f"Forced connection: {message}")
                            self.api_client.connected = True
                        else:
                            print(f"Forced connection tracking failed: {message}")
                    except Exception as e:
                        print(f"Error in force connection: {str(e)}")
            
            # Normal network transition handling
            else:
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
                    print(f"SSID change detected: {self.previous_ssid} -> {current_ssid}")
                    
                    # Only try to disconnect if we're actually connected
                    if self.api_client.connected:
                        # First disconnect from previous network
                        success, message = self.api_client.track_connection(is_connect=False)
                        if success:
                            print(f"Disconnected from {self.previous_ssid}: {message}")
                        else:
                            print(f"Disconnection tracking failed: {message}")
                        
                        # Brief pause to ensure server processes the disconnect event
                        time.sleep(1)
                    
                    # Then connect to new network
                    success, message = self.api_client.track_connection(is_connect=True)
                    if success:
                        print(f"Connected to {current_ssid}: {message}")
                        self.api_client.connected = True  # Explicitly set connected flag
                    else:
                        print(f"Connection tracking failed: {message}")
            
            # Update previous SSID
            self.previous_ssid = current_ssid
            
        except Exception as e:
            print(f"Error in check_network: {str(e)}")
    
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
                
                # Send heartbeat every 1 minute (2 cycles) - more frequent to prevent timeouts
                heartbeat_counter += 1
                if heartbeat_counter >= 2:
                    heartbeat_counter = 0
                    
                    # Always check current connection state
                    current_ssid = NetworkMonitor.get_current_ssid()
                    
                    # Debug connection state
                    print(f"Heartbeat check: connected={self.api_client.connected}, current_ssid={current_ssid}, previous_ssid={self.previous_ssid}")
                    
                    # Force heartbeat even if we think we're not connected
                    try:
                        # Check if SSID changed
                        if current_ssid != self.previous_ssid and current_ssid != "Unknown":
                            print(f"SSID changed during heartbeat check: {self.previous_ssid} -> {current_ssid}")
                            # Update previous SSID
                            self.previous_ssid = current_ssid
                            
                            # Force reconnection with new SSID
                            print("Forcing reconnection due to SSID change")
                            reconnect_success, reconnect_message = self.api_client.track_connection(is_connect=True)
                            if reconnect_success:
                                self.api_client.connected = True
                                print(f"Successfully reconnected after SSID change: {reconnect_message}")
                            else:
                                print(f"Failed to reconnect after SSID change: {reconnect_message}")
                        elif self.api_client.connected:
                            # Normal heartbeat
                            print(f"Sending heartbeat at {time.strftime('%H:%M:%S')}")
                            success, message = self.api_client.send_heartbeat()
                            if not success:
                                # If server reports session not found or any other error during heartbeat,
                                # force a reconnection to ensure the session is tracked properly
                                print(f"Heartbeat failed with message: {message}. Attempting to reconnect...")
                                # Then reconnect
                                reconnect_success, reconnect_message = self.api_client.track_connection(is_connect=True)
                                if reconnect_success:
                                    self.api_client.connected = True
                                    print(f"Successfully reconnected after heartbeat failure: {reconnect_message}")
                                else:
                                    print(f"Failed to reconnect after heartbeat failure: {reconnect_message}")
                        else:
                            # Not connected, try to connect
                            print("Not connected during heartbeat check, attempting to connect...")
                            connect_success, connect_message = self.api_client.track_connection(is_connect=True)
                            if connect_success:
                                self.api_client.connected = True
                                print(f"Successfully connected during heartbeat check: {connect_message}")
                            else:
                                print(f"Failed to connect during heartbeat check: {connect_message}")
                    except Exception as e:
                        print(f"Critical error during heartbeat check: {str(e)}")
                        # Try to reconnect on error
                        try:
                            self.api_client.track_connection(is_connect=True)
                        except:
                            pass
                
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
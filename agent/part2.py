#!/usr/bin/env python3
# Part 2: Authentication and API Communication

import os
import json
import time
import requests
import threading
import keyring
from urllib.parse import urljoin
from datetime import datetime, timedelta
import uuid
import platform
import subprocess
import tkinter as tk
from PIL import Image

class ApiClient:
    def __init__(self, app):
        self.app = app
        self.base_url = app.config.get("api_base_url", "http://localhost:9600")
        self.access_token = None
        self.user_data = None
        self.token_service_name = "AttendanceTracker"
        self.token_username = "access_token"
        self.offline_mode = False
        self.token_expiry = None
        self.refresh_token = None
        
        # Try to load saved token
        self._load_token()
        
        # Start token refresh thread if token exists
        if self.access_token and self.refresh_token:
            self._start_token_refresh_thread()
    
    def _load_token(self):
        """Load saved token from secure storage"""
        try:
            token = keyring.get_password(self.token_service_name, self.token_username)
            if token:
                saved_data = json.loads(token)
                self.access_token = saved_data.get("token")
                self.refresh_token = saved_data.get("refresh_token")
                self.token_expiry = saved_data.get("expiry")
                self.user_data = saved_data.get("user_data")
                self.app.user_email = saved_data.get("email")
                
                # Check if token is expired
                if self.token_expiry and time.time() > self.token_expiry:
                    self.app.log("Saved token is expired, will try to refresh")
                    # We'll still set is_logged_in to True and try to refresh in the background
                
                self.app.is_logged_in = True
                self.app.log("Loaded saved authentication token")
                return True
        except Exception as e:
            self.app.log(f"Error loading saved token: {str(e)}", "error")
        return False
    
    def _save_token(self, token, refresh_token=None, expiry=None, user_data=None, email=None):
        """Save token to secure storage"""
        try:
            # Use existing values if not provided
            refresh_token = refresh_token or self.refresh_token
            user_data = user_data or self.user_data
            email = email or self.app.user_email
            expiry = expiry or self.token_expiry
            
            saved_data = {
                "token": token,
                "refresh_token": refresh_token,
                "expiry": expiry,
                "user_data": user_data,
                "email": email
            }
            keyring.set_password(self.token_service_name, self.token_username, json.dumps(saved_data))
            self.app.log("Saved authentication token")
        except Exception as e:
            self.app.log(f"Error saving token: {str(e)}", "error")
    
    def _clear_token(self):
        """Clear saved token from secure storage"""
        try:
            keyring.delete_password(self.token_service_name, self.token_username)
            self.app.log("Cleared authentication token")
        except Exception as e:
            self.app.log(f"Error clearing token: {str(e)}", "error")
    
    def _refresh_token_task(self):
        """Background task to refresh token before it expires"""
        while self.running and self.access_token and self.refresh_token:
            # Calculate time until token expires
            if self.token_expiry:
                now = time.time()
                time_until_expiry = self.token_expiry - now
                
                # If token expires in less than 5 minutes, refresh it
                if time_until_expiry < 300:
                    self.app.log("Token is about to expire, refreshing...")
                    self._refresh_token_now()
                
                # Sleep for a while (check every minute)
                time.sleep(60)
            else:
                # If we don't know when token expires, check every 30 minutes
                time.sleep(1800)
    
    def _start_token_refresh_thread(self):
        """Start background thread for token refresh"""
        self.running = True
        self.refresh_thread = threading.Thread(target=self._refresh_token_task, daemon=True)
        self.refresh_thread.start()
    
    def _stop_token_refresh_thread(self):
        """Stop token refresh thread"""
        self.running = False
        if hasattr(self, 'refresh_thread') and self.refresh_thread.is_alive():
            self.refresh_thread.join(timeout=1.0)
    
    def _refresh_token_now(self):
        """Refresh the access token using refresh token"""
        self.app.log("Attempting to refresh token")
        
        if not self.refresh_token:
            self.app.log("No refresh token available", "warning")
            return False
            
        url = urljoin(self.base_url, "/api/desktop/refresh-token")
        payload = {"refresh_token": self.refresh_token}
        
        try:
            self.app.log(f"Sending refresh token request to {url}")
            response = requests.post(url, json=payload, timeout=10)
            self.app.log(f"Received refresh token response: status={response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.app.log(f"Refresh token response success: {data.get('success', False)}")
                    
                    if data.get("success"):
                        # Extract and store new tokens
                        token_data = data.get("data", {})
                        new_token = token_data.get("accessToken")
                        new_refresh_token = token_data.get("refreshToken")
                        expires_in = token_data.get("expiresIn", 3600)
                        expiry = time.time() + expires_in
                        
                        if new_token:
                            self.app.log(f"Got new access token, expires in {expires_in} seconds")
                            self.access_token = new_token
                            if new_refresh_token:
                                self.refresh_token = new_refresh_token
                                self.app.log("Got new refresh token")
                            self.token_expiry = expiry
                            
                            # Reset offline mode since we can reach the server
                            self.offline_mode = False
                            
                            # Save updated tokens
                            self._save_token(new_token, new_refresh_token, expiry)
                            
                            self.app.log("Token refreshed successfully")
                            return True
                        else:
                            self.app.log("Response missing access token", "warning")
                except Exception as json_err:
                    self.app.log(f"Error parsing refresh token response: {str(json_err)}", "error")
            
            # Handle specific error cases
            if response.status_code == 401:
                self.app.log("Token refresh failed: Invalid refresh token", "warning")
                # Token is invalid, clear saved token
                self.access_token = None
                self.refresh_token = None
                self.token_expiry = None
                self._clear_token()
                self.app.is_logged_in = False
            else:
                self.app.log(f"Failed to refresh token: status={response.status_code}, reason={response.reason}", "warning")
            
            return False
            
        except requests.RequestException as e:
            self.app.log(f"Token refresh network error: {str(e)}", "error")
            # Enter offline mode if we can't reach the server
            self.offline_mode = True
            return False
        except Exception as e:
            self.app.log(f"Unexpected error during token refresh: {str(e)}", "error")
            return False
    
    def check_online_status(self):
        """Check if we can connect to the API server"""
        try:
            response = requests.get(self.base_url, timeout=5)
            self.offline_mode = False
            return True
        except requests.RequestException:
            self.offline_mode = True
            return False
    
    def get_mac_address(self):
        """Get device MAC address"""
        try:
            mac = ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                           for elements in range(0, 48, 8)][::-1])
            return mac
        except Exception as e:
            self.app.log(f"Error getting MAC address: {str(e)}", "error")
            return "00:00:00:00:00:00"
    
    def get_current_ssid(self):
        """Get the current WiFi SSID (platform-specific)"""
        try:
            if platform.system() == "Windows":
                # Windows implementation using netsh
                output = subprocess.check_output(["netsh", "wlan", "show", "interfaces"], 
                                                universal_newlines=True)
                for line in output.split("\n"):
                    if "SSID" in line and "BSSID" not in line:
                        ssid = line.split(":", 1)[1].strip()
                        return ssid if ssid else "Unknown"
                        
            elif platform.system() == "Darwin":  # macOS
                # macOS implementation using airport
                airport_path = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
                output = subprocess.check_output([airport_path, "-I"], universal_newlines=True)
                for line in output.split("\n"):
                    if " SSID:" in line:
                        ssid = line.split(":", 1)[1].strip()
                        return ssid if ssid else "Unknown"
                        
            else:  # Linux
                # Linux implementation using nmcli
                output = subprocess.check_output(["nmcli", "-t", "-f", "active,ssid", "dev", "wifi"], 
                                               universal_newlines=True)
                for line in output.split("\n"):
                    if line.startswith("yes:"):
                        ssid = line.split(":", 1)[1].strip()
                        return ssid if ssid else "Unknown"
                        
        except (subprocess.SubprocessError, FileNotFoundError, OSError) as e:
            self.app.log(f"Error getting WiFi SSID: {str(e)}", "error")
            
        # If we failed to get the SSID, return the target SSID
        return self.app.config.get("target_ssid", "Vadakkemadom 5g")
    
    def login(self, email, password, callback=None):
        """Login to the API and get access token"""
        url = urljoin(self.base_url, "/api/desktop/login")
        
        # Get system information - directly instead of relying on app properties
        mac_address = self.get_mac_address()
        current_ssid = self.get_current_ssid()
        
        self.app.log(f"Login attempt for {email} with MAC: {mac_address}, SSID: {current_ssid}")
        
        payload = {
            "email": email,
            "password": password,
            "macAddress": mac_address,
            "ssid": current_ssid
        }
        
        def _do_login():
            self.app.log("Starting login process in background thread")
            # First check if we're online
            if not self.check_online_status():
                self.app.log("Login failed: Cannot connect to server", "error")
                if callback:
                    callback(False, "Cannot connect to server. Check your internet connection.")
                return
                
            try:
                # Log request details (without password)
                safe_payload = dict(payload)
                safe_payload["password"] = "*****"  # Mask password in logs
                self.app.log(f"Sending login request to {url} with payload: {json.dumps(safe_payload)}")
                
                # Perform the API request
                response = requests.post(url, json=payload, timeout=10)
                self.app.log(f"Received login response: status={response.status_code}")
                
                try:
                    # Try to parse the response as JSON
                    response_data = response.json()
                    self.app.log(f"Response data: success={response_data.get('success', False)}")
                except Exception as e:
                    self.app.log(f"Error parsing response as JSON: {str(e)}", "error")
                    response_data = {"success": False, "message": "Invalid server response"}
                
                # Handle success case (200 + success flag)
                if response.status_code == 200 and response_data.get("success"):
                    # Extract and store token
                    user_data = response_data.get("data", {})
                    token = user_data.get("accessToken")
                    refresh_token = user_data.get("refreshToken")
                    expires_in = user_data.get("expiresIn", 3600)
                    
                    if token:
                        self.app.log(f"Got valid login token for user {email}")
                        self.access_token = token
                        self.refresh_token = refresh_token
                        self.token_expiry = time.time() + expires_in
                        self.user_data = user_data
                        self.app.user_email = email
                        self.app.is_logged_in = True
                        
                        # Save token securely
                        self._save_token(token, refresh_token, self.token_expiry, user_data, email)
                        
                        # Start token refresh thread
                        self._start_token_refresh_thread()
                        
                        self.app.log(f"User {email} logged in successfully, calling callback")
                        self.offline_mode = False
                        
                        if callback:
                            callback(True, "Login successful")
                        return
                    else:
                        self.app.log("Login response missing token", "error")
                        if callback:
                            callback(False, "Invalid server response: missing token")
                        return
                
                # Handle 200 response with failure (API error)
                if response.status_code == 200 and not response_data.get("success"):
                    error_msg = response_data.get("message", "Login failed: reason unknown")
                    self.app.log(f"Login failed: {error_msg}", "error")
                    
                    if callback:
                        callback(False, error_msg)
                    return
                
                # Handle specific HTTP error cases
                if response.status_code == 400:
                    data = response_data
                    message = data.get("message", "Login failed")
                    
                    # Check if user is already registered with another device
                    if message and "already registered" in message.lower():
                        error_msg = "User already registered with another device"
                    else:
                        error_msg = message
                        
                    self.app.log(f"Login failed (400): {error_msg}", "error")
                    
                    if callback:
                        callback(False, error_msg)
                    return
                        
                elif response.status_code == 401:
                    error_msg = "Invalid email or password"
                    self.app.log(f"Login failed (401): {error_msg}", "error")
                    
                    if callback:
                        callback(False, error_msg)
                    return
                
                # General HTTP error
                self.app.log(f"Login failed with status code {response.status_code}: {response.reason}", "error")
                
                if callback:
                    callback(False, f"Login failed: {response.reason}")
                    
            except requests.RequestException as e:
                self.app.log(f"Login request error: {str(e)}", "error")
                self.offline_mode = True
                
                if callback:
                    callback(False, f"Connection error: {str(e)}")
            except Exception as e:
                self.app.log(f"Unexpected error during login: {str(e)}", "error")
                
                if callback:
                    callback(False, f"Unexpected error: {str(e)}")
        
        # Run the login request in a separate thread
        login_thread = threading.Thread(target=_do_login, daemon=True)
        login_thread.start()
        self.app.log(f"Started login thread for {email}")
    
    def logout(self, callback=None):
        """Logout from the API"""
        if not self.access_token:
            if callback:
                callback(True, "Already logged out")
            return
            
        url = urljoin(self.base_url, "/api/desktop/logout")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        def _do_logout():
            # Always stop the token refresh thread
            self._stop_token_refresh_thread()
            
            # Check if we need to also send a disconnect event
            should_send_disconnect = False
            
            # If we have a WiFi monitor and we're connected to target
            if hasattr(self.app, 'wifi_monitor') and self.app.wifi_monitor.is_connected_to_target:
                self.app.log("Also sending disconnect event before logout")
                should_send_disconnect = True
                
                # Get disconnect data
                disconnect_data = {
                    "ssid": self.app.wifi_monitor.target_ssid,
                    "ip_address": self.app.wifi_monitor.get_local_ip(),
                    "mac_address": self.app.get_mac_address(),
                    "computer_name": self.app.get_computer_name(),
                    "timestamp": time.time(),
                    "connection_start_time": self.app.wifi_monitor.connection_start_time,
                    "connection_start_time_formatted": datetime.fromtimestamp(
                        self.app.wifi_monitor.connection_start_time).strftime("%Y-%m-%d %H:%M:%S")
                }
                
                # Calculate duration
                if self.app.wifi_monitor.connection_start_time:
                    duration = time.time() - self.app.wifi_monitor.connection_start_time
                    formatted_duration = self.app.wifi_monitor.format_duration(duration)
                    disconnect_data["connection_duration"] = duration
                    disconnect_data["connection_duration_formatted"] = formatted_duration
                
                # Save the disconnect event
                disconnect_data["event_type"] = "disconnect"
                disconnect_data["email"] = self.app.user_email or ""
                self.app.log("Saving disconnection event to local DB")
                local_event_id = self.app.wifi_monitor.offline_db.add_event(disconnect_data)
                
                # Update connection state
                self.app.wifi_monitor.is_connected_to_target = False
                self.app.wifi_monitor.offline_db.save_connection_state(False)
                
                # Send disconnect event
                try:
                    # Create a proper callback function with a default argument for data
                    def disconnect_callback(success, msg, data=None):
                        self.app.log(f"Disconnect result: {success}: {msg}")
                    
                    self.track_connection("disconnect", disconnect_data, disconnect_callback)
                except Exception as e:
                    self.app.log(f"Error sending disconnect event: {str(e)}", "error")
            
            try:
                # Only attempt server communication if online
                if not self.offline_mode:
                    self.app.log("Sending logout request to server")
                    response = requests.post(url, headers=headers, timeout=10)
                    
                    if response.status_code == 200:
                        self.app.log("User logged out successfully on server")
                    else:
                        self.app.log(f"Logout failed with status code {response.status_code}")
                
                # Clear token regardless of response or online status
                self.access_token = None
                self.refresh_token = None
                self.token_expiry = None
                self.user_data = None
                self.app.is_logged_in = False
                self._clear_token()
                
                self.app.log("User logged out locally")
                
                if callback:
                    callback(True, "Logout successful")
                        
            except requests.RequestException as e:
                self.app.log(f"Logout request error: {str(e)}", "error")
                self.offline_mode = True
                
                # Still clear local token
                self.access_token = None
                self.refresh_token = None
                self.token_expiry = None
                self.user_data = None
                self.app.is_logged_in = False
                self._clear_token()
                
                if callback:
                    callback(True, "Logged out locally")
        
        # Run the logout request in a separate thread
        threading.Thread(target=_do_logout).start()
    
    def track_connection(self, event_type, connection_data, callback=None):
        """Send connection tracking data to API"""
        if not self.access_token:
            self.app.log("Cannot track connection: Not logged in", "warning")
            if callback:
                callback(False, "Not logged in")
            return
            
        url = urljoin(self.base_url, "/api/desktop/track-connection")
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Prepare payload
        payload = {
            "event_type": event_type,
            "ssid": connection_data.get("ssid", ""),
            "email": self.app.user_email,
            "ip_address": connection_data.get("ip_address", ""),
            "mac_address": connection_data.get("mac_address", ""),
            "computer_name": connection_data.get("computer_name", ""),
            "timestamp": connection_data.get("timestamp", time.time()),
            "connection_start_time": connection_data.get("connection_start_time", time.time()),
            "connection_start_time_formatted": connection_data.get("connection_start_time_formatted", 
                                                                 datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        }
        
        # Add duration fields for disconnect events
        if event_type == "disconnect":
            payload["connection_duration"] = connection_data.get("connection_duration", 0)
            payload["connection_duration_formatted"] = connection_data.get("connection_duration_formatted", "00:00:00")
        
        def _do_track():
            # If we're in offline mode, don't even try to connect
            if self.offline_mode:
                self.app.log("In offline mode, storing connection data locally", "info")
                if callback:
                    callback(False, "In offline mode, connection data stored locally")
                return
                
            try:
                # Define headers for authentication
                headers = {"Authorization": f"Bearer {self.access_token}"}  # Add this line
                response = requests.post(url, json=payload, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        record_id = data.get("data", {}).get("recordId")
                        
                        if event_type == "connect":
                            self.app.log(f"Connection tracked successfully (ID: {record_id})")
                        else:
                            duration = data.get("data", {}).get("duration", "00:00:00")
                            self.app.log(f"Disconnection tracked successfully (ID: {record_id}, Duration: {duration})")
                        
                        if callback:
                            callback(True, "Connection tracked successfully", data.get("data"))
                        return
                
                # If unauthorized, try to refresh token and retry
                if response.status_code == 401:
                    self.app.log("Unauthorized while tracking connection, trying to refresh token", "warning")
                    if self._refresh_token_now():
                        # Try again with new token
                        headers = {"Authorization": f"Bearer {self.access_token}"}
                        response = requests.post(url, json=payload, headers=headers, timeout=10)
                        
                        if response.status_code == 200:
                            data = response.json()
                            if data.get("success"):
                                if callback:
                                    callback(True, "Connection tracked successfully after token refresh", data.get("data"))
                                return
                
                # Handle error
                self.app.log(f"Connection tracking failed with status code {response.status_code}", "error")
                
                if callback:
                    callback(False, f"Failed to track connection: {response.reason}")
                    
            except requests.RequestException as e:
                self.app.log(f"Connection tracking request error: {str(e)}", "error")
                self.offline_mode = True
                
                if callback:
                    callback(False, "Connection error. Connection data will be stored locally.")
        
        # Run the tracking request in a separate thread
        threading.Thread(target=_do_track).start()

# Provide an explicit 'extend_app_authentication' function that must be exported
def extend_app_authentication(app):
    """
    Extend AttendanceApp with authentication functions
    This is the main exported function for this module
    """
    # Initialize API client
    app.api_client = ApiClient(app)
    
    # Add a status indicator for online/offline mode
    app.is_online = True  # Default to online
    
    # Override login handler
    original_handle_login = app.handle_login
    
    def handle_login_extended():
        # Get credentials directly - this is already running on the UI thread
        # when the login button is clicked
        try:
            email = app.email_var.get()
            password = app.password_var.get()
            
            if not email or not password:
                app.status_var.set("Please enter both email and password")
                return
                
            # Update status
            app.status_var.set("Logging in...")
            app.log(f"Login attempt for user: {email}")
            
            # Define a simpler callback function
            def login_callback(success, message):
                app.log(f"Login callback: success={success}, message={message}")
                
                if success:
                    # We need to make sure we update UI on the main thread
                    def update_ui_after_login():
                        try:
                            # First set status
                            app.status_var.set("Login successful")
                            app.log("Showing main window after successful login")
                            # Then show main window
                            app.show_main_window()
                        except Exception as e:
                            app.log(f"Error updating UI after login: {str(e)}", "error")
                            print(f"UI update error: {str(e)}")
                    
                    # Use after() to schedule on main thread if possible
                    if app.root and hasattr(app.root, 'after'):
                        try:
                            # Schedule immediate execution
                            app.root.after(10, update_ui_after_login)
                            app.log("Scheduled UI update after login")
                        except Exception as e:
                            app.log(f"Error scheduling UI update: {str(e)}", "error")
                            # Try direct approach
                            update_ui_after_login()
                    elif hasattr(app, 'schedule_ui_task'):
                        # Use our queue mechanism
                        app.schedule_ui_task(update_ui_after_login)
                        app.log("Queued UI update after login")
                    else:
                        # Direct call - potential thread issue
                        print("Warning: Direct UI update may cause thread issues")
                        update_ui_after_login()
                else:
                    # Error handling - update status
                    def update_error_status():
                        try:
                            app.status_var.set(message)
                            app.log(f"Login failed: {message}")
                        except Exception as e:
                            app.log(f"Error updating status: {str(e)}", "error")
                            print(f"Login error: {message}")
                    
                    # Schedule on main thread
                    if app.root and hasattr(app.root, 'after'):
                        app.root.after(10, update_error_status)
                    elif hasattr(app, 'schedule_ui_task'):
                        app.schedule_ui_task(update_error_status)
                    else:
                        update_error_status()
            
            # Start the login process
            app.log(f"Calling api_client.login for user: {email}")
            app.api_client.login(email, password, login_callback)
            
        except Exception as e:
            app.log(f"Error in handle_login_extended: {str(e)}", "error")
            print(f"Login error: {str(e)}")
            try:
                app.status_var.set(f"Error: {str(e)}")
            except:
                print(f"Could not update status: {str(e)}")
    
    app.handle_login = handle_login_extended
    
    # Override logout handler
    original_handle_logout = app.handle_logout
    
    def handle_logout_extended():
        # Safe access to status_var - use thread-safe method
        if hasattr(app, 'status_var'):
            # Define the UI update function
            def update_status():
                try:
                    app.status_var.set("Logging out...")
                except Exception as e:
                    print(f"Error updating status: {str(e)}")
            
            # Schedule it to run on main thread
            if hasattr(app, 'schedule_ui_task'):
                app.schedule_ui_task(update_status)
            else:
                # Fallback if schedule_ui_task is not available
                try:
                    app.status_var.set("Logging out...")
                except Exception:
                    print("Logging out...")
        else:
            print("Logging out...")
        
        def logout_callback(success, message):
            if success:
                print("Logged out")
                
                # Schedule UI tasks on the main thread
                if hasattr(app, 'schedule_ui_task'):
                    # Define a function to safely destroy the window
                    def safe_destroy_and_show_login():
                        try:
                            # First get a reference to the current root
                            root = app.root
                            # Set app.root to None to prevent further access
                            app.root = None
                            
                            # Now destroy the window
                            if root and hasattr(root, 'destroy'):
                                root.destroy()
                                
                            # Schedule showing login window with slight delay to ensure complete cleanup
                            app.root = None  # Ensure root is None before new window creation
                            app.show_login()
                        except Exception as e:
                            print(f"Error in window transition: {str(e)}")
                    
                    # Add delay to ensure all pending UI operations complete
                    if app.root and hasattr(app.root, 'after'):
                        try:
                            # Schedule window transition after 100ms
                            app.root.after(100, safe_destroy_and_show_login)
                        except Exception as e:
                            # Fallback if scheduling fails
                            print(f"Error scheduling window transition: {str(e)}")
                            # Try direct approach
                            try:
                                app.root = None
                                app.show_login()
                            except Exception as e2:
                                print(f"Error showing login: {str(e2)}")
                else:
                    # Fallback to old method if schedule_ui_task isn't available
                    # First set app.root to None to prevent further access
                    root = app.root
                    app.root = None
                    
                    # Now attempt to destroy the window
                    if root and hasattr(root, 'destroy'):
                        try:
                            root.destroy()
                        except Exception as e:
                            print(f"Error destroying window: {str(e)}")
                    
                    # Show login with delay
                    def delayed_login():
                        time.sleep(0.5)
                        try:
                            app.show_login()
                        except Exception as e:
                            print(f"Error showing login: {str(e)}")
                    
                    threading.Thread(target=delayed_login, daemon=True).start()
            else:
                # Handle failure case
                if hasattr(app, 'status_var') and hasattr(app, 'schedule_ui_task'):
                    # Thread-safe status update
                    def update_error_status():
                        try:
                            app.status_var.set(message)
                        except Exception:
                            print(f"Logout error: {message}")
                    
                    app.schedule_ui_task(update_error_status)
                elif hasattr(app, 'status_var'):
                    # Direct update as fallback
                    try:
                        app.status_var.set(message)
                    except Exception:
                        print(f"Logout error: {message}")
                else:
                    print(f"Logout error: {message}")
        
        app.api_client.logout(logout_callback)
    
    app.handle_logout = handle_logout_extended
    
    # Add a check_login function
    def check_login():
        """Check if user is already logged in with saved token"""
        if app.api_client.access_token:
            app.is_logged_in = True
            app.user_email = app.api_client.user_data.get("email") if app.api_client.user_data else None
            
            # Start a background check for token validity/refresh
            def background_token_check():
                # Wait a moment to ensure app is fully initialized
                time.sleep(1)
                # Try to check online status
                app.api_client.check_online_status()
                # If token needs refresh, do it
                if app.api_client.token_expiry and time.time() > app.api_client.token_expiry - 300:
                    app.api_client._refresh_token_now()
            
            threading.Thread(target=background_token_check, daemon=True).start()
            
            return True
        return False
    
    app.check_login = check_login
    
    # Add a function to update online/offline status display
    def update_online_status():
        def _update_online_status_ui():
            try:
                if hasattr(app, 'online_status_var'):
                    status = "Online" if not app.api_client.offline_mode else "Offline"
                    app.online_status_var.set(f"Status: {status}")
                    
                    # Change color based on status
                    if hasattr(app, 'online_status_label'):
                        color = "green" if not app.api_client.offline_mode else "red"
                        app.online_status_label.config(fg=color)
            except Exception as e:
                app.log(f"Error updating online status UI: {str(e)}", "error")
        
        # Use thread-safe update if available
        if hasattr(app, 'schedule_ui_task'):
            app.schedule_ui_task(_update_online_status_ui)
        else:
            # Direct update as fallback
            try:
                _update_online_status_ui()
            except Exception as e:
                app.log(f"Error in update_online_status: {str(e)}", "error")
    
    app.update_online_status = update_online_status
    
    # Modify the show_main_window method to display online/offline status
    original_show_main_window = app.show_main_window
    
    def show_main_window_extended():
        # This entire function will be executed on the main thread
        def _main_window_setup():
            try:
                # Check if root exists and is valid
                if hasattr(app, 'root') and app.root:
                    try:
                        # Test if the root window is still valid
                        exists = app.root.winfo_exists()
                        # If valid, destroy existing widgets
                        if exists:
                            for widget in app.root.winfo_children():
                                widget.destroy()
                        else:
                            # If not valid, set to None so a new one will be created
                            app.root = None
                    except (AttributeError, tk.TclError):
                        # If not valid, set to None so a new one will be created
                        app.root = None
                
                try:
                    # Call original function which will create a new window if needed
                    original_show_main_window()
                except Exception as e:
                    app.log(f"Error showing main window: {str(e)}", "error")
                    # Create a fresh window
                    app.root = None
                    app.root = tk.Tk()
                    app.root.title(f"{app.__class__.__name__} - Connected")
                    app.root.geometry("400x300")
                    app.root.protocol("WM_DELETE_WINDOW", app.minimize_to_tray)
                    
                    frame = tk.Frame(app.root, padx=20, pady=20)
                    frame.pack(fill="both", expand=True)
                    
                    # Welcome message
                    welcome_label = tk.Label(frame, text=f"Welcome, {app.user_email}", font=("Arial", 14))
                    welcome_label.pack(pady=(0, 20))
                
                # Start processing the UI queue if available
                if hasattr(app, 'process_ui_queue') and app.root:
                    app.root.after(100, app.process_ui_queue)
                
                # Add online/offline status indicator if it doesn't exist
                if hasattr(app, 'root') and app.root and not hasattr(app, 'online_status_var'):
                    status_frame = None
                    
                    # Find the status frame if it exists
                    for widget in app.root.winfo_children():
                        if hasattr(widget, 'winfo_children'):
                            for child in widget.winfo_children():
                                if hasattr(child, 'cget') and child.cget('text') == "Connection Status":
                                    status_frame = child
                                    break
                    
                    if status_frame:
                        app.online_status_var = tk.StringVar(value="Status: Checking...")
                        app.online_status_label = tk.Label(status_frame, textvariable=app.online_status_var)
                        app.online_status_label.pack(anchor="w")
                        
                        # Update status
                        app.update_online_status()
                        
                        # Periodically check online status
                        def check_status_periodically():
                            while getattr(app, 'running', True) and getattr(app, 'is_logged_in', False):
                                try:
                                    app.api_client.check_online_status()
                                    
                                    # Use thread-safe update if available
                                    if hasattr(app, 'schedule_ui_task'):
                                        app.schedule_ui_task(app.update_online_status)
                                    else:
                                        app.update_online_status()
                                except Exception as e:
                                    app.log(f"Error checking online status: {str(e)}", "error")
                                
                                time.sleep(30)  # Check every 30 seconds
                        
                        threading.Thread(target=check_status_periodically, daemon=True).start()
            except Exception as e:
                app.log(f"Error in main window setup: {str(e)}", "error")
        
        # If we have thread-safe UI updates, use them
        if hasattr(app, 'schedule_ui_task'):
            app.schedule_ui_task(_main_window_setup)
        else:
            # Otherwise run directly
            _main_window_setup()
    
    app.show_main_window = show_main_window_extended
    
    # Add tray icon click handler
    def on_tray_icon_clicked(icon):
        if app.is_logged_in:
            app.show_main_window()
        else:
            app.show_login()
            
    # If the app already has a tray icon, update its behavior
    if hasattr(app, 'tray_icon') and app.tray_icon:
        try:
            app.tray_icon.on_click = on_tray_icon_clicked
        except:
            # Some implementations might not support changing callbacks
            pass
    
    # Modify the minimize_to_tray method
    original_minimize_to_tray = app.minimize_to_tray
    
    def minimize_to_tray_extended():
        # Define the UI operation to run on the main thread
        def _minimize_window():
            try:
                # Safely check if root exists and withdraw it
                if app.root and hasattr(app.root, 'winfo_exists') and app.root.winfo_exists():
                    try:
                        app.root.withdraw()
                    except Exception as e:
                        app.log(f"Error withdrawing window: {str(e)}", "error")
                        
                # Auto show login window if not logged in
                if not app.is_logged_in and app.tray_icon:
                    # Schedule login with slight delay to ensure clean minimize
                    if app.root and hasattr(app.root, 'after'):
                        try:
                            def show_login_safe():
                                try:
                                    app.show_login()
                                except Exception as e:
                                    app.log(f"Error showing login from minimize: {str(e)}", "error")
                                    
                            # Schedule login after 500ms
                            app.root.after(500, show_login_safe)
                        except Exception as e:
                            # Fallback if scheduling fails
                            app.log(f"Error scheduling login from minimize: {str(e)}", "error")
                            # Use traditional thread approach
                            def delayed_login():
                                time.sleep(0.5)
                                try:
                                    app.show_login()
                                except Exception as e2:
                                    app.log(f"Error in delayed login: {str(e2)}", "error")
                                
                            threading.Thread(target=delayed_login, daemon=True).start()
                    else:
                        # Use traditional thread approach if after() not available
                        def delayed_login():
                            time.sleep(0.5)
                            try:
                                app.show_login()
                            except Exception as e:
                                app.log(f"Error in delayed login: {str(e)}", "error")
                            
                        threading.Thread(target=delayed_login, daemon=True).start()
            except Exception as e:
                app.log(f"Error in minimize_to_tray: {str(e)}", "error")
        
        # Use thread-safe method if available
        if hasattr(app, 'schedule_ui_task'):
            app.schedule_ui_task(_minimize_window)
        else:
            # Fallback to direct call
            _minimize_window()
    
    app.minimize_to_tray = minimize_to_tray_extended
    
    return app
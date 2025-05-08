"""
This is a wrapper script that ensures no console windows appear when running the Office Agent.
PyInstaller will use this as the entry point instead of system_tray_agent_fixed.py directly.
"""

import os
import sys
import ctypes

# Prevent Windows from showing the console window
if sys.platform == 'win32':
    # Use Windows API to hide console
    try:
        # Try to detach from console
        kernel32 = ctypes.WinDLL('kernel32')
        user32 = ctypes.WinDLL('user32')
        
        # Try to detach from console
        kernel32.FreeConsole()
        
        # Hide console window if it exists
        hwnd = kernel32.GetConsoleWindow()
        if hwnd != 0:
            user32.ShowWindow(hwnd, 0)  # SW_HIDE = 0
    except Exception:
        pass

    # Set process priority to below normal to reduce CPU usage
    try:
        import win32process
        import win32api
        win32process.SetPriorityClass(win32api.GetCurrentProcess(), 
                                    win32process.BELOW_NORMAL_PRIORITY_CLASS)
    except Exception:
        pass

# Set the environment variable to tell subprocess calls to hide windows
os.environ["PYTHONUNBUFFERED"] = "1"
os.environ["PYTHONNOUSERSITE"] = "1"
if sys.platform == 'win32':
    os.environ["OFFICE_AGENT_HIDE_WINDOWS"] = "1"

# Now import and run the actual application
from system_tray_agent_fixed import main
main()

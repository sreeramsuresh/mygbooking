# Office Agent Windows Application

This is a Windows system tray application that monitors network connectivity for office attendance tracking.

## Features

- Runs in the system tray
- Starts automatically with Windows
- Tracks network connections and disconnections
- Sends heartbeat signals to verify active connections
- Installs as a standard Windows application to Program Files

## Installation

### Option 1: Using the Installer

1. Download the `OfficeAgent_Setup.exe` file
2. Run the installer and follow the on-screen instructions
3. The application will be installed to `C:\Program Files\Office Agent\`
4. A shortcut will be created in the Start Menu and on the Desktop
5. The application will be configured to run at Windows startup

### Option 2: Manual Installation

If you prefer to build the application yourself:

1. Ensure you have Python 3.8+ installed
2. Install the required dependencies: `pip install -r requirements.txt`
3. Install NSIS (Nullsoft Scriptable Install System) from https://nsis.sourceforge.io/Download
4. Run the build script: `python build_installer.py`
5. Run the generated `OfficeAgent_Setup.exe` installer

## Usage

Once installed, the Office Agent will:

1. Start automatically when Windows boots
2. Run in the system tray (look for the icon in the notification area)
3. Monitor your network connections
4. Report connections/disconnections to your tracking server

### System Tray Options

Right-click on the tray icon to access the following options:

- **Status**: Shows the current status of the agent
- **Start Monitoring**: Start the agent if it's not running
- **Stop Monitoring**: Stop the agent temporarily
- **Logout**: Clear saved credentials and logout
- **Exit**: Close the application completely

## First Run

On first run, you'll be prompted to enter your email and password. These credentials will be saved securely for future use.

## Development

### Project Structure

- `desktop_agent.py`: Core agent functionality
- `system_tray_agent.py`: System tray interface
- `build_installer.py`: Script to build executable and installer
- `requirements.txt`: Python dependencies
- `icon.ico`: Application icon

### Building from Source

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run `python build_installer.py` to create the installer

## Troubleshooting

- **Application not starting at boot**: Check the registry key at `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- **Connection issues**: Verify server URL in the `desktop_agent.py` file
- **Login problems**: Try clearing saved credentials by selecting "Logout" from the tray menu

## License

This software is proprietary and confidential.

# Office Agent Installation Guide

This guide explains how to set up your development environment and build the Office Agent Windows application.

## Prerequisites

Before you begin, ensure you have the following tools installed:

1. **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
2. **Git** (optional) - [Download Git](https://git-scm.com/downloads)
3. **NSIS** (Nullsoft Scriptable Install System) - [Download NSIS](https://nsis.sourceforge.io/Download)

## Setting Up the Development Environment

### Step 1: Create a Project Directory

Create a folder for your project:

```
mkdir office_agent
cd office_agent
```

### Step 2: Set Up a Virtual Environment (Recommended)

```
python -m venv venv
```

Activate the virtual environment:

- On Windows: `venv\Scripts\activate`
- On macOS/Linux: `source venv/bin/activate`

### Step 3: Install Required Dependencies

Create a requirements.txt file with the dependencies listed in the repository, then install them:

```
pip install -r requirements.txt
```

## Building the Application

### Step 1: Prepare Project Files

Place all the following files in your project directory:

- `desktop_agent.py` - Core agent functionality
- `system_tray_agent.py` - System tray application
- `build_installer.py` - Build script
- `requirements.txt` - Dependencies list
- `icon.ico` - Application icon (create or download one)

### Step 2: Run the Build Script

```
python build_installer.py
```

This script will:

1. Build an executable using PyInstaller
2. Create an installer using NSIS

If successful, you'll find `OfficeAgent_Setup.exe` in your project directory.

## Troubleshooting Common Build Issues

### PyInstaller Issues

If you encounter errors with PyInstaller:

1. Ensure all imports in your code are installed:

   ```
   pip install pyinstaller
   ```

2. Run PyInstaller manually to see detailed errors:
   ```
   pyinstaller --clean --onedir --windowed --icon=icon.ico system_tray_agent.py
   ```

### NSIS Issues

If you encounter errors with NSIS:

1. Make sure NSIS is correctly installed and in your PATH
2. Check that the path to `makensis.exe` is correct in `build_installer.py`
3. Run NSIS manually:
   ```
   "C:\Program Files (x86)\NSIS\makensis.exe" installer.nsi
   ```

## Installing the Application

Run the generated `OfficeAgent_Setup.exe` installer. The application will be installed to:

```
C:\Program Files\Office Agent\
```

Shortcuts will be created in:

- Start Menu > Office Agent
- Desktop

## Running at Startup

The installer configures the application to run at startup by adding a registry key:

```
HKCU\Software\Microsoft\Windows\CurrentVersion\Run\OfficeAgent
```

To manually add or remove this startup entry:

1. Press Win+R, type `regedit`, and press Enter
2. Navigate to `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
3. To add: Right-click > New > String Value, Name: OfficeAgent, Value: "C:\Program Files\Office Agent\OfficeAgent.exe"
4. To remove: Right-click on the OfficeAgent entry and select Delete

## Uninstalling

You can uninstall the application through Windows Control Panel > Programs and Features.

Alternatively, you can run the uninstaller directly:

```
"C:\Program Files\Office Agent\uninstall.exe"
```

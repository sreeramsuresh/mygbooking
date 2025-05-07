import os
import sys
import subprocess
import shutil
import winreg
import time

# Paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(CURRENT_DIR, 'dist')
BUILD_DIR = os.path.join(CURRENT_DIR, 'build')
ICON_FILE = os.path.join(CURRENT_DIR, 'icon.ico')

# Ensure icon exists
if not os.path.exists(ICON_FILE):
    print(f"Creating empty icon file at {ICON_FILE}")
    with open(ICON_FILE, 'w') as f:
        f.write("")  # Create empty file

def build_exe():
    """Build the executable using PyInstaller"""
    try:
        # Clean previous builds
        if os.path.exists(DIST_DIR):
            shutil.rmtree(DIST_DIR)
        if os.path.exists(BUILD_DIR):
            shutil.rmtree(BUILD_DIR)
        
        # Run PyInstaller directly
        subprocess.check_call([
            'pyinstaller',
            '--name=OfficeAgent',
            '--windowed',
            '--icon=icon.ico',
            '--add-data=icon.ico;.',
            '--clean',
            'system_tray_agent_fixed.py'
        ])
        
        return True
    except Exception as e:
        print(f"Error building executable: {str(e)}")
        return False

def build_installer():
    """Build the installer using NSIS"""
    try:
        # Check if NSIS is installed
        try:
            nsis_path = None
            # Try to find NSIS installation from registry
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\NSIS") as key:
                    nsis_path = winreg.QueryValueEx(key, "")[0]
                nsis_path = os.path.join(nsis_path, "makensis.exe")
            except Exception as e:
                print(f"Registry lookup failed: {e}")
                pass
            
            if not nsis_path or not os.path.exists(nsis_path):
                # Try common installation paths
                common_paths = [
                    r"C:\Program Files\NSIS\makensis.exe",
                    r"C:\Program Files (x86)\NSIS\makensis.exe"
                ]
                for path in common_paths:
                    if os.path.exists(path):
                        nsis_path = path
                        break
            
            if not nsis_path or not os.path.exists(nsis_path):
                print("NSIS not found. Please install NSIS from https://nsis.sourceforge.io/Download")
                return False
            
            # Create NSIS script
            nsis_script = os.path.join(CURRENT_DIR, 'installer.nsi')
            script_content = """
; Office Agent Installer Script

!include "MUI2.nsh"
; FileFunc.nsh not used in this script

; Define variables
!define PRODUCT_NAME "Office Agent"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Your Company"
!define PRODUCT_WEB_SITE "https://www.yourcompany.com"
!define PRODUCT_DIR_REGKEY "Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\OfficeAgent.exe"
!define PRODUCT_UNINST_KEY "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${PRODUCT_NAME}"

SetCompressor lzma
Name "${PRODUCT_NAME}"
OutFile "OfficeAgent_Setup.exe"
InstallDir "$PROGRAMFILES\\Office Agent"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language files
!insertmacro MUI_LANGUAGE "English"

; Install
Section "MainSection" SEC01
    SetOutPath "$INSTDIR"
    SetOverwrite ifnewer
    
    ; Copy all files from dist folder
    File /r "dist\\OfficeAgent\\*.*"
    
    ; Create shortcuts
    CreateDirectory "$SMPROGRAMS\\Office Agent"
    CreateShortCut "$SMPROGRAMS\\Office Agent\\Office Agent.lnk" "$INSTDIR\\OfficeAgent.exe"
    CreateShortCut "$DESKTOP\\Office Agent.lnk" "$INSTDIR\\OfficeAgent.exe"
    
    ; Create autorun registry entry
    WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run" "OfficeAgent" "$INSTDIR\\OfficeAgent.exe"
    
    ; Write uninstaller
    WriteUninstaller "$INSTDIR\\uninstall.exe"
    
    ; Write registry keys for uninstaller
    WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\\OfficeAgent.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\\uninstall.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\\OfficeAgent.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
    
    ; Skip GetSize as it's not supported in this version
    WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" "0x00001000"
SectionEnd

; Uninstall
Section Uninstall
    ; Remove shortcuts
    Delete "$SMPROGRAMS\\Office Agent\\Office Agent.lnk"
    Delete "$DESKTOP\\Office Agent.lnk"
    RMDir "$SMPROGRAMS\\Office Agent"
    
    ; Remove registry entries
    DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
    DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
    DeleteRegValue HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Run" "OfficeAgent"
    
    ; Remove files and directories
    RMDir /r "$INSTDIR"
SectionEnd
"""
            
            with open(nsis_script, 'w') as f:
                f.write(script_content)
            
            print(f"Using NSIS at: {nsis_path}")
            print(f"Running NSIS with script: {nsis_script}")
            
            # Run NSIS to create installer
            subprocess.check_call([
                nsis_path,
                nsis_script
            ])
            
            print(f"Installer created: {os.path.join(CURRENT_DIR, 'OfficeAgent_Setup.exe')}")
            return True
        except Exception as e:
            print(f"Error finding or running NSIS: {str(e)}")
            return False
    except Exception as e:
        print(f"Error building installer: {str(e)}")
        return False

if __name__ == "__main__":
    print("Building Office Agent executable...")
    if build_exe():
        print("Successfully built executable.")
        print("Building installer...")
        if build_installer():
            print("Successfully built installer.")
        else:
            print("Failed to build installer.")
    else:
        print("Failed to build executable.")
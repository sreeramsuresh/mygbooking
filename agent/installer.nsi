
; Office Agent Installer Script

!include "MUI2.nsh"
; FileFunc.nsh not used in this script

; Define variables
!define PRODUCT_NAME "Office Agent"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Your Company"
!define PRODUCT_WEB_SITE "https://www.yourcompany.com"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\OfficeAgent.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

SetCompressor lzma
Name "${PRODUCT_NAME}"
OutFile "OfficeAgent_Setup.exe"
InstallDir "$PROGRAMFILES\Office Agent"
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
    File /r "dist\OfficeAgent\*.*"
    
    ; Create shortcuts
    CreateDirectory "$SMPROGRAMS\Office Agent"
    CreateShortCut "$SMPROGRAMS\Office Agent\Office Agent.lnk" "$INSTDIR\OfficeAgent.exe"
    CreateShortCut "$DESKTOP\Office Agent.lnk" "$INSTDIR\OfficeAgent.exe"
    
    ; Create autorun registry entry
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "OfficeAgent" "$INSTDIR\OfficeAgent.exe"
    
    ; Write uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    ; Write registry keys for uninstaller
    WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\OfficeAgent.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\OfficeAgent.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
    
    ; Skip GetSize as it's not supported in this version
    WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" "0x00001000"
SectionEnd

; Uninstall
Section Uninstall
    ; Remove shortcuts
    Delete "$SMPROGRAMS\Office Agent\Office Agent.lnk"
    Delete "$DESKTOP\Office Agent.lnk"
    RMDir "$SMPROGRAMS\Office Agent"
    
    ; Remove registry entries
    DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
    DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "OfficeAgent"
    
    ; Remove files and directories
    RMDir /r "$INSTDIR"
SectionEnd

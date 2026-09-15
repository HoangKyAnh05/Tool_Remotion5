@echo off
chcp 65001 >nul
echo Đang tạo Shortcut Desktop cho Remotion AI Video Auto-Editor...

cscript //nologo "%~dp0create_shortcut.vbs"
echo [OK] Đã tạo thành công Shortcut trên Màn hình chính Desktop!
pause

@echo off
setlocal
cd /d "%~dp0"

:: Always rebuild so the app shows the latest code
echo Building the latest version...
call npm run build
if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
)

:: Serve the fresh build and open the browser
call npm run preview -- --open

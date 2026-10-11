@echo off
setlocal
cd /d "%~dp0"

:: If dist folder does not exist, build it once
if not exist "dist\index.html" (
    echo Building application...
    call npm run build
    if errorlevel 1 (
        echo Build failed.
        pause
        exit /b 1
    )
)

:: Run vite preview to serve the built dist and open browser automatically
call npm run preview -- --open

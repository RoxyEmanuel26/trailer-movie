@echo off
title MovieFlix Standalone Packager
echo ============================================================
echo   MovieFlix - Packaging for NuraHost Drag-and-Drop Deploy
echo ============================================================
echo.
call pnpm deploy:pack
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Packaging failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
pause

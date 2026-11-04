@echo off
title MovieFlix Source Packager
echo ============================================================
echo   MovieFlix - Packaging Source Code for NuraHost
echo ============================================================
echo.
call npx tsx scripts/package-source.ts
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Packaging failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
pause

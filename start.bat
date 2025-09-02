@echo off
title GraveGrounds Server
echo Starting GraveGrounds Faction Tracker...
echo.
echo Current directory:
cd
echo.
echo Checking if Node.js is installed...
node --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org
    echo.
    pause
    exit
)
echo.
echo Node.js is installed. Checking npm...
npm --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm is not working!
    echo.
    pause
    exit
)
echo.
echo Installing dependencies...
npm install
echo.
echo Dependencies installed. Starting server...
echo.
echo Server will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
npm run dev
echo.
echo Server stopped.
pause

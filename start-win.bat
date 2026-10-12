@echo off
title Modern CMS Portal - Windows Launcher
color 0A

echo ==========================================================
echo    Starting Modern CMS Portal on Windows
echo ==========================================================
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on this computer!
    echo Please install Node.js (v18+ or v20+) from https://nodejs.org
    echo and run this launcher again.
    echo.
    pause
    exit /b 1
)

:: Self-healing: verify Windows .cmd shims exist (in case drive was updated on Mac)
if not exist "frontend\node_modules\.bin\vite.cmd" (
    echo [Setup] Initializing Windows runners...
    (echo @ECHO off & echo node "%%~dp0\..\vite\bin\vite.js" %%*) > "frontend\node_modules\.bin\vite.cmd"
)
if not exist "node_modules\.bin\concurrently.cmd" (
    (echo @ECHO off & echo node "%%~dp0\..\concurrently\dist\bin\concurrently.js" %%*) > "node_modules\.bin\concurrently.cmd"
)
if not exist "backend\node_modules\.bin\nodemon.cmd" (
    (echo @ECHO off & echo node "%%~dp0\..\nodemon\bin\nodemon.js" %%*) > "backend\node_modules\.bin\nodemon.cmd"
)

:: Check and Auto-start MongoDB if installed locally
netstat -ano | findstr :27017 >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%USERPROFILE%\mongodb\MongoDB\Server\7.0\bin\mongod.exe" (
        echo [Setup] Starting local MongoDB server on port 27017...
        start "MongoDB Server" /min "%USERPROFILE%\mongodb\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "%USERPROFILE%\mongodb\data\db" --port 27017
        timeout /t 2 /nobreak >nul
    )
)

echo [1/2] Starting Node.js Backend Server on port 5001...
start "CMS Backend" cmd /k "cd backend && npm run dev"

echo [2/2] Starting React Frontend on port 5173...
start "CMS Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================================
echo    SUCCESS! Both servers are starting up.
echo ==========================================================
echo    Website: http://localhost:5173
echo    API:     http://localhost:5001
echo    Admin:   admin@portal.com / admin123
echo ==========================================================
echo    TIP: If the backend reports MongoDB connection error,
echo    set your free MongoDB Atlas URI in backend\.env
echo ==========================================================
echo.

:: Automatically open browser after short delay
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause

@echo off
echo Starting Vitamin Deficiency Detection System...
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed or not running.
    echo Please install Docker Desktop and make sure it's running.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker Compose is not available.
    echo Please make sure Docker Desktop is properly installed.
    pause
    exit /b 1
)

echo Building and starting services...
docker-compose up --build -d

if %errorlevel% equ 0 (
    echo.
    echo ✅ System started successfully!
    echo.
    echo 🌐 Frontend: http://localhost:3000
    echo 🔧 Backend API: http://localhost:5000
    echo 🤖 AI Service: http://localhost:5001
    echo.
    echo Press any key to view logs, or Ctrl+C to exit...
    pause >nul
    docker-compose logs -f
) else (
    echo.
    echo ❌ Failed to start the system.
    echo Check the error messages above.
    pause
)
@echo off
echo Stopping Vitamin Deficiency Detection System...

docker-compose down

if %errorlevel% equ 0 (
    echo ✅ System stopped successfully!
) else (
    echo ❌ Error stopping the system.
)

pause
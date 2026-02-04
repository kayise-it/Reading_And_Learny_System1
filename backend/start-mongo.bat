@echo off
echo Starting MongoDB...
echo.

REM Try to start MongoDB service
net start MongoDB 2>nul
if %errorlevel% equ 0 (
    echo MongoDB service started successfully
) else (
    echo Could not start MongoDB service, trying direct execution...
    
    REM Try to run mongod.exe directly
    "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath="C:\Program Files\MongoDB\Server\8.2\data" --logpath="C:\Program Files\MongoDB\Server\8.2\log\mongod.log"
    
    if %errorlevel% equ 0 (
        echo MongoDB started successfully
    ) else (
        echo Failed to start MongoDB
        echo.
        echo Please start MongoDB manually:
        echo 1. Run Command Prompt as Administrator
        echo 2. Execute: net start MongoDB
        echo.
        echo Or install MongoDB Compass from:
        echo https://www.mongodb.com/try/download/compass
    )
)

pause
@echo off
set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 9.5\bin"
set "PORT=3307"

echo Stopping MySQL server on port %PORT%...
"%MYSQL_BIN%\mysqladmin.exe" -u root -pAdmin@123 -P %PORT% shutdown
if %errorlevel% equ 0 (
    echo [OK] MySQL server on port %PORT% stopped.
) else (
    echo [!] MySQL was either not running or failed to respond.
)

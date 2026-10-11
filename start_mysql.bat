@echo off
set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Server 9.5\bin"
set "DATA_DIR=%~dp0mysql_data"
set "PORT=3307"

echo Checking if MySQL on port %PORT% is already running...
"%MYSQL_BIN%\mysqladmin.exe" -u root -pAdmin@123 -P %PORT% ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL is already running on port %PORT%.
    exit /b 0
)

echo Starting MySQL on port %PORT% (Data dir: "%DATA_DIR%")...
start "" "%MYSQL_BIN%\mysqld.exe" --datadir="%DATA_DIR%" --port=%PORT% --mysqlx=OFF
timeout /t 3 /nobreak >nul

"%MYSQL_BIN%\mysqladmin.exe" -u root -pAdmin@123 -P %PORT% ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL server started successfully on port %PORT%.
) else (
    echo [!] Server starting up, please verify in a few seconds.
)

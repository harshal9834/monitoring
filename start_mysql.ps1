$mysqlBin = "C:\Program Files\MySQL\MySQL Server 9.5\bin"
$dataDir = Join-Path $PSScriptRoot "mysql_data"
$port = 3307

Write-Host "Checking if MySQL on port $port is already running..." -ForegroundColor Cyan
& "$mysqlBin\mysqladmin.exe" -u root -pAdmin@123 -P $port ping 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] MySQL is already running on port $port." -ForegroundColor Green
    return
}

Write-Host "Starting MySQL on port $port (Data dir: $dataDir)..." -ForegroundColor Yellow
Start-Process -FilePath "$mysqlBin\mysqld.exe" -ArgumentList "--datadir=`"$dataDir`"", "--port=$port", "--mysqlx=OFF" -WindowStyle Hidden

Start-Sleep -Seconds 3

& "$mysqlBin\mysqladmin.exe" -u root -pAdmin@123 -P $port ping 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] MySQL server started successfully on port $port." -ForegroundColor Green
} else {
    Write-Host "[!] Server starting up, please verify in a few seconds." -ForegroundColor Yellow
}

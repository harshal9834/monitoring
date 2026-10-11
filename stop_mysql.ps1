$mysqlBin = "C:\Program Files\MySQL\MySQL Server 9.5\bin"
$port = 3307

Write-Host "Stopping MySQL server on port $port..." -ForegroundColor Yellow
& "$mysqlBin\mysqladmin.exe" -u root -pAdmin@123 -P $port shutdown
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] MySQL server on port $port stopped." -ForegroundColor Green
} else {
    Write-Host "[!] MySQL was either not running or failed to respond." -ForegroundColor Red
}

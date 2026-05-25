# Stop dev server on port 3000, clear .next cache, restart (fixes Internal Server Error)
$ErrorActionPreference = "SilentlyContinue"
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force
}
Start-Sleep -Seconds 2
Set-Location $PSScriptRoot\..
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
Write-Host "Starting dev server on http://localhost:3000 ..."
node ".\node_modules\next\dist\bin\next" dev --turbopack -p 3000

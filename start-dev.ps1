# Local dev: API (PHP) + Frontend (Vite) in separate windows
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $scriptDir "api"
$frontendDir = Join-Path $scriptDir "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$apiDir'; php -S localhost:8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host "Started API (localhost:8000) and Frontend dev servers in new windows." -ForegroundColor Green

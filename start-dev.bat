@echo off
REM Local dev: API (PHP) + Frontend (Vite) in separate windows
cd /d "%~dp0"

start "API Server (localhost:8000)" cmd /k "cd /d ""%~dp0api"" && php -S localhost:8000"
start "Frontend Dev (Vite)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Started API and Frontend dev servers in new windows.
pause

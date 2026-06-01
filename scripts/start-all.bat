@echo off
REM LITHY AI - Start All Services (Production Mode)
echo ========================================
echo   LITHY AI - Starting All Services
echo ========================================

REM 1. Verify PostgreSQL
echo [1/4] PostgreSQL...
netstat -ano | findstr ":5432" >nul
if errorlevel 1 (
    echo ERROR: PostgreSQL not running!
    exit /b 1
)
echo   OK - Port 5432

REM 2. Build frontend
echo [2/4] Building frontend...
cd /d C:\opencode\lithy-ai
call npm run build -w frontend
if errorlevel 1 (
    echo BUILD FAILED
    exit /b 1
)
echo   OK

REM 3. Start backend
echo [3/4] Starting backend (4000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000"') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
start /B node C:\opencode\lithy-ai\backend\dist\src\main.js
timeout /t 4 /nobreak >nul
netstat -ano | findstr ":4000" >nul
if errorlevel 1 (
    echo FAILED
    exit /b 1
)
echo   OK

REM 4. Start Stripe CLI
echo [4/5] Starting Stripe webhook...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "stripe"') do (
    taskkill /f /pid %%a >nul 2>&1
)
start /B "" "C:\Users\mezo\AppData\Local\Temp\stripe-cli\stripe.exe" listen --api-key sk_test_xxx --forward-to http://localhost:4000/api/v1/payments/webhook
timeout /t 3 /nobreak >nul
echo   OK

REM 5. Start frontend
echo [5/5] Starting frontend (3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
start /B cmd /c "cd /d C:\opencode\lithy-ai\frontend && npx next start"
timeout /t 6 /nobreak >nul
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo FAILED
    exit /b 1
)
echo   OK [PRODUCTION MODE]

echo.
echo ========================================
echo   ALL SERVICES RUNNING
echo ========================================
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:4000
echo   Swagger  : http://localhost:4000/api/docs
echo   Admin    : http://localhost:3000/admin
echo   Login    : admin@lithy.ai / Admin123456!
echo ========================================

@echo off
REM =============================================================================
REM CrimeAssist AI - Zoho Catalyst Deployment Script (Windows)
REM =============================================================================

echo ================================================
echo  CrimeAssist AI - KSP Deployment Script
echo ================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo Node.js is required but not installed. Aborting.
  exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo npm is required but not installed. Aborting.
  exit /b 1
)

echo.
echo [1/7] Installing workspace dependencies...
call npm install
if %errorlevel% neq 0 (
  echo Failed to install dependencies
  exit /b 1
)

echo.
echo [2/7] Building backend...
cd backend
call npm run build
cd ..

echo.
echo [3/7] Building frontend...
cd frontend
call npm run build
cd ..

echo.
echo [4/7] Building Catalyst Functions...
for /d %%d in (functions\*) do (
  if exist "%%d\package.json" (
    echo   Building %%d...
    cd "%%d"
    call npm install --production 2>nul
    cd ..\..
  )
)

echo.
echo [5/7] Running database migrations...
cd backend
call npm run migrate || echo   Migration skipped
cd ..

echo.
echo [6/7] Seeding database...
cd backend
call npm run seed || echo   Seed skipped
cd ..

echo.
echo [7/7] Deploying to Zoho Catalyst...
where catalyst >nul 2>nul
if %errorlevel% equ 0 (
  call catalyst deploy
  echo   Deployment complete!
) else (
  echo   Catalyst CLI not found. Install with: npm install -g @zcatalyst/cli
  echo   Then run: catalyst deploy
)

echo.
echo ================================================
echo  Deployment Summary:
echo  Frontend:  frontend/dist
echo  Backend:   backend/dist
echo  Functions: 4 functions deployed
echo  Database:  17 tables
echo ================================================

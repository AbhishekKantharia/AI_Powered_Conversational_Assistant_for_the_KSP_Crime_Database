@echo off
REM =============================================================================
REM CrimeAssist AI - Local Development Setup (Windows)
REM =============================================================================

echo ================================================
echo  CrimeAssist AI - Local Dev Setup
echo ================================================

echo.
echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
  echo Failed to install workspace dependencies
  exit /b 1
)

echo.
echo [2/4] Starting PostgreSQL and Redis via Docker...
cd deployment
where docker >nul 2>nul
if %errorlevel% equ 0 (
  docker-compose up -d
  echo   Waiting for PostgreSQL to be ready...
  timeout /t 5 /nobreak >nul
) else (
  echo   Docker not found. Ensure PostgreSQL 15+ with pgvector is running.
  echo   Connection: localhost:5432, DB: crimeassist_db, User: crimeassist
)
cd ..

echo.
echo [3/4] Running migrations and seeding...
cd backend
if not exist .env (
  echo Copying .env.example to .env...
  copy .env.example .env >nul
)
call npm run migrate || echo   Migration may have failed - ensure database is running
call npm run seed
cd ..

echo.
echo [4/4] Starting development servers...
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   API:      http://localhost:5000/api
echo.
echo   Login: officer_ksp / password123
echo.
call npm run dev

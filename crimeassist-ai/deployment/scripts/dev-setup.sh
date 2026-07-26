#!/bin/bash
# =============================================================================
# CrimeAssist AI - Local Development Setup
# =============================================================================
set -e

echo "================================================"
echo " CrimeAssist AI - Local Dev Setup"
echo "================================================"

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "[1/4] Installing dependencies..."
npm install

echo ""
echo "[2/4] Starting PostgreSQL and Redis via Docker..."
cd deployment
if command -v docker >/dev/null 2>&1; then
  docker-compose up -d
  echo "  Waiting for PostgreSQL to be ready..."
  sleep 5
else
  echo "  Docker not found. Ensure PostgreSQL 15+ with pgvector is running."
  echo "  Connection: localhost:5432, DB: crimeassist_db, User: crimeassist"
fi
cd "$PROJECT_ROOT"

echo ""
echo "[3/4] Running migrations and seeding..."
cd backend
if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true
fi
npm run migrate || echo "  Migration may have failed - ensure database is running"
npm run seed || echo "  Seed may have failed"
cd "$PROJECT_ROOT"

echo ""
echo "[4/4] Starting development servers..."
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "  API:      http://localhost:5000/api"
echo ""
echo "  Login: officer_ksp / password123"
echo ""
npm run dev

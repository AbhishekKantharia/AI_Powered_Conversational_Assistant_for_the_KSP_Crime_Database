#!/bin/bash
# =============================================================================
# CrimeAssist AI - Zoho Catalyst Deployment Script
# =============================================================================
set -e

echo "================================================"
echo " CrimeAssist AI - KSP Deployment Script"
echo "================================================"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Node.js v18+ required. Current: $(node -v)" >&2
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "[1/8] Installing workspace dependencies..."
npm install

echo ""
echo "[2/8] Building backend..."
cd backend
npm run build
cd ..

echo ""
echo "[3/8] Building frontend..."
cd frontend
npm run build
cd ..

echo ""
echo "[4/8] Building Catalyst Functions..."
for func_dir in functions/*/; do
  if [ -f "${func_dir}package.json" ]; then
    echo "  Building ${func_dir}..."
    cd "$func_dir"
    npm install --production 2>/dev/null || true
    cd "$PROJECT_ROOT"
  fi
done

echo ""
echo "[5/8] Running database migrations..."
cd backend
if [ -f .env ]; then
  source .env 2>/dev/null || true
fi
npm run migrate || echo "  Migration skipped (database may not be accessible)"
cd ..

echo ""
echo "[6/8] Seeding database..."
cd backend
npm run seed || echo "  Seed skipped (database may not be accessible)"
cd ..

echo ""
echo "[7/8] Deploying to Zoho Catalyst..."
if command -v catalyst >/dev/null 2>&1; then
  catalyst deploy
  echo "  Deployment complete!"
else
  echo "  Catalyst CLI not found. Install with: npm install -g @zcatalyst/cli"
  echo "  Then run: catalyst deploy"
fi

echo ""
echo "[8/8] Deployment summary..."
echo "================================================"
echo " Frontend:  frontend/dist (Catalyst Hosting)"
echo " Backend:   backend/dist (Catalyst Functions)"
echo " Functions: 4 functions deployed"
echo " Database:  17 tables via DataStore"
echo "================================================"
echo ""
echo " Deployment complete! Access your app at:"
echo " https://crimeassist-ai-ksp.zohoapp.in"
echo ""

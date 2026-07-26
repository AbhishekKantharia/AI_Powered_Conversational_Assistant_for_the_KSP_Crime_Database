# CrimeAssist AI — Deployment Guide

## Prerequisites
1. **Node.js** v20+ and **npm** v10+
2. **PostgreSQL** 15+ with **pgvector** extension installed.
3. **Zoho Catalyst CLI** (`npm install -g zcatalyst-cli`)
4. **OpenAI API Key** with GPT-4 access.

---

## 1. Database Setup
```bash
# Start PostgreSQL & Redis via Docker
cd deployment
docker-compose up -d

# Run Database Migrations & Seed 1000 FIRs, 200 Criminals, 500 Cases
cd ../backend
npm run migrate
npm run seed
```

---

## 2. Local Development
```bash
# Start both backend and frontend concurrently
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/v1`

---

## 3. Deployment to Zoho Catalyst Cloud
```bash
# Login to Zoho Catalyst
catalyst login

# Build production artifacts
npm run build

# Deploy Functions, Hosting, DataStore, and Cron
catalyst deploy
```

# CrimeAssist AI
### AI-Powered Conversational Crime Investigation System for Karnataka State Police (KSP)

CrimeAssist AI is an enterprise government intelligence application designed for the Karnataka State Police. Built with a modern Azure/Zoho blue-white design system, it features a ChatGPT-style RAG copilot, full FIR and criminal case tracking, analytics dashboards with Chart.js, and Zoho Catalyst cloud deployment integration.

---

## 🌟 Key Features

- 🛡️ **Enterprise Government UI**: Blue/white enterprise theme with dark mode toggle, sleek glassmorphic cards, and responsive sidebar navigation.
- 🤖 **GPT-4 RAG Copilot**: Conversational AI assistant with real-time vector search across 1000 FIRs, IPC legal sections, and criminal records.
- 📋 **FIR & Case Management**: Advanced multi-faceted filtering, status tracking, evidence chain of custody, and CSV exports.
- 👤 **Criminal Profiles & Risk Scoring**: Automated risk level evaluation, wanted criminal badges, and modus operandi matching.
- 📊 **Crime Analytics & Forecasting**: Interactive Chart.js visualizers for monthly crime trends, district breakdowns, and predictive volume forecasts.
- 🔒 **Enterprise Security**: Role-Based Access Control (RBAC), JWT authentication, rate limiting, and full database audit logging.
- ☁️ **Zoho Catalyst Cloud Ready**: Native support for Catalyst Functions, DataStore, FileStore, and Cron schedules.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Shadcn UI primitives, Framer Motion, Chart.js, React Hook Form, Zustand.
- **Backend**: Node.js, Express, TypeScript, JWT, bcrypt, Winston logger, Socket.io.
- **Database**: PostgreSQL with `pgvector` extension for vector embeddings & Zoho Catalyst DataStore support.
- **AI & RAG Engine**: OpenAI GPT-4, `text-embedding-3-small` vector search engine.
- **Deployment**: Zoho Catalyst Cloud Functions, Catalyst Hosting, Docker Compose.

---

## 🚀 Quick Start

```bash
# 1. Clone & Install Workspace Dependencies
cd crimeassist-ai
npm install

# 2. Start PostgreSQL & Redis via Docker
cd deployment
docker-compose up -d

# 3. Seed Database (1000 FIR, 200 Criminals, 500 Cases)
cd ../backend
npm run seed

# 4. Launch Development Application
cd ..
npm run dev
```

Visit `http://localhost:3000` to log in with:
- **Username**: `officer_ksp`
- **Password**: `password123`

---

## 📜 License
Karnataka State Police Department Internal Software License.

# CrimeAssist AI — System Architecture Document
## Karnataka State Police (KSP) Crime Investigation Platform

### Overview
CrimeAssist AI is an enterprise-grade AI-powered conversational crime investigation system built specifically for the Karnataka State Police (KSP). It combines modern web UX, robust backend APIs, cloud serverless execution via Zoho Catalyst, and an OpenAI GPT-4 Retrieval-Augmented Generation (RAG) vector pipeline.

---

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│               Frontend Layer (React 19 + Vite)                   │
│   • Enterprise Azure/Zoho Blue-White Theme                       │
│   • Framer Motion Animations & Chart.js Data Visualizations       │
│   • ChatGPT / Copilot Streaming RAG Interface                      │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ HTTP / REST / SSE / WebSockets
┌────────────────────────────────▼─────────────────────────────────┐
│              Backend API Layer (Node.js / Express TS)            │
│   • JWT Auth + Refresh Token Rotation & RBAC Control             │
│   • Zod Input Validation & Helmet Security Headers                │
│   • Rate Limiting & Winston Structured Audit Logs                │
└──────┬─────────────────────────┬──────────────────────────┬──────┘
       │                         │                          │
┌──────▼────────────┐  ┌─────────▼──────────────┐  ┌────────▼─────────────┐
│  Zoho Catalyst    │  │  PostgreSQL + pgvector │  │  OpenAI GPT-4 RAG    │
│  Functions        │  │  DataStore / Relational│  │  Embedding Search    │
│  DataStore / Cache│  │  1000 FIR, 200 Criminal│  │  text-embedding-3-sm │
└───────────────────┘  └────────────────────────┘  └──────────────────────┘
```

---

### Core Components

#### 1. Security & RBAC Matrix
- **Administrator**: Full administrative control, user provisioning, system security audit.
- **Police Officer**: FIR creation, case viewing, search.
- **Investigation Officer**: Case editing, evidence chain of custody, suspect assignment, AI chat.
- **Crime Analyst**: Statewide analytics, crime trend forecasting, report exports.

#### 2. RAG (Retrieval-Augmented Generation) Pipeline
- **Embedding Model**: `text-embedding-3-small` (1536 dimensions).
- **Vector Search Engine**: `pgvector` with cosine similarity (`<=>` operator) and IVFFlat index.
- **LLM**: OpenAI `gpt-4o` with custom KSP system prompt for Indian Penal Code (IPC) context.
- **Features**: Automatic duplicate FIR detection, risk score calculation, case summarization.

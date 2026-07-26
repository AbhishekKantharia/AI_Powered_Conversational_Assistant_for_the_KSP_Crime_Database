# CrimeAssist AI — API Documentation

## Base URL
`/api/v1`

---

## Authentication Endpoints
- `POST /auth/login` - Authenticate user credentials and receive JWT access token.
- `POST /auth/logout` - Revoke refresh token and terminate session.
- `GET /auth/me` - Fetch authenticated user profile.
- `POST /auth/refresh` - Refresh access token using valid refresh token.

---

## Cases API
- `GET /cases` - Query paginated cases list with filters.
- `GET /cases/:id` - Fetch detailed case file, timeline, evidence, and notes.
- `POST /cases` - Register new case file.
- `PUT /cases/:id` - Update existing case status or assignment.
- `DELETE /cases/:id` - Archive case record (Admin only).

---

## FIR Search API
- `GET /fir` - Search FIR records by district, category, status, and complainant.
- `GET /fir/:id` - Fetch single FIR record details.
- `POST /fir` - Register new First Information Report.

---

## Criminal Profiles API
- `GET /criminals` - Search criminal database and wanted list.
- `GET /criminals/:id` - Retrieve full criminal history and risk score.
- `POST /criminals` - Add new criminal profile.

---

## AI Copilot & RAG API
- `POST /ai/chat` - Send question to GPT-4 RAG engine.
- `POST /ai/chat/stream` - SSE streaming endpoint for real-time AI responses.
- `POST /ai/summarize` - Auto-generate 3-paragraph executive summary for a case.
- `POST /ai/search` - Perform semantic vector search across all KSP records.
- `POST /ai/detect-duplicate` - Check potential duplicate FIRs using vector cosine similarity.

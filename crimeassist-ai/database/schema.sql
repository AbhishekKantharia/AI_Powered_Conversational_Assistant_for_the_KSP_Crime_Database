-- =============================================================================
-- CrimeAssist AI — Complete Database Schema
-- Karnataka State Police (KSP) Crime Investigation System
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- trigram search

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'administrator',
  'police_officer',
  'investigation_officer',
  'crime_analyst'
);

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

CREATE TYPE case_status AS ENUM (
  'registered',
  'under_investigation',
  'charge_sheet_filed',
  'court_proceedings',
  'closed',
  'archived'
);

CREATE TYPE crime_category AS ENUM (
  'murder',
  'robbery',
  'burglary',
  'theft',
  'fraud',
  'cybercrime',
  'assault',
  'kidnapping',
  'sexual_offense',
  'drug_offense',
  'arms_offense',
  'property_crime',
  'economic_offense',
  'terrorism',
  'missing_person',
  'accident',
  'other'
);

CREATE TYPE evidence_type AS ENUM (
  'physical',
  'digital',
  'documentary',
  'witness_statement',
  'forensic',
  'cctv',
  'audio',
  'video',
  'photograph',
  'biological'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE fir_status AS ENUM (
  'filed',
  'under_investigation',
  'chargesheeted',
  'disposed',
  'closed'
);

CREATE TYPE gender AS ENUM ('male', 'female', 'other', 'unknown');

CREATE TYPE report_type AS ENUM (
  'case_summary',
  'crime_analytics',
  'criminal_profile',
  'fir_report',
  'district_report',
  'monthly_report',
  'custom'
);

-- =============================================================================
-- DISTRICTS
-- =============================================================================

CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE,
  headquarters VARCHAR(100),
  area_sq_km DECIMAL(10,2),
  population BIGINT,
  division VARCHAR(50),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- POLICE STATIONS
-- =============================================================================

CREATE TABLE police_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) UNIQUE,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  officer_in_charge VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  jurisdiction_area TEXT,
  established_year INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_number VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role user_role NOT NULL DEFAULT 'police_officer',
  status user_status NOT NULL DEFAULT 'active',
  district_id UUID REFERENCES districts(id),
  station_id UUID REFERENCES police_stations(id),
  rank VARCHAR(80),
  phone VARCHAR(20),
  avatar_url TEXT,
  last_login TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(100),
  refresh_token_hash VARCHAR(255),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- FIR (First Information Report)
-- =============================================================================

CREATE TABLE fir (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fir_number VARCHAR(30) UNIQUE NOT NULL,
  station_id UUID NOT NULL REFERENCES police_stations(id),
  district_id UUID NOT NULL REFERENCES districts(id),
  complainant_name VARCHAR(150) NOT NULL,
  complainant_phone VARCHAR(20),
  complainant_address TEXT,
  complainant_gender gender,
  complainant_age INTEGER,
  incident_date TIMESTAMPTZ NOT NULL,
  incident_location TEXT NOT NULL,
  incident_latitude DECIMAL(10,8),
  incident_longitude DECIMAL(11,8),
  crime_category crime_category NOT NULL,
  crime_description TEXT NOT NULL,
  ipc_sections TEXT[], -- Array of IPC sections
  crpc_sections TEXT[],
  status fir_status NOT NULL DEFAULT 'filed',
  registered_by UUID REFERENCES users(id),
  investigation_officer_id UUID REFERENCES users(id),
  property_lost TEXT,
  property_value DECIMAL(15,2),
  accused_known BOOLEAN DEFAULT FALSE,
  accused_description TEXT,
  witnesses TEXT[],
  first_responders TEXT[],
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_fir_id UUID REFERENCES fir(id),
  duplicate_score DECIMAL(5,4),
  ai_summary TEXT,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CASES
-- =============================================================================

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number VARCHAR(30) UNIQUE NOT NULL,
  fir_id UUID REFERENCES fir(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  crime_category crime_category NOT NULL,
  status case_status NOT NULL DEFAULT 'registered',
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  district_id UUID NOT NULL REFERENCES districts(id),
  station_id UUID NOT NULL REFERENCES police_stations(id),
  assigned_officer_id UUID REFERENCES users(id),
  supervisor_id UUID REFERENCES users(id),
  incident_date TIMESTAMPTZ,
  case_registered_date TIMESTAMPTZ DEFAULT NOW(),
  expected_close_date DATE,
  actual_close_date DATE,
  court_name VARCHAR(150),
  court_case_number VARCHAR(50),
  chargesheet_filed_date DATE,
  chargesheet_number VARCHAR(50),
  ipc_sections TEXT[],
  property_involved BOOLEAN DEFAULT FALSE,
  property_description TEXT,
  property_value DECIMAL(15,2),
  ai_summary TEXT,
  ai_risk_score DECIMAL(5,2) DEFAULT 0,
  ai_recommendations JSONB,
  embedding vector(1536),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CRIMINALS
-- =============================================================================

CREATE TABLE criminals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  criminal_id VARCHAR(20) UNIQUE NOT NULL, -- KSP assigned ID
  full_name VARCHAR(150) NOT NULL,
  aliases TEXT[],
  date_of_birth DATE,
  age INTEGER,
  gender gender NOT NULL DEFAULT 'male',
  nationality VARCHAR(50) DEFAULT 'Indian',
  religion VARCHAR(50),
  caste VARCHAR(80),
  education VARCHAR(80),
  occupation VARCHAR(100),
  marital_status VARCHAR(20),
  father_name VARCHAR(150),
  mother_name VARCHAR(150),
  address TEXT,
  district_id UUID REFERENCES districts(id),
  phone VARCHAR(20),
  aadhaar_number VARCHAR(20), -- Encrypted
  pan_number VARCHAR(20),     -- Encrypted
  photo_url TEXT,
  fingerprint_reference VARCHAR(100),
  dna_reference VARCHAR(100),
  risk_level risk_level NOT NULL DEFAULT 'medium',
  risk_score DECIMAL(5,2) DEFAULT 50,
  is_wanted BOOLEAN DEFAULT FALSE,
  wanted_since DATE,
  reward_amount DECIMAL(12,2),
  is_absconding BOOLEAN DEFAULT FALSE,
  is_arrested BOOLEAN DEFAULT FALSE,
  last_known_location TEXT,
  known_associates UUID[], -- Array of criminal IDs
  modus_operandi TEXT,
  crime_specialization TEXT[],
  total_cases INTEGER DEFAULT 0,
  total_convictions INTEGER DEFAULT 0,
  active_cases INTEGER DEFAULT 0,
  ai_profile_summary TEXT,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- VICTIMS
-- =============================================================================

CREATE TABLE victims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  fir_id UUID REFERENCES fir(id),
  full_name VARCHAR(150) NOT NULL,
  age INTEGER,
  gender gender,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  occupation VARCHAR(100),
  relationship_to_accused VARCHAR(100),
  injury_details TEXT,
  medical_status VARCHAR(50),
  compensation_status VARCHAR(50),
  statement_recorded BOOLEAN DEFAULT FALSE,
  statement_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SUSPECTS
-- =============================================================================

CREATE TABLE suspects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  criminal_id UUID REFERENCES criminals(id),
  full_name VARCHAR(150) NOT NULL,
  age INTEGER,
  gender gender,
  address TEXT,
  phone VARCHAR(20),
  occupation VARCHAR(100),
  description TEXT,
  is_arrested BOOLEAN DEFAULT FALSE,
  arrest_date DATE,
  bail_status VARCHAR(50),
  bail_date DATE,
  is_convicted BOOLEAN DEFAULT FALSE,
  conviction_date DATE,
  sentence VARCHAR(200),
  role_in_crime VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- EVIDENCE
-- =============================================================================

CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  fir_id UUID REFERENCES fir(id),
  evidence_number VARCHAR(30) UNIQUE NOT NULL,
  type evidence_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location_found TEXT,
  found_date TIMESTAMPTZ,
  collected_by UUID REFERENCES users(id),
  chain_of_custody JSONB DEFAULT '[]',
  file_url TEXT,
  file_name VARCHAR(255),
  file_size BIGINT,
  file_mime_type VARCHAR(100),
  catalyst_file_id VARCHAR(100), -- Zoho Catalyst FileStore ID
  is_forensic_analyzed BOOLEAN DEFAULT FALSE,
  forensic_report TEXT,
  forensic_date DATE,
  court_submitted BOOLEAN DEFAULT FALSE,
  court_submission_date DATE,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- DOCUMENTS
-- =============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  fir_id UUID REFERENCES fir(id),
  criminal_id UUID REFERENCES criminals(id),
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(80) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size BIGINT,
  file_mime_type VARCHAR(100),
  catalyst_file_id VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  is_confidential BOOLEAN DEFAULT FALSE,
  access_roles user_role[],
  version INTEGER DEFAULT 1,
  tags TEXT[],
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CASE NOTES / TIMELINE EVENTS
-- =============================================================================

CREATE TABLE case_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  note_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, investigation, court, forensic, arrest
  title VARCHAR(255),
  content TEXT NOT NULL,
  is_confidential BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  mentioned_users UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- success, failure, warning
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CHAT HISTORY (AI Conversations)
-- =============================================================================

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model VARCHAR(50),
  context_documents UUID[], -- document IDs used for RAG context
  sources JSONB DEFAULT '[]',
  feedback VARCHAR(20), -- thumbs_up, thumbs_down
  feedback_note TEXT,
  is_error BOOLEAN DEFAULT FALSE,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- EMBEDDINGS (RAG Document Chunks)
-- =============================================================================

CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type VARCHAR(50) NOT NULL, -- fir, case, criminal, document
  source_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id, chunk_index)
);

-- =============================================================================
-- REPORTS
-- =============================================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type report_type NOT NULL,
  generated_by UUID REFERENCES users(id),
  district_id UUID REFERENCES districts(id),
  station_id UUID REFERENCES police_stations(id),
  date_from DATE,
  date_to DATE,
  parameters JSONB DEFAULT '{}',
  file_url TEXT,
  file_size BIGINT,
  catalyst_file_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending, generating, completed, failed
  download_count INTEGER DEFAULT 0,
  shared_with UUID[],
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ANALYTICS CACHE
-- =============================================================================

CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_type VARCHAR(80) NOT NULL,
  district_id UUID REFERENCES districts(id),
  period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_type, district_id, period, period_start)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_badge ON users(badge_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_station ON users(station_id);

-- FIR
CREATE INDEX idx_fir_number ON fir(fir_number);
CREATE INDEX idx_fir_station ON fir(station_id);
CREATE INDEX idx_fir_district ON fir(district_id);
CREATE INDEX idx_fir_status ON fir(status);
CREATE INDEX idx_fir_category ON fir(crime_category);
CREATE INDEX idx_fir_date ON fir(incident_date DESC);
CREATE INDEX idx_fir_officer ON fir(investigation_officer_id);
CREATE INDEX idx_fir_embedding ON fir USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- Trigram index for text search
CREATE INDEX idx_fir_description_trgm ON fir USING gin(crime_description gin_trgm_ops);

-- Cases
CREATE INDEX idx_cases_number ON cases(case_number);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_category ON cases(crime_category);
CREATE INDEX idx_cases_officer ON cases(assigned_officer_id);
CREATE INDEX idx_cases_district ON cases(district_id);
CREATE INDEX idx_cases_date ON cases(case_registered_date DESC);
CREATE INDEX idx_cases_embedding ON cases USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Criminals
CREATE INDEX idx_criminals_name ON criminals(full_name);
CREATE INDEX idx_criminals_id ON criminals(criminal_id);
CREATE INDEX idx_criminals_risk ON criminals(risk_level);
CREATE INDEX idx_criminals_wanted ON criminals(is_wanted) WHERE is_wanted = TRUE;
CREATE INDEX idx_criminals_embedding ON criminals USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_criminals_name_trgm ON criminals USING gin(full_name gin_trgm_ops);

-- Evidence
CREATE INDEX idx_evidence_case ON evidence(case_id);
CREATE INDEX idx_evidence_type ON evidence(type);

-- Documents
CREATE INDEX idx_documents_case ON documents(case_id);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Chat
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- Embeddings
CREATE INDEX idx_doc_embeddings_source ON document_embeddings(source_type, source_id);
CREATE INDEX idx_doc_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 200);

-- Audit
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Police Stations
CREATE INDEX idx_stations_district ON police_stations(district_id);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'districts', 'police_stations', 'fir', 'cases',
    'criminals', 'victims', 'suspects', 'evidence', 'documents',
    'case_notes', 'chat_sessions', 'reports'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- Auto-increment case message count
CREATE OR REPLACE FUNCTION increment_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET message_count = message_count + 1,
      total_tokens = total_tokens + COALESCE(NEW.tokens_used, 0),
      updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_message_count
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION increment_session_message_count();

-- Auto-update criminal total cases count
CREATE OR REPLACE FUNCTION update_criminal_case_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.criminal_id IS NOT NULL THEN
    UPDATE criminals
    SET total_cases = (
      SELECT COUNT(*) FROM suspects WHERE criminal_id = NEW.criminal_id
    ),
    active_cases = (
      SELECT COUNT(*) FROM suspects s
      JOIN cases c ON c.id = s.case_id
      WHERE s.criminal_id = NEW.criminal_id
      AND c.status NOT IN ('closed', 'archived')
    ),
    updated_at = NOW()
    WHERE id = NEW.criminal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_suspect_criminal_count
AFTER INSERT OR UPDATE OR DELETE ON suspects
FOR EACH ROW EXECUTE FUNCTION update_criminal_case_count();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active cases summary view
CREATE OR REPLACE VIEW v_active_cases AS
SELECT
  c.id,
  c.case_number,
  c.title,
  c.crime_category,
  c.status,
  c.priority,
  c.ai_risk_score,
  d.name AS district_name,
  ps.name AS station_name,
  u.full_name AS assigned_officer,
  COUNT(DISTINCT s.id) AS suspect_count,
  COUNT(DISTINCT v.id) AS victim_count,
  COUNT(DISTINCT e.id) AS evidence_count,
  c.case_registered_date,
  c.incident_date
FROM cases c
LEFT JOIN districts d ON d.id = c.district_id
LEFT JOIN police_stations ps ON ps.id = c.station_id
LEFT JOIN users u ON u.id = c.assigned_officer_id
LEFT JOIN suspects s ON s.case_id = c.id
LEFT JOIN victims v ON v.case_id = c.id
LEFT JOIN evidence e ON e.case_id = c.id
WHERE c.status NOT IN ('closed', 'archived')
GROUP BY c.id, d.name, ps.name, u.full_name;

-- Crime analytics view
CREATE OR REPLACE VIEW v_crime_analytics AS
SELECT
  DATE_TRUNC('month', f.incident_date) AS month,
  d.name AS district_name,
  f.crime_category,
  COUNT(*) AS total_fir,
  COUNT(CASE WHEN f.status = 'filed' THEN 1 END) AS pending,
  COUNT(CASE WHEN f.status = 'chargesheeted' THEN 1 END) AS chargesheeted,
  COUNT(CASE WHEN f.status = 'closed' THEN 1 END) AS closed
FROM fir f
JOIN districts d ON d.id = f.district_id
GROUP BY DATE_TRUNC('month', f.incident_date), d.name, f.crime_category;

-- Criminal wanted list view
CREATE OR REPLACE VIEW v_wanted_criminals AS
SELECT
  cr.id,
  cr.criminal_id,
  cr.full_name,
  cr.aliases,
  cr.risk_level,
  cr.risk_score,
  cr.is_wanted,
  cr.reward_amount,
  cr.last_known_location,
  cr.photo_url,
  cr.total_cases,
  cr.crime_specialization,
  d.name AS district_name
FROM criminals cr
LEFT JOIN districts d ON d.id = cr.district_id
WHERE cr.is_wanted = TRUE
ORDER BY cr.risk_score DESC;

-- Dashboard stats view
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM fir WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())) AS total_fir_this_year,
  (SELECT COUNT(*) FROM cases WHERE status NOT IN ('closed', 'archived')) AS open_cases,
  (SELECT COUNT(*) FROM cases WHERE status IN ('closed', 'archived')) AS closed_cases,
  (SELECT COUNT(*) FROM criminals WHERE is_wanted = TRUE) AS wanted_criminals,
  (SELECT COUNT(*) FROM fir WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS fir_this_month,
  (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_officers;

// ─── User & Auth Types ────────────────────────────────────────────────────────
export type UserRole =
  | 'administrator'
  | 'police_officer'
  | 'investigation_officer'
  | 'crime_analyst'

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending'

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
  status: UserStatus
  badgeNumber: string
  rank?: string
  phone?: string
  avatarUrl?: string
  stationId?: string
  stationName?: string
  districtId?: string
  districtName?: string
  lastLogin?: string
  twoFactorEnabled: boolean
  preferences?: Record<string, unknown>
  createdAt: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ─── FIR Types ────────────────────────────────────────────────────────────────
export type FIRStatus = 'filed' | 'under_investigation' | 'chargesheeted' | 'disposed' | 'closed'

export type CrimeCategory =
  | 'murder' | 'robbery' | 'burglary' | 'theft' | 'fraud' | 'cybercrime'
  | 'assault' | 'kidnapping' | 'sexual_offense' | 'drug_offense'
  | 'arms_offense' | 'property_crime' | 'economic_offense' | 'terrorism'
  | 'missing_person' | 'accident' | 'other'

export interface FIR {
  id: string
  firNumber: string
  stationId: string
  stationName: string
  districtId: string
  districtName: string
  complainantName: string
  complainantPhone?: string
  complainantAddress?: string
  complainantGender?: string
  complainantAge?: number
  incidentDate: string
  incidentLocation: string
  crimeCategory: CrimeCategory
  crimeDescription: string
  ipcSections: string[]
  status: FIRStatus
  registeredBy?: string
  investigationOfficer?: string
  officerBadge?: string
  propertyLost?: string
  propertyValue?: number
  accusedKnown: boolean
  isDuplicate: boolean
  duplicateFirId?: string
  aiSummary?: string
  createdAt: string
  updatedAt: string
}

// ─── Case Types ───────────────────────────────────────────────────────────────
export type CaseStatus =
  | 'registered'
  | 'under_investigation'
  | 'charge_sheet_filed'
  | 'court_proceedings'
  | 'closed'
  | 'archived'

export interface Case {
  id: string
  caseNumber: string
  firId?: string
  firNumber?: string
  title: string
  description?: string
  crimeCategory: CrimeCategory
  status: CaseStatus
  priority: 1 | 2 | 3 | 4 | 5
  districtId: string
  districtName: string
  stationId: string
  stationName: string
  assignedOfficer?: string
  assignedOfficerName?: string
  officerBadge?: string
  officerRank?: string
  incidentDate?: string
  caseRegisteredDate: string
  ipcSections: string[]
  aiRiskScore: number
  aiSummary?: string
  aiRecommendations?: unknown
  tags: string[]
  suspectCount: number
  victimCount: number
  evidenceCount: number
  suspects?: Suspect[]
  victims?: Victim[]
  evidence?: Evidence[]
  notes?: CaseNote[]
  createdAt: string
  updatedAt: string
}

// ─── Criminal Types ───────────────────────────────────────────────────────────
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Criminal {
  id: string
  criminalId: string
  fullName: string
  aliases: string[]
  dateOfBirth?: string
  age?: number
  gender: string
  nationality: string
  religion?: string
  education?: string
  occupation?: string
  maritalStatus?: string
  fatherName?: string
  motherName?: string
  address?: string
  districtId?: string
  districtName?: string
  phone?: string
  photoUrl?: string
  riskLevel: RiskLevel
  riskScore: number
  isWanted: boolean
  wantedSince?: string
  rewardAmount?: number
  isAbsconding: boolean
  isArrested: boolean
  lastKnownLocation?: string
  modusOperandi?: string
  crimeSpecialization: string[]
  totalCases: number
  totalConvictions: number
  activeCases: number
  aiProfileSummary?: string
  cases?: Array<{
    caseNumber: string
    title: string
    crimeCategory: string
    status: string
    caseRegisteredDate: string
    roleInCrime?: string
  }>
  createdAt: string
  updatedAt: string
}

// ─── Evidence Types ───────────────────────────────────────────────────────────
export type EvidenceType =
  | 'physical' | 'digital' | 'documentary' | 'witness_statement'
  | 'forensic' | 'cctv' | 'audio' | 'video' | 'photograph' | 'biological'

export interface Evidence {
  id: string
  caseId: string
  firId?: string
  evidenceNumber: string
  type: EvidenceType
  title: string
  description?: string
  locationFound?: string
  foundDate?: string
  collectedBy?: string
  collectedByName?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileMimeType?: string
  isForensicAnalyzed: boolean
  forensicReport?: string
  courtSubmitted: boolean
  tags: string[]
  createdAt: string
}

// ─── Other Types ──────────────────────────────────────────────────────────────
export interface Suspect {
  id: string
  caseId: string
  criminalId?: string
  criminalName?: string
  fullName: string
  age?: number
  gender?: string
  address?: string
  isArrested: boolean
  roleInCrime?: string
  createdAt: string
}

export interface Victim {
  id: string
  caseId: string
  fullName: string
  age?: number
  gender?: string
  phone?: string
  address?: string
  injuryDetails?: string
  medicalStatus?: string
  createdAt: string
}

export interface CaseNote {
  id: string
  caseId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  authorRole: string
  noteType: string
  title?: string
  content: string
  isConfidential: boolean
  createdAt: string
}

// ─── Analytics Types ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalFirThisYear: number
  openCases: number
  closedCases: number
  wantedCriminals: number
  firThisMonth: number
  activeOfficers: number
}

export interface MonthlyTrend {
  month: string
  monthDate: string
  total: number
  pending: number
  resolved: number
}

export interface DistrictStat {
  district: string
  crimeCount: number
}

// ─── AI / Chat Types ──────────────────────────────────────────────────────────
export interface ChatSession {
  id: string
  title: string
  messageCount: number
  totalTokens: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: Array<{ source: string; sourceId: string; similarity: number }>
  feedback?: 'thumbs_up' | 'thumbs_down'
  processingTimeMs?: number
  createdAt: string
}

// ─── API Response Types ───────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  cached?: boolean
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    stack?: string
  }
  timestamp: string
  path: string
}

// ─── Filter Types ─────────────────────────────────────────────────────────────
export interface FIRFilters {
  districtId?: string
  stationId?: string
  crimeCategory?: CrimeCategory
  status?: FIRStatus
  dateFrom?: string
  dateTo?: string
  search?: string
  officerId?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CaseFilters {
  status?: CaseStatus
  crimeCategory?: CrimeCategory
  districtId?: string
  stationId?: string
  officerId?: string
  priority?: number
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CriminalFilters {
  riskLevel?: RiskLevel
  isWanted?: boolean
  isArrested?: boolean
  districtId?: string
  gender?: string
  search?: string
  page?: number
  limit?: number
}

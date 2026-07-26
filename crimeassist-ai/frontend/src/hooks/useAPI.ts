import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../services/api'
import type { ApiResponse, PaginatedResponse, FIR, Case, Criminal, Suspect, Evidence, CaseNote, DashboardStats, ChatMessage, ChatSession, User } from '../types'

// ─── Auth Hooks ───────────────────────────────────────────────────────────────
export function useLogin() {
  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const { data } = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', { username, password })
      return data.data
    },
  })
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me')
      return data.data.user
    },
    retry: false,
    staleTime: 0,
  })
}

// ─── FIR Hooks ────────────────────────────────────────────────────────────────
export function useFIRList(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['fir', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<FIR>>('/fir', { params: filters })
      return data
    },
  })
}

export function useFIRDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['fir', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<FIR>>(`/fir/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateFIR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fir: Partial<FIR>) => {
      const { data } = await apiClient.post<ApiResponse<FIR>>('/fir', fir)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fir'] }) },
  })
}

// ─── Cases Hooks ──────────────────────────────────────────────────────────────
export function useCaseList(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Case>>('/cases', { params: filters })
      return data
    },
  })
}

export function useCaseDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['cases', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Case & { assignedOfficerName?: string; suspects: Suspect[]; evidence: Evidence[]; notes: CaseNote[] }>>(`/cases/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (caseData: Partial<Case>) => {
      const { data } = await apiClient.post<ApiResponse<Case>>('/cases', caseData)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cases'] }) },
  })
}

export function useUpdateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...caseData }: Partial<Case> & { id: string }) => {
      const { data } = await apiClient.put<ApiResponse<Case>>(`/cases/${id}`, caseData)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cases'] }) },
  })
}

export function useAddCaseNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ caseId, content, noteType }: { caseId: string; content: string; noteType: string }) => {
      const { data } = await apiClient.post<ApiResponse<unknown>>(`/cases/${caseId}/notes`, { content, noteType })
      return data.data
    },
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: ['cases', vars.caseId] }) },
  })
}

// ─── Criminals Hooks ──────────────────────────────────────────────────────────
export function useCriminalList(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['criminals', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Criminal>>('/criminals', { params: filters })
      return data
    },
  })
}

export function useCriminalDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['criminals', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Criminal & { cases: unknown[] }>>(`/criminals/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useWantedCriminals() {
  return useQuery({
    queryKey: ['criminals', 'wanted'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Criminal[]>>('/criminals/wanted')
      return data.data
    },
  })
}

export function useCreateCriminal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (criminal: Partial<Criminal>) => {
      const { data } = await apiClient.post<ApiResponse<Criminal>>('/criminals', criminal)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['criminals'] }) },
  })
}

export function useUpdateCriminal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...criminal }: Partial<Criminal> & { id: string }) => {
      const { data } = await apiClient.put<ApiResponse<Criminal>>(`/criminals/${id}`, criminal)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['criminals'] }) },
  })
}

// ─── Analytics Hooks ──────────────────────────────────────────────────────────
export function useDashboardData() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{
        stats: DashboardStats
        recentCases: Case[]
        topDistricts: Array<{ district: string; crimeCount: number }>
        crimeByCategory: Array<{ crimeCategory: string; count: number }>
        monthlyTrend: Array<{ month: string; total: number; pending: number; resolved: number }>
      }>>('/analytics/dashboard')
      return data.data
    },
  })
}

export function useCrimeTrends(filters?: { districtId?: string; year?: number; period?: string }) {
  return useQuery({
    queryKey: ['analytics', 'crime-trends', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<unknown[]>>('/analytics/crime-trends', { params: filters })
      return data.data
    },
  })
}

export function useDistrictComparison() {
  return useQuery({
    queryKey: ['analytics', 'district-comparison'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Array<{ district: string; totalFir: number; openCases: number }>>>('/analytics/district-comparison')
      return data.data
    },
  })
}

export function useHeatmapData() {
  return useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<unknown[]>>('/analytics/heatmap')
      return data.data
    },
  })
}

export function useCriminalStats() {
  return useQuery({
    queryKey: ['analytics', 'criminal-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{
        riskDistribution: Array<{ riskLevel: string; count: number }>
        ageGroups: Array<{ ageGroup: string; count: number }>
        wantedByDistrict: Array<{ district: string; wantedCount: number }>
      }>>('/analytics/criminal-stats')
      return data.data
    },
  })
}

export function usePredictionData() {
  return useQuery({
    queryKey: ['analytics', 'prediction'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Array<{ month: string; count: number; movingAvg3: number }>>>('/analytics/prediction')
      return data.data
    },
  })
}

// ─── AI Chat Hooks ────────────────────────────────────────────────────────────
export function useChat() {
  return useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId?: string }) => {
      const { data } = await apiClient.post<ApiResponse<{ response: string; sessionId: string; sources: unknown[]; processingTimeMs: number }>>('/ai/chat', { message, sessionId })
      return data.data
    },
  })
}

export function useChatSessions() {
  return useQuery({
    queryKey: ['ai', 'sessions'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ChatSession[]>>('/ai/sessions')
      return data.data
    },
  })
}

export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['ai', 'sessions', sessionId, 'messages'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<ChatMessage[]>>(`/ai/sessions/${sessionId}/messages`)
      return data.data
    },
    enabled: !!sessionId,
  })
}

export function useSummarize() {
  return useMutation({
    mutationFn: async ({ type, id }: { type: 'fir' | 'case'; id: string }) => {
      const { data } = await apiClient.post<ApiResponse<{ summary: string }>>('/ai/summarize', { type, id })
      return data.data.summary
    },
  })
}

export function useAISearch() {
  return useMutation({
    mutationFn: async (query_text: string) => {
      const { data } = await apiClient.post<ApiResponse<unknown[]>>('/ai/search', { query: query_text })
      return data.data
    },
  })
}

export function useRiskScore() {
  return useMutation({
    mutationFn: async (criminalId: string) => {
      const { data } = await apiClient.post<ApiResponse<{ riskScore: number; riskLevel: string; factors: unknown[] }>>('/ai/risk-score', { criminalId })
      return data.data
    },
  })
}

// ─── Reports Hooks ────────────────────────────────────────────────────────────
export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<unknown[]>>('/reports')
      return data.data
    },
  })
}

export function useGenerateReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reportConfig: { type: string; title: string; filters?: Record<string, unknown> }) => {
      const { data } = await apiClient.post<ApiResponse<unknown>>('/reports', reportConfig)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }) },
  })
}

// ─── Users / Settings Hooks ───────────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (profile: { fullName?: string; email?: string; phone?: string }) => {
      const { data } = await apiClient.put<ApiResponse<User>>('/settings/profile', profile)
      return data.data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auth', 'me'] }) },
  })
}

export function useAuditLogs(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['users', 'audit-logs', filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<unknown[]>>('/users/audit-logs', { params: filters })
      return data.data
    },
  })
}

// ─── Public Data Hooks (NCRB, IPC, Geography) ────────────────────────────────
export interface IPCSection {
  section: string
  title: string
  description: string
  punishment?: string
  category?: string
}

export interface NCRBDistrictSummary {
  district: string
  totalCrime: number
  murder: number
  robbery: number
  theft: number
  burglary: number
  cybercrime: number
  fraud: number
  assault: number
  kidnapping: number
  drugOffense: number
}

export interface KarnatakaDistrictPublic {
  name: string
  code: string
  lat: number
  lng: number
  population: number
  areaSqKm: number
  headquarters: string
  division: string
}

export function useIPCSections() {
  return useQuery({
    queryKey: ['public-data', 'ipc-sections'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<IPCSection[]>>('/public-data/ipc-sections')
      return data.data
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
  })
}

export function useIPCSearch(query_text: string) {
  return useQuery({
    queryKey: ['public-data', 'ipc-search', query_text],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<IPCSection[]>>(`/public-data/ipc-search`, { params: { q: query_text } })
      return data.data
    },
    enabled: query_text.length >= 1,
    staleTime: 60 * 60 * 1000,
  })
}

export function useKarnatakaCrimeStats() {
  return useQuery({
    queryKey: ['public-data', 'karnataka-crime-stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<NCRBDistrictSummary[]>>('/public-data/karnataka-crime-stats')
      return data.data
    },
    staleTime: 60 * 60 * 1000,
  })
}

export function useNCRBSummary() {
  return useQuery({
    queryKey: ['public-data', 'ncrb-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{
        totalCrime: number
        districts: number
        byCategory: Record<string, number>
        topDistricts: NCRBDistrictSummary[]
        source: string
      }>>('/public-data/ncrb-summary')
      return data.data
    },
    staleTime: 60 * 60 * 1000,
  })
}

export function useKarnatakaDistrictsPublic() {
  return useQuery({
    queryKey: ['public-data', 'karnataka-districts'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<KarnatakaDistrictPublic[]>>('/public-data/karnataka-districts')
      return data.data
    },
    staleTime: 60 * 60 * 1000,
  })
}

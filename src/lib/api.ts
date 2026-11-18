export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export type Account = { id: string; email: string; displayName: string; status: string; admin?: boolean; createdAt: string; updatedAt: string }
export type Skill = { id: string; slug: string; name: string }
export type DeveloperProfile = {
  id: string; developerId: string; displayName: string; headline: string; biography: string; yearsExperience: number
  githubUrl: string | null; linkedinUrl: string | null; portfolioUrl: string | null; teachingApproach: string
  availability: string; skills: Skill[]; createdAt: string; updatedAt: string
}
export type ProfileInput = Omit<DeveloperProfile, 'id' | 'developerId' | 'displayName' | 'skills' | 'createdAt' | 'updatedAt'> & { skillIds: string[] }
export type LearningRequestStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'MATCHED'
export type LearningLevel = 'BEGINNER' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
export type LearningFormat = 'ONLINE' | 'OFFLINE'
export type BudgetUnit = 'PER_HOUR' | 'PER_SESSION' | 'TOTAL'
export type LearningRequest = {
  id: string; title: string; description: string; learningGoal: string; currentLevel: LearningLevel
  preferredFormat: LearningFormat; city: string | null; budgetMin: number | null; budgetMax: number | null
  budgetUnit: BudgetUnit | null; currency: 'VND'; preferredSchedule: string; expectedDuration: string
  teachingExpectations: string; requiresCv: boolean; status: LearningRequestStatus; skills: Skill[]
  createdAt: string; updatedAt: string; publishedAt: string | null; closedAt: string | null
}
export type LearningRequestInput = Omit<LearningRequest, 'id' | 'currency' | 'status' | 'skills' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'closedAt'> & { skillIds: string[] }
export type PageResult<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number }
export type DiscoveryFilters = {
  q?: string; skillIds?: string[]; level?: LearningLevel | ''; format?: LearningFormat | ''
  minBudget?: string; maxBudget?: string; budgetUnit?: BudgetUnit | ''; requiresCv?: boolean | ''
  page?: number; size?: number; sort?: 'NEWEST' | 'OLDEST'
}

export type DeveloperCv = { id: string; fileName: string; sizeBytes: number; uploadedAt: string; updatedAt: string }
export type ApplicantSummary = { profileId: string; displayName: string; headline: string; biography: string; yearsExperience: number; skills: Skill[] }
export type ProposalStatus = 'SUBMITTED' | 'WITHDRAWN'
export type Proposal = {
  id: string; learningRequestId: string; learningRequestTitle: string; learningRequestStatus: LearningRequestStatus
  developer: ApplicantSummary; introduction: string; teachingApproach: string; relevantExperience: string
  proposedRate: number; rateUnit: BudgetUnit; currency: 'VND'; proposedSchedule: string; estimatedDuration: string
  hasCv: boolean; status: ProposalStatus; createdAt: string; updatedAt: string; withdrawnAt: string | null
}
export type MatchStatus = 'CONFIRMED'
export type ProposalSelectionStatus = 'PENDING' | 'SELECTED' | 'NOT_SELECTED' | 'WITHDRAWN'
export type ProposalSelection = { learningRequestId: string; requestStatus: LearningRequestStatus; proposalStatus: ProposalStatus; selectionStatus: ProposalSelectionStatus }
export type ConfirmedMatch = {
  id: string; learningRequestId: string; learningRequestTitle: string; learnerDisplayName: string
  selectedProposalId: string; developer: ApplicantSummary; proposal: Proposal; status: MatchStatus
  createdAt: string; updatedAt: string
}
export type ProposalInput = {
  introduction: string; teachingApproach: string; relevantExperience: string; proposedRate: number
  rateUnit: BudgetUnit; proposedSchedule: string; estimatedDuration: string; cvId: string | null; removeCv: boolean
}
export type ReportTargetType = 'LEARNING_REQUEST' | 'DEVELOPER_PROFILE' | 'TEACHING_PROPOSAL'
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED'
export type ModerationReport = {
  id: string; reporterId: string; targetType: ReportTargetType; targetId: string; reason: string
  description: string | null; status: ReportStatus; createdAt: string; reviewedAt: string | null
}
export type PilotOverview = {
  totalRegisteredUsers: number; activeDevelopers: number; openLearningRequests: number
  submittedProposals: number; confirmedMatches: number; pendingModerationReports: number
  publishedLearningRequests: number; requestsWithAtLeastOneProposal: number; matchedLearningRequests: number
  requestProposalCoveragePercent: number; requestMatchConversionPercent: number
  averageMinutesToFirstProposal: number; averageMinutesToConfirmedMatch: number
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: Record<string, string> = {}) {
    super(message)
  }
}

function cookie(name: string): string | undefined {
  return document.cookie.split('; ').find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' })
    const token = cookie('XSRF-TOKEN')
    if (token) headers.set('X-XSRF-TOKEN', decodeURIComponent(token))
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, method, headers, credentials: 'include' })
  if (!response.ok) {
    let data: { code?: string; detail?: string; fieldErrors?: Record<string, string> } = {}
    try { data = await response.json() as typeof data } catch { /* keep the safe status message */ }
    throw new ApiError(response.status, data.code ?? 'request_failed', data.detail ?? `Yêu cầu thất bại (${response.status}).`, data.fieldErrors)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function checkApiHealth(): Promise<{ status: string }> {
  const apiBase = new URL(API_BASE_URL, window.location.origin)
  const response = await fetch(new URL('/actuator/health', apiBase), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`API health returned ${response.status}`)
  const health = await response.json() as { status: string }
  if (health.status !== 'UP') throw new Error(`API health is ${health.status}`)
  return health
}

function queryString(values: Record<string, string | number | boolean | undefined | null>): string {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  return params.toString()
}

export const api = {
  current: () => request<Account>('/auth/me'),
  register: (input: { email: string; password: string; displayName: string }) => request<Account>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) => request<Account>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  skills: () => request<Skill[]>('/skills'),
  myProfile: () => request<DeveloperProfile>('/developers/me'),
  publicProfile: (id: string) => request<DeveloperProfile>(`/developers/${encodeURIComponent(id)}`),
  createProfile: (input: ProfileInput) => request<DeveloperProfile>('/developers/me', { method: 'POST', body: JSON.stringify(input) }),
  updateProfile: (input: ProfileInput) => request<DeveloperProfile>('/developers/me', { method: 'PUT', body: JSON.stringify(input) }),
  discoverRequests: (filters: DiscoveryFilters) => {
    const query = queryString({ q: filters.q, level: filters.level, format: filters.format,
      minBudget: filters.minBudget, maxBudget: filters.maxBudget, budgetUnit: filters.budgetUnit,
      requiresCv: filters.requiresCv, page: filters.page ?? 0, size: filters.size ?? 12, sort: filters.sort ?? 'NEWEST' })
    const params = new URLSearchParams(query)
    filters.skillIds?.forEach((id) => params.append('skillIds', id))
    return request<PageResult<LearningRequest>>(`/learning-requests?${params.toString()}`)
  },
  learningRequest: (id: string) => request<LearningRequest>(`/learning-requests/${encodeURIComponent(id)}`),
  myLearningRequests: (status?: LearningRequestStatus, page = 0) => request<PageResult<LearningRequest>>(
    `/me/learning-requests?${queryString({ status, page, size: 20 })}`),
  createLearningRequest: (input: LearningRequestInput) => request<LearningRequest>('/learning-requests', { method: 'POST', body: JSON.stringify(input) }),
  updateLearningRequest: (id: string, input: LearningRequestInput) => request<LearningRequest>(`/learning-requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  publishLearningRequest: (id: string) => request<LearningRequest>(`/learning-requests/${encodeURIComponent(id)}/publish`, { method: 'POST' }),
  closeLearningRequest: (id: string) => request<LearningRequest>(`/learning-requests/${encodeURIComponent(id)}/close`, { method: 'POST' }),
  savedRequests: () => request<LearningRequest[]>('/saved-requests'),
  saveRequest: (id: string) => request<void>(`/saved-requests/${encodeURIComponent(id)}`, { method: 'PUT' }),
  unsaveRequest: (id: string) => request<void>(`/saved-requests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  myCvs: () => request<DeveloperCv[]>('/developer/cvs'),
  uploadCv: (file: File) => { const body = new FormData(); body.append('file', file); return request<DeveloperCv>('/developer/cvs', { method: 'POST', body }) },
  replaceCv: (id: string, file: File) => { const body = new FormData(); body.append('file', file); return request<DeveloperCv>(`/developer/cvs/${encodeURIComponent(id)}`, { method: 'PUT', body }) },
  deleteCv: (id: string) => request<void>(`/developer/cvs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  submitProposal: (requestId: string, input: ProposalInput) => request<Proposal>(`/learning-requests/${encodeURIComponent(requestId)}/proposals`, { method: 'POST', body: JSON.stringify(input) }),
  myProposals: () => request<Proposal[]>('/me/proposals'),
  receivedProposals: (requestId: string) => request<Proposal[]>(`/me/learning-requests/${encodeURIComponent(requestId)}/proposals`),
  updateProposal: (id: string, input: ProposalInput) => request<Proposal>(`/proposals/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  withdrawProposal: (id: string) => request<Proposal>(`/proposals/${encodeURIComponent(id)}/withdraw`, { method: 'POST' }),
  selectProposal: (requestId: string, proposalId: string) => request<ConfirmedMatch>(`/me/learning-requests/${encodeURIComponent(requestId)}/match`, { method: 'POST', body: JSON.stringify({ proposalId }) }),
  learnerMatch: (requestId: string) => request<ConfirmedMatch>(`/me/learning-requests/${encodeURIComponent(requestId)}/match`),
  developerMatches: () => request<ConfirmedMatch[]>('/me/matches'),
  developerMatch: (matchId: string) => request<ConfirmedMatch>(`/me/matches/${encodeURIComponent(matchId)}`),
  proposalSelectionStatus: (proposalId: string) => request<ProposalSelection>(`/proposals/${encodeURIComponent(proposalId)}/selection-status`),
  createReport: (input: { targetType: ReportTargetType; targetId: string; reason: string; description?: string }) => request<ModerationReport>('/reports', { method: 'POST', body: JSON.stringify(input) }),
  adminReports: (status = 'OPEN') => request<ModerationReport[]>(`/admin/reports?${queryString({ status })}`),
  reviewReport: (id: string, status: Exclude<ReportStatus, 'OPEN'>) => request<ModerationReport>(`/admin/reports/${encodeURIComponent(id)}/review`, { method: 'POST', body: JSON.stringify({ status }) }),
  hideRequest: (id: string) => request<void>(`/admin/learning-requests/${encodeURIComponent(id)}/hide`, { method: 'POST' }),
  restoreRequest: (id: string) => request<void>(`/admin/learning-requests/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
  suspendUser: (id: string) => request<void>(`/admin/users/${encodeURIComponent(id)}/suspend`, { method: 'POST' }),
  adminPilotOverview: () => request<PilotOverview>('/admin/pilot-overview'),
  downloadProposalCv: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/proposals/${encodeURIComponent(id)}/cv`, { credentials: 'include', headers: { Accept: 'application/pdf' } })
    if (!response.ok) {
      let detail = `Không thể tải CV (${response.status}).`
      try { detail = ((await response.json()) as { detail?: string }).detail ?? detail } catch { /* use safe status text */ }
      throw new ApiError(response.status, 'cv_download_failed', detail)
    }
    return response.blob()
  },
}

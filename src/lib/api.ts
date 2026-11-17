export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export type Account = { id: string; email: string; displayName: string; status: string; createdAt: string; updatedAt: string }
export type Skill = { id: string; slug: string; name: string }
export type DeveloperProfile = {
  id: string; developerId: string; displayName: string; headline: string; biography: string; yearsExperience: number
  githubUrl: string | null; linkedinUrl: string | null; portfolioUrl: string | null; teachingApproach: string
  availability: string; skills: Skill[]; createdAt: string; updatedAt: string
}
export type ProfileInput = Omit<DeveloperProfile, 'id' | 'developerId' | 'displayName' | 'skills' | 'createdAt' | 'updatedAt'> & { skillIds: string[] }

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
  if (init.body) headers.set('Content-Type', 'application/json')
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
  const response = await fetch(new URL('/actuator/health', API_BASE_URL), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`API health returned ${response.status}`)
  const health = await response.json() as { status: string }
  if (health.status !== 'UP') throw new Error(`API health is ${health.status}`)
  return health
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
}

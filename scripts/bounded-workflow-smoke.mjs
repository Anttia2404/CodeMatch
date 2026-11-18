import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

const apiBase = new URL(process.env.CODEMATCH_WORKFLOW_API_BASE ?? 'http://127.0.0.1:5173/api/v1/')
const token = randomUUID()
const password = `M6-${randomUUID()}-Aa1!`

function client() {
  return { cookies: new Map() }
}

async function call(session, path, { method = 'GET', body, csrf = false } = {}) {
  const headers = { accept: 'application/json' }
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (csrf) {
    const csrfToken = session.cookies.get('XSRF-TOKEN')
    if (!csrfToken) throw new Error('CSRF cookie was not issued by the API.')
    headers['x-xsrf-token'] = csrfToken
  }
  if (session.cookies.size) headers.cookie = [...session.cookies].map(([name, value]) => `${name}=${value}`).join('; ')
  const started = performance.now()
  const response = await fetch(new URL(path.replace(/^\//, ''), apiBase), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';', 1)[0]
    const separator = pair.indexOf('=')
    if (separator > 0) session.cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
  }
  const text = await response.text()
  let data = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }
  return { status: response.status, data, ms: performance.now() - started }
}

function requireStatus(response, expected, label) {
  if (response.status !== expected) {
    const code = response.data?.code ?? response.data?.detail ?? response.data
    throw new Error(`${label}: expected HTTP ${expected}, got ${response.status} (${String(code).slice(0, 180)})`)
  }
}

async function register(name) {
  const session = client()
  requireStatus(await call(session, 'auth/csrf'), 204, 'CSRF bootstrap')
  const email = `m6-load-${name}-${token}@example.test`
  requireStatus(await call(session, 'auth/register', {
    method: 'POST', csrf: true,
    body: { email, password, displayName: `M6 Load ${name}` },
  }), 201, `${name} registration`)
  requireStatus(await call(session, 'auth/login', {
    method: 'POST', csrf: true,
    body: { email, password },
  }), 200, `${name} login`)
  requireStatus(await call(session, 'auth/csrf'), 204, `${name} post-login CSRF bootstrap`)
  return session
}

function summarize(label, responses) {
  const values = responses.map((response) => response.ms).sort((a, b) => a - b)
  const percentile = (p) => values[Math.max(0, Math.ceil(p * values.length) - 1)] ?? 0
  const statuses = new Map()
  for (const response of responses) statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1)
  const statusText = [...statuses].sort(([a], [b]) => a - b).map(([status, count]) => `${status}:${count}`).join(', ')
  console.log(`${label}: ${responses.length} concurrent; HTTP ${statusText}; p50=${percentile(0.5).toFixed(1)} ms; p95=${percentile(0.95).toFixed(1)} ms`)
}

const skillResponse = await call(client(), 'skills')
requireStatus(skillResponse, 200, 'Skill catalog')
const reactSkill = skillResponse.data.find((skill) => skill.slug === 'react')
if (!reactSkill) throw new Error('React skill is missing from the isolated test database.')

const learner = await register('learner')
const profileSessions = await Promise.all(Array.from({ length: 4 }, (_, index) => register(`developer-${index + 1}`)))

for (let index = 0; index < profileSessions.length; index++) {
  const profileResponse = await call(profileSessions[index], 'developers/me', {
    method: 'POST', csrf: true,
    body: {
      headline: 'M6 load-smoke React mentor',
      biography: 'Synthetic local-only developer profile used for a bounded concurrency smoke.',
      yearsExperience: 4,
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
      teachingApproach: 'Short practical steps with a small example project.',
      availability: 'Evenings during weekdays',
      skillIds: [reactSkill.id],
    },
  })
  requireStatus(profileResponse, 201, `Developer ${index + 1} profile`)
}

const requestResponse = await call(learner, 'learning-requests', {
  method: 'POST', csrf: true,
  body: {
    title: `M6 concurrent proposal smoke ${token.slice(0, 8)}`,
    description: 'Synthetic request used only to measure a small local concurrent API workflow.',
    learningGoal: 'Practice building a small React application with a real API.',
    currentLevel: 'BEGINNER',
    preferredFormat: 'ONLINE',
    city: null,
    budgetMin: null,
    budgetMax: null,
    budgetUnit: null,
    preferredSchedule: 'Weekday evenings',
    expectedDuration: 'Four weeks',
    teachingExpectations: 'Practical examples and clear explanations.',
    requiresCv: false,
    skillIds: [reactSkill.id],
  },
})
requireStatus(requestResponse, 201, 'Learning request creation')
const requestId = requestResponse.data.id
requireStatus(await call(learner, `learning-requests/${requestId}/publish`, { method: 'POST', csrf: true }), 200, 'Request publish')

const proposalWork = profileSessions.map((session, index) => call(session, `learning-requests/${requestId}/proposals`, {
  method: 'POST', csrf: true,
  body: {
    introduction: `I can guide this learner through the requested React practice workflow, with clear weekly milestones and feedback. (${index + 1})`,
    teachingApproach: 'We will build small features in sequence and review each working result together.',
    relevantExperience: 'I have built and explained practical React projects for learners at this level.',
    proposedRate: 200000,
    rateUnit: 'PER_SESSION',
    proposedSchedule: 'Weekday evenings',
    estimatedDuration: 'Four sessions over one month',
    cvId: null,
    removeCv: false,
  },
}))
const proposalsStarted = performance.now()
const proposals = await Promise.all(proposalWork)
const proposalElapsed = performance.now() - proposalsStarted
summarize('Concurrent proposal submissions', proposals)
if (!proposals.every((response) => response.status === 201)) throw new Error('All four independent proposal submissions were not accepted.')
console.log(`Proposal batch wall time: ${proposalElapsed.toFixed(1)} ms`)

const matchWork = proposals.map((proposal) => call(learner, `me/learning-requests/${requestId}/match`, {
  method: 'POST', csrf: true,
  body: { proposalId: proposal.data.id },
}))
const matchesStarted = performance.now()
const matches = await Promise.all(matchWork)
const matchElapsed = performance.now() - matchesStarted
summarize('Concurrent match selection', matches)
const successfulMatches = matches.filter((response) => response.status === 200).length
const expectedConflicts = matches.filter((response) => response.status === 409).length
if (successfulMatches !== 1 || expectedConflicts !== 3) throw new Error(`Expected one winning match and three conflicts; got ${successfulMatches} success and ${expectedConflicts} conflict.`)
console.log(`Match batch wall time: ${matchElapsed.toFixed(1)} ms`)

const activeConnections = execFileSync('docker', [
  'compose', '--project-name', process.env.CODEMATCH_E2E_COMPOSE_PROJECT ?? 'codematch-m6-e2e',
  '-f', 'docker-compose.e2e.yml', 'exec', '-T', 'postgres', 'psql', '-U', 'codematch_e2e', '-d', 'codematch_e2e',
  '-tA', '-c', "select count(*) from pg_stat_activity where datname = 'codematch_e2e'",
], { encoding: 'utf8' }).trim()
console.log(`PostgreSQL active sessions after the bounded burst: ${activeConnections}`)
try {
  const stats = execFileSync('docker', ['stats', '--no-stream', '--format', '{{.Name}} CPU={{.CPUPerc}} MEM={{.MemUsage}}',
    `codematch-m6-e2e-api-1`, `codematch-m6-e2e-postgres-1`], { encoding: 'utf8' }).trim()
  console.log(`Docker resource snapshot:\n${stats}`)
} catch {
  console.log('Docker resource snapshot unavailable; collect with docker stats while the isolated stack is running.')
}

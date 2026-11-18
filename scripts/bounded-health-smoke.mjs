const baseUrl = process.env.CODEMATCH_SMOKE_BASE_URL ?? 'http://127.0.0.1:5173'
const endpoint = new URL('/api/v1/skills', baseUrl)
const totalRequests = 40
const concurrency = 4
const durations = []
const statusCounts = new Map()
let errors = 0
let next = 0

async function worker() {
  while (true) {
    const index = next++
    if (index >= totalRequests) return
    const start = performance.now()
    try {
      const response = await fetch(endpoint, { headers: { accept: 'application/json' } })
      const body = await response.json()
      if (!response.ok || !Array.isArray(body)) errors++
      statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1)
    } catch {
      errors++
    } finally {
      durations.push(performance.now() - start)
    }
  }
}

const startedAt = performance.now()
await Promise.all(Array.from({ length: concurrency }, () => worker()))
const elapsed = performance.now() - startedAt
durations.sort((a, b) => a - b)
const percentile = (p) => durations[Math.max(0, Math.ceil(p * durations.length) - 1)] ?? 0
const statuses = [...statusCounts].sort(([a], [b]) => a - b).map(([status, count]) => `${status}:${count}`).join(', ') || 'none'

console.log(`Endpoint: ${endpoint}`)
console.log(`Requests: ${totalRequests}; concurrency: ${concurrency}; duration: ${elapsed.toFixed(1)} ms`)
console.log(`Statuses: ${statuses}; errors: ${errors}`)
console.log(`Latency: p50=${percentile(0.50).toFixed(1)} ms; p95=${percentile(0.95).toFixed(1)} ms`)
if (errors > 0 || statusCounts.get(200) !== totalRequests) process.exitCode = 1

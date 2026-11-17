const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export async function checkApiHealth(): Promise<{ status: string }> {
  const healthUrl = new URL('/actuator/health', API_BASE_URL)
  const response = await fetch(healthUrl, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`API health returned ${response.status}`)
  const health = await response.json() as { status: string }
  if (health.status !== 'UP') throw new Error(`API health is ${health.status}`)
  return health
}

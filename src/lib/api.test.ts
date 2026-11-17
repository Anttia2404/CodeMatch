import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkApiHealth } from './api'

describe('API health client', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('checks the Spring health endpoint and returns its status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'UP' }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(checkApiHealth()).resolves.toEqual({ status: 'UP' })
    expect(fetchMock).toHaveBeenCalledWith(new URL('http://localhost:8080/actuator/health'), {
      headers: { Accept: 'application/json' },
    })
  })

  it('treats an unhealthy backend as unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'DOWN' }) }))
    await expect(checkApiHealth()).rejects.toThrow('API health is DOWN')
  })
})

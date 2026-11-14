import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

const getSession = vi.fn()
vi.mock('#/lib/auth-client', () => ({ authClient: { getSession: () => getSession() } }))

const { clearCachedSession, getCachedSession } = await import('./session-cache')

describe('getCachedSession', () => {
  beforeEach(() => getSession.mockReset())

  it('asks the server once and reuses a signed-in session', async () => {
    getSession.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const qc = new QueryClient()
    expect((await getCachedSession(qc))?.user.id).toBe('u1')
    expect((await getCachedSession(qc))?.user.id).toBe('u1')
    expect(getSession).toHaveBeenCalledTimes(1)
  })

  it('does not cache a signed-out answer', async () => {
    getSession.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: { user: { id: 'u2' } } })
    const qc = new QueryClient()
    expect(await getCachedSession(qc)).toBeNull()
    expect((await getCachedSession(qc))?.user.id).toBe('u2')
    expect(getSession).toHaveBeenCalledTimes(2)
  })

  it('asks again after the cache is cleared (sign out)', async () => {
    getSession.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const qc = new QueryClient()
    await getCachedSession(qc)
    clearCachedSession(qc)
    await getCachedSession(qc)
    expect(getSession).toHaveBeenCalledTimes(2)
  })
})

import type { QueryClient } from '@tanstack/react-query'
import { authClient } from '#/lib/auth-client'

const SESSION_KEY = ['auth', 'session'] as const
/** How long a signed-in answer is trusted for route guards. The server still checks every request. */
const SESSION_STALE_MS = 5 * 60 * 1000

type CachedSession = { user: { id: string } } | null

/**
 * Session lookup for client-side route guards. The first call asks the auth
 * server; later navigations (and hover preloads) reuse the answer instead of
 * a network round trip per click. Signed-out answers are never cached, so a
 * fresh sign-in is picked up immediately.
 */
export async function getCachedSession(queryClient: QueryClient): Promise<CachedSession> {
  const session = await queryClient.fetchQuery({
    queryKey: SESSION_KEY,
    queryFn: async (): Promise<CachedSession> => {
      const result = await authClient.getSession()
      return result.data?.user ? (result.data as CachedSession) : null
    },
    staleTime: SESSION_STALE_MS,
  })
  if (!session?.user) queryClient.removeQueries({ queryKey: SESSION_KEY })
  return session
}

export function clearCachedSession(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: SESSION_KEY })
}

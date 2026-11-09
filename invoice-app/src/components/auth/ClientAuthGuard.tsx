import { useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { buildSignedOutRedirect } from '#/lib/auth-guard'
import { marketingSearchSchema } from '#/lib/marketing/lang'
import { Spinner } from '#/components/ui/spinner'

/**
 * Client-side session check for private layouts. Route `beforeLoad` guards
 * skip during SSR (no cookies reach better-auth's client there), so a hard
 * load would otherwise render the private shell. Until the session is known
 * this renders a loader (same markup on server and client, so hydration is
 * stable); signed-out visitors are then redirected home.
 */
export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const search = useRouterState({ select: (state) => state.location.search })
  const signedOut = !isPending && !data?.user

  useEffect(() => {
    if (signedOut) {
      void navigate({
        ...buildSignedOutRedirect(marketingSearchSchema.parse(search)),
        replace: true,
      })
    }
  }, [signedOut, navigate, search])

  if (isPending || signedOut) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }
  return <>{children}</>
}

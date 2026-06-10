import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img src={session.user.image} alt="" className="size-8 rounded-full" />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <span className="text-xs font-medium text-muted-foreground">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void authClient.signOut()
          }}
        >
          Sign out
        </Button>
      </div>
    )
  }

  return null
}

import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { buildSignedOutRedirect } from '#/lib/auth-guard'
import { getCachedSession } from '#/lib/session-cache'
import { ClientAuthGuard } from '#/components/auth/ClientAuthGuard'
import { WorkspaceLayout } from '#/components/workspace/WorkspaceShell'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace')({
  validateSearch: marketingSearchSchema,
  beforeLoad: async ({ search, context }) => {
    if (typeof window === 'undefined') return

    // Cached: one auth round trip per session, not one per click or hover.
    const session = await getCachedSession(context.queryClient)
    if (!session?.user) {
      throw redirect(buildSignedOutRedirect(search))
    }
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'مكتب المال — قافتر' : 'Qaftr money desk',
      description:
        lang === 'ar'
          ? 'متابعة الفواتير والعملاء والتحصيل من لوحة واحدة داخل قافتر.'
          : 'Track invoices, clients, and collections from one Qaftr workspace.',
      path: '/workspace',
      lang,
    })
  },
  component: WorkspaceLayoutRoute,
})

function WorkspaceLayoutRoute() {
  const search = Route.useSearch()
  return (
    <WorkspaceLayout lang={resolveLang(search)}>
      <ClientAuthGuard>
        <Outlet />
      </ClientAuthGuard>
    </WorkspaceLayout>
  )
}

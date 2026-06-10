import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace')({
  validateSearch: marketingSearchSchema,
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data?.user) {
      throw redirect({ to: '/', hash: 'invoice-tool' })
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
  component: () => <Outlet />,
})

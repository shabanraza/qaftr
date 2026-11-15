import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { AccountantPacketView } from '#/components/workspace/AccountantPacketView'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/accountant')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    if (typeof window === 'undefined') return

    void context.queryClient.prefetchQuery(context.trpc.invoices.list.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'ملف المحاسب — قافتر' : 'Accountant Packet — Qaftr',
      description:
        lang === 'ar'
          ? 'تصدير ملخصات الضريبة والدخل الشهرية للمحاسب.'
          : 'Export monthly VAT and income summaries for your accountant.',
      path: '/workspace/accountant',
      lang,
    })
  },
  component: WorkspaceAccountantPage,
})

function WorkspaceAccountantPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const isArabic = lang === 'ar'
  const trpc = useTRPC()

  const { data: invoices = [], isLoading } = useQuery(trpc.invoices.list.queryOptions())

  return (
    <WorkspaceShell
      lang={lang}
      active="accountant"
      title={isArabic ? 'ملف المحاسب' : 'Accountant Packet'}
      subtitle={
        isArabic
          ? 'تصدير الكشوفات الضريبية والدخل ومشاركتها مع المحاسب المالي.'
          : 'Export tax summaries, VAT collected, and sales statements for your accountant.'
      }
    >
      <AccountantPacketView lang={lang} invoices={invoices} isLoading={isLoading} />
    </WorkspaceShell>
  )
}

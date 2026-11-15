import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { FirmClientsList } from '#/components/workspace/FirmClientsList'
import { getSeatCopy } from '#/lib/accountant/copy'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/firm/')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: `${getSeatCopy(lang).firm.title} — ${lang === 'ar' ? 'قافتر' : 'Qaftr'}`,
      description: getSeatCopy(lang).firm.subtitle,
      path: '/workspace/firm',
      lang,
    })
  },
  component: FirmPage,
})

function FirmPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const c = getSeatCopy(lang).firm
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: clients = [], isLoading } = useQuery(trpc.seat.clients.queryOptions())
  const leave = useMutation({
    ...trpc.seat.leave.mutationOptions(),
    onSuccess: () => void queryClient.invalidateQueries(trpc.seat.clients.queryFilter()),
  })

  return (
    <WorkspaceShell lang={lang} active="firm" title={c.title} subtitle={c.subtitle}>
      <FirmClientsList lang={lang} isLoading={isLoading} clients={clients} onLeave={(id) => leave.mutate({ id })} />
    </WorkspaceShell>
  )
}

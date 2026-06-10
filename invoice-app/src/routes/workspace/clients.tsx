import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { Badge } from '#/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '#/components/ui/empty'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/workspace/clients')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.clients.list.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'العملاء — قافتر' : 'Clients — Qaftr',
      description:
        lang === 'ar'
          ? 'إدارة عملاء قافتر المحفوظين.'
          : 'Manage saved Qaftr clients.',
      path: '/workspace/clients',
      lang,
    })
  },
  component: WorkspaceClientsPage,
})

function WorkspaceClientsPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const { data: clients, isLoading } = useQuery(trpc.clients.list.queryOptions())

  const copy =
    lang === 'ar'
      ? {
          title: 'العملاء',
          subtitle: 'Mini CRM بسيط لحفظ بيانات العملاء وإعادة استخدامها في الفواتير.',
          name: 'الاسم',
          vat: 'الرقم الضريبي',
          email: 'البريد',
          phone: 'الجوال',
          status: 'الحالة',
          saved: 'محفوظ',
          empty: 'لا يوجد عملاء محفوظون بعد.',
          emptyHint: 'أضف أول عميل لإعادة استخدام بياناته عند إنشاء الفواتير.',
        }
      : {
          title: 'Clients',
          subtitle: 'Simple mini CRM for saved client details and invoice reuse.',
          name: 'Name',
          vat: 'VAT number',
          email: 'Email',
          phone: 'Phone',
          status: 'Status',
          saved: 'Saved',
          empty: 'No saved clients yet.',
          emptyHint: 'Add your first client to reuse their details when creating invoices.',
        }

  return (
    <WorkspaceShell
      lang={lang}
      active="clients"
      title={copy.title}
      subtitle={copy.subtitle}
    >
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="mt-2 h-12 w-full rounded-md" />
          <Skeleton className="mt-2 h-12 w-full rounded-md" />
        </div>
      ) : !clients?.length ? (
        <Empty className="m-5 border-border bg-background/50">
          <EmptyHeader>
            <EmptyTitle>{copy.empty}</EmptyTitle>
            <EmptyDescription>{copy.emptyHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-background/50 text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-start">{copy.name}</th>
                <th className="px-5 py-3 text-start">{copy.vat}</th>
                <th className="px-5 py-3 text-start">{copy.email}</th>
                <th className="px-5 py-3 text-start">{copy.phone}</th>
                <th className="px-5 py-3 text-start">{copy.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-background/50">
                  <td className="px-5 py-4 font-medium text-foreground">{client.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{client.vatNumber || '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{client.email || '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{client.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary">{copy.saved}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WorkspaceShell>
  )
}

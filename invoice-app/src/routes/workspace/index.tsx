import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { MoneyDeskDashboard } from '#/components/workspace/MoneyDeskDashboard'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/workspace/')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.invoices.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.clients.list.queryOptions()),
    ])
  },
  component: WorkspacePageIndex,
})

function WorkspacePageIndex() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()

  const invoicesQuery = useQuery(trpc.invoices.list.queryOptions())
  const clientsQuery = useQuery(trpc.clients.list.queryOptions())

  const isLoading = invoicesQuery.isLoading || clientsQuery.isLoading
  const invoices = invoicesQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const clientsById = new Map(clients.map((client) => [client.id, client]))

  const copy =
    lang === 'ar'
      ? {
          emptyTitle: 'ابدأ بأول فاتورة محفوظة',
          emptyBody:
            'بمجرد حفظ أول فاتورة ستظهر هنا لوحة المتابعة، والتحصيل، والعملاء المحفوظين.',
          emptyCta: 'أنشئ فاتورة الآن',
        }
      : {
          emptyTitle: 'Start with your first saved invoice',
          emptyBody:
            'Once you save your first invoice, this workspace will show collections, follow-ups, and saved clients.',
          emptyCta: 'Create an invoice',
        }

  return (
    <>
      {isLoading ? (
        <WorkspaceShell lang={lang} active="overview" title={lang === 'ar' ? 'نظرة عامة' : 'Overview'}>
          <div className="space-y-0">
            <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-28 w-full rounded-none" />
              <Skeleton className="h-28 w-full rounded-none" />
              <Skeleton className="h-28 w-full rounded-none" />
              <Skeleton className="h-28 w-full rounded-none" />
            </div>
            <div className="block">
              <Skeleton className="h-96 w-full rounded-none" />
            </div>
          </div>
        </WorkspaceShell>
      ) : invoices.length ? (
        <MoneyDeskDashboard
          lang={lang}
          invoices={invoices.map((invoice) => ({
            id: invoice.id,
            seqNumber: invoice.seqNumber,
            status: invoice.status,
            issueDate: new Date(invoice.issueDate),
            dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
            total: invoice.total,
            clientName: invoice.clientId ? clientsById.get(invoice.clientId)?.name ?? null : null,
          }))}
          clientCount={clients.length}
        />
      ) : (
        <WorkspaceShell lang={lang} active="overview" title={lang === 'ar' ? 'نظرة عامة' : 'Overview'}>
          <Empty className="mx-auto my-10 max-w-3xl border-border bg-card/80">
            <EmptyHeader>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyBody}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link to="/" hash="invoice-tool">
                  {copy.emptyCta}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </WorkspaceShell>
      )}
    </>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { formatMoney } from '#/lib/instant-invoice/copy'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '#/components/ui/empty'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/utils'
import { invoiceStatusTone, renderInvoiceStatus } from '#/lib/workspace/invoice-status'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/invoices/')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.invoices.list.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'الفواتير — قافتر' : 'Invoices — Qaftr',
      description:
        lang === 'ar'
          ? 'إدارة الفواتير المحفوظة داخل مكتب قافتر.'
          : 'Manage saved invoices inside the Qaftr workspace.',
      path: '/workspace/invoices',
      lang,
    })
  },
  component: WorkspaceInvoicesPage,
})


function WorkspaceInvoicesPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  const { data: invoices, isLoading } = useQuery(trpc.invoices.list.queryOptions())
  const deleteMutation = useMutation({
    ...trpc.invoices.delete.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.invoices.list.queryFilter())
    },
  })

  const copy =
    lang === 'ar'
      ? {
          title: 'الفواتير',
          subtitle: 'قائمة تشغيلية للفواتير المحفوظة.',
          new: 'فاتورة جديدة',
          invoice: 'الفاتورة',
          date: 'التاريخ',
          amount: 'المبلغ',
          status: 'الحالة',
          actions: 'إجراءات',
          empty: 'لا توجد فواتير محفوظة بعد.',
          emptyHint: 'أنشئ أول فاتورة واحفظها لتتابع الدفع والعملاء.',
          emptyCta: 'أنشئ فاتورة',
          delete: 'حذف',
          view: 'عرض',
        }
      : {
          title: 'Invoices',
          subtitle: 'Operational list of saved invoices.',
          new: 'New invoice',
          invoice: 'Invoice',
          date: 'Date',
          amount: 'Amount',
          status: 'Status',
          actions: 'Actions',
          empty: 'No saved invoices yet.',
          emptyHint: 'Create your first invoice and save it to track payments and clients.',
          emptyCta: 'Create invoice',
          delete: 'Delete',
          view: 'View',
        }

  return (
    <WorkspaceShell
      lang={lang}
      active="invoices"
      title={copy.title}
      subtitle={copy.subtitle}
      actions={
        <Button asChild size="sm" className="qaftr-btn-primary">
          <Link to="/workspace/new-invoice" search={search}>
            {copy.new}
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="mt-2 h-12 w-full rounded-md" />
          <Skeleton className="mt-2 h-12 w-full rounded-md" />
        </div>
      ) : !invoices?.length ? (
        <Empty className="m-5 border-border bg-background/50">
          <EmptyHeader>
            <EmptyTitle>{copy.empty}</EmptyTitle>
            <EmptyDescription>{copy.emptyHint}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link to="/workspace/new-invoice" search={search}>
                {copy.emptyCta}
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border bg-background/50 text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-start">{copy.invoice}</th>
                <th className="px-5 py-3 text-start">{copy.date}</th>
                <th className="px-5 py-3 text-start">{copy.amount}</th>
                <th className="px-5 py-3 text-start">{copy.status}</th>
                <th className="px-5 py-3 text-start">{copy.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-background/50">
                  <td className="px-5 py-4">
                    <Link
                      to="/workspace/invoices/$id"
                      params={{ id: invoice.id }}
                      search={search}
                      className="font-medium !text-primary hover:underline"
                    >
                      INV-{String(invoice.seqNumber).padStart(3, '0')}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA')}
                  </td>
                  <td className="px-5 py-4 font-medium tabular-nums text-foreground">
                    {formatMoney(invoice.total, lang)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      className={cn('border', invoiceStatusTone[invoice.status as keyof typeof invoiceStatusTone])}
                      variant="outline"
                    >
                      {renderInvoiceStatus(invoice.status, lang)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="xs">
                        <Link
                          to="/workspace/invoices/$id"
                          params={{ id: invoice.id }}
                          search={search}
                        >
                          {copy.view}
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: invoice.id })}
                      >
                        {copy.delete}
                      </Button>
                    </div>
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

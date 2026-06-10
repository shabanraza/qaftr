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
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const quoteStatusTone = {
  draft: "bg-muted/80 text-muted-foreground border-muted-foreground/20",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  converted: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
}

export function renderQuoteStatus(status: string, lang: 'ar' | 'en') {
  if (lang === 'ar') {
    switch (status) {
      case 'draft': return 'مسودة'
      case 'pending': return 'معلق'
      case 'accepted': return 'مقبول'
      case 'rejected': return 'مرفوض'
      case 'converted': return 'متحول لفاتورة'
      default: return status
    }
  } else {
    switch (status) {
      case 'draft': return 'Draft'
      case 'pending': return 'Pending'
      case 'accepted': return 'Accepted'
      case 'rejected': return 'Rejected'
      case 'converted': return 'Converted'
      default: return status
    }
  }
}

export const Route = createFileRoute('/workspace/quotes/')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.quotes.list.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'عروض الأسعار — قافتر' : 'Quotes — Qaftr',
      description:
        lang === 'ar'
          ? 'إدارة العروض السعرية المحفوظة داخل مكتب قافتر.'
          : 'Manage saved quotes inside the Qaftr workspace.',
      path: '/workspace/quotes',
      lang,
    })
  },
  component: WorkspaceQuotesPage,
})

function WorkspaceQuotesPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  const { data: quotes, isLoading } = useQuery(trpc.quotes.list.queryOptions())
  const deleteMutation = useMutation({
    ...trpc.quotes.delete.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.quotes.list.queryFilter())
    },
  })

  const copy =
    lang === 'ar'
      ? {
          title: 'عروض الأسعار',
          subtitle: 'قائمة تشغيلية للعروض السعرية المحفوظة.',
          new: 'عرض سعر جديد',
          quote: 'عرض السعر',
          date: 'التاريخ',
          amount: 'المبلغ',
          status: 'الحالة',
          actions: 'إجراءات',
          empty: 'لا توجد عروض أسعار محفوظة بعد.',
          emptyHint: 'أنشئ أول عرض سعر واحفظه وقم بتحويله لاحقاً إلى فاتورة بضغطة زر.',
          emptyCta: 'أنشئ عرض سعر',
          delete: 'حذف',
          view: 'عرض',
        }
      : {
          title: 'Quotes',
          subtitle: 'Operational list of saved quotes.',
          new: 'New quote',
          quote: 'Quote',
          date: 'Date',
          amount: 'Amount',
          status: 'Status',
          actions: 'Actions',
          empty: 'No saved quotes yet.',
          emptyHint: 'Create your first quote, send it to a client, and convert it to an invoice later with one click.',
          emptyCta: 'Create quote',
          delete: 'Delete',
          view: 'View',
        }

  return (
    <WorkspaceShell
      lang={lang}
      active="quotes"
      title={copy.title}
      subtitle={copy.subtitle}
      actions={
        <Button asChild size="sm" className="qaftr-btn-primary">
          <Link to="/workspace/quotes/new" search={search}>
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
      ) : !quotes?.length ? (
        <Empty className="m-5 border-border bg-background/50">
          <EmptyHeader>
            <EmptyTitle>{copy.empty}</EmptyTitle>
            <EmptyDescription>{copy.emptyHint}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link to="/workspace/quotes/new" search={search}>
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
                <th className="px-5 py-3 text-start">{copy.quote}</th>
                <th className="px-5 py-3 text-start">{copy.date}</th>
                <th className="px-5 py-3 text-start">{copy.amount}</th>
                <th className="px-5 py-3 text-start">{copy.status}</th>
                <th className="px-5 py-3 text-start">{copy.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-background/50">
                  <td className="px-5 py-4">
                    <Link
                      to="/workspace/quotes/$id"
                      params={{ id: quote.id }}
                      search={search}
                      className="font-medium !text-primary hover:underline"
                    >
                      QTE-{String(quote.seqNumber).padStart(3, '0')}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(quote.issueDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-SA')}
                  </td>
                  <td className="px-5 py-4 font-medium tabular-nums text-foreground">
                    {formatMoney(quote.total, lang)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      className={cn('border', quoteStatusTone[quote.status as keyof typeof quoteStatusTone])}
                      variant="outline"
                    >
                      {renderQuoteStatus(quote.status, lang)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Button asChild variant="ghost" size="xs">
                        <Link
                          to="/workspace/quotes/$id"
                          params={{ id: quote.id }}
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
                        onClick={() => deleteMutation.mutate({ id: quote.id })}
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

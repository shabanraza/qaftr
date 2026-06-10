import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '#/lib/auth-client'
import { useTRPC } from '#/integrations/trpc/react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { formatMoney } from '#/lib/instant-invoice/copy'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/invoices/')({
  validateSearch: marketingSearchSchema,
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data?.user) {
      throw redirect({ to: '/', hash: 'invoice-tool' })
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.trpc.invoices.list.queryOptions())
  },
  head: () =>
    buildMarketingHead({
      title: 'فواتيري — قافتر',
      description: 'إدارة فواتيرك المحفوظة — QR زاتكا · PDF · فوترة إلكترونية.',
      path: '/invoices',
      lang: 'ar',
    }),
  component: InvoicesPage,
})

function InvoicesPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

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
          title: 'فواتيري',
          subtitle: 'فواتيرك المحفوظة في حساب قافتر',
          new: '+ فاتورة جديدة',
          loading: 'جاري التحميل…',
          empty: 'لا توجد فواتير محفوظة بعد.',
          emptyCta: 'أنشئ فاتورتك الأولى',
          paid: 'مدفوعة',
          unpaid: 'غير مدفوعة',
          delete: 'حذف',
        }
      : {
          title: 'My invoices',
          subtitle: 'Invoices saved to your Qaftr account',
          new: '+ New invoice',
          loading: 'Loading…',
          empty: 'No saved invoices yet.',
          emptyCta: 'Create your first invoice',
          paid: 'Paid',
          unpaid: 'Unpaid',
          delete: 'Delete',
        }

  return (
    <MarketingLayout lang={lang}>
      <div dir={dir} lang={lang} className="mx-auto max-w-4xl px-5 py-12 md:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-foreground">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
          <Button asChild>
            <Link to="/" hash="invoice-tool" className="no-underline">
              {copy.new}
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : !invoices?.length ? (
          <Empty className="border-border bg-card">
            <EmptyHeader>
              <EmptyTitle>{copy.empty}</EmptyTitle>
              <EmptyDescription>{copy.empty}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline">
                <Link to="/" hash="invoice-tool" className="no-underline">
                  {copy.emptyCta}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Card className="py-4 shadow-none">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4">
                    <div>
                      <Link
                        to="/invoices/$id"
                        params={{ id: invoice.id }}
                        search={lang === 'en' ? { lang: 'en' } : {}}
                        className="font-bold text-primary no-underline hover:underline"
                      >
                        INV-{String(invoice.seqNumber).padStart(3, '0')}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {new Date(invoice.issueDate).toLocaleDateString(
                          lang === 'ar' ? 'ar-SA' : 'en-SA',
                        )}{' '}
                        · {formatMoney(invoice.total, lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                        {invoice.status === 'paid' ? copy.paid : copy.unpaid}
                      </Badge>
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
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MarketingLayout>
  )
}

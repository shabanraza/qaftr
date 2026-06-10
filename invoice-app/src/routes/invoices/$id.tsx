import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '#/lib/auth-client'
import { useTRPC } from '#/integrations/trpc/react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { formatMoney, getInstantInvoiceCopy } from '#/lib/instant-invoice/copy'
import { downloadInvoicePdf } from '#/lib/instant-invoice/invoice-pdf'
import type { InvoiceForPdf } from '#/lib/instant-invoice/invoice-pdf'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Alert, AlertDescription } from '#/components/ui/alert'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import { Skeleton } from '#/components/ui/skeleton'

export const Route = createFileRoute('/invoices/$id')({
  validateSearch: marketingSearchSchema,
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data?.user) {
      throw redirect({ to: '/', hash: 'invoice-tool' })
    }
  },
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(context.trpc.invoices.get.queryOptions({ id: params.id }))
  },
  head: () =>
    buildMarketingHead({
      title: 'تفاصيل الفاتورة — قافتر',
      description: 'عرض وتحميل فاتورتك المحفوظة.',
      path: '/invoices',
      lang: 'ar',
    }),
  component: InvoiceDetailPage,
})

function InvoiceDetailPage() {
  const { id } = Route.useParams()
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const dir = langDir(lang)
  const toolCopy = getInstantInvoiceCopy(lang)
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const { data: invoice, isLoading } = useQuery(trpc.invoices.get.queryOptions({ id }))

  const statusMutation = useMutation({
    ...trpc.invoices.updateStatus.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.invoices.get.queryFilter({ id }))
      void queryClient.invalidateQueries(trpc.invoices.list.queryFilter())
    },
  })

  const copy =
    lang === 'ar'
      ? {
          back: '← فواتيري',
          loading: 'جاري التحميل…',
          taxInvoice: 'فاتورة ضريبية',
          markPaid: 'تعليم كمدفوعة',
        }
      : {
          back: '← My invoices',
          loading: 'Loading…',
          taxInvoice: 'Tax invoice',
          markPaid: 'Mark as paid',
        }

  async function handleDownload() {
    if (!invoice) return
    setDownloadError(null)
    setDownloading(true)
    const pdfData: InvoiceForPdf = {
      seqNumber: invoice.seqNumber,
      issueDate: invoice.issueDate,
      subtotal: invoice.subtotal,
      vatAmount: invoice.vatAmount,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes,
      business: invoice.business,
      client: invoice.client,
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    }
    try {
      await downloadInvoicePdf(pdfData, lang)
    } catch (err) {
      const code = err instanceof Error ? err.message : 'PDF_EXPORT_FAILED'
      setDownloadError(
        toolCopy.errors[code as keyof typeof toolCopy.errors] ?? toolCopy.errors.PDF_EXPORT_FAILED,
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <MarketingLayout lang={lang}>
      <div dir={dir} lang={lang} className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <Button variant="link" className="h-auto p-0" asChild>
          <Link
            to="/invoices"
            search={lang === 'en' ? { lang: 'en' } : {}}
            className="no-underline"
          >
            {copy.back}
          </Link>
        </Button>

        {isLoading || !invoice ? (
          <div className="mt-8 flex flex-col gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {downloadError ? (
              <Alert variant="destructive" className="mt-6">
                <AlertDescription>{downloadError}</AlertDescription>
              </Alert>
            ) : null}
          <Card className="mt-6 gap-4 py-6">
            <CardHeader className="px-6 pb-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{copy.taxInvoice}</p>
                  <CardTitle className="mt-1 text-2xl text-primary">
                    INV-{String(invoice.seqNumber).padStart(3, '0')}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {invoice.business?.nameAr} → {invoice.client?.name ?? '—'}
                  </p>
                </div>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {formatMoney(invoice.total, lang)}
                </p>
              </div>
            </CardHeader>

            <CardContent className="px-6">
              <Separator className="mb-4" />
              <ul className="flex flex-col gap-2">
                {invoice.lineItems.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm text-muted-foreground">
                    <span>{item.description}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {formatMoney(item.lineTotal, lang, '')}
                    </span>
                  </li>
                ))}
              </ul>
              {invoice.status === 'paid' ? (
                <Badge className="mt-4">{lang === 'ar' ? 'مدفوعة' : 'Paid'}</Badge>
              ) : null}
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2 px-6">
              <Button type="button" disabled={downloading} onClick={() => void handleDownload()}>
                {downloading ? copy.loading : toolCopy.downloadPdf}
              </Button>
              {invoice.status !== 'paid' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => statusMutation.mutate({ id: invoice.id, status: 'paid' })}
                >
                  {copy.markPaid}
                </Button>
              ) : null}
            </CardFooter>
          </Card>
          </>
        )}
      </div>
    </MarketingLayout>
  )
}

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceInvoiceEditor } from '#/components/workspace/WorkspaceInvoiceEditor'
import type { CreateInvoiceInput } from '#/components/workspace/WorkspaceInvoiceEditor'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { Skeleton } from '#/components/ui/skeleton'
import { nextDocumentSeq } from '#/lib/workspace/invoice-editor'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/new-invoice')({
  // client: preselect a customer, e.g. coming back from adding or editing them.
  validateSearch: marketingSearchSchema.extend({ client: z.string().optional() }),
  loader: ({ context }) => {
    if (typeof window === 'undefined') return
    void Promise.all([
      context.queryClient.prefetchQuery(context.trpc.business.get.queryOptions()),
      context.queryClient.prefetchQuery(context.trpc.clients.list.queryOptions()),
      context.queryClient.prefetchQuery(context.trpc.invoices.list.queryOptions()),
      context.queryClient.prefetchQuery(context.trpc.zatca.status.queryOptions()),
    ])
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'فاتورة جديدة — قافتر' : 'New invoice — Qaftr',
      description:
        lang === 'ar'
          ? 'أنشئ فاتورة جديدة داخل مكتب قافتر.'
          : 'Create a new invoice inside the Qaftr workspace.',
      path: '/workspace/new-invoice',
      lang,
    })
  },
  component: WorkspaceNewInvoicePage,
})

function WorkspaceNewInvoicePage() {
  const { lang: searchLang, client: initialClientId } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const businessQuery = useQuery(trpc.business.get.queryOptions())
  const clientsQuery = useQuery(trpc.clients.list.queryOptions())
  const invoicesQuery = useQuery(trpc.invoices.list.queryOptions())
  const { data: zatcaStatus } = useQuery(trpc.zatca.status.queryOptions())
  const createMutation = useMutation(trpc.invoices.create.mutationOptions())
  const issueMutation = useMutation(trpc.zatca.issueInvoice.mutationOptions())

  const loading = businessQuery.isLoading || clientsQuery.isLoading
  const nextSeq = nextDocumentSeq(invoicesQuery.data ?? [])

  async function handleSave(input: CreateInvoiceInput, opts: { sendToZatca: boolean }) {
    const created = await createMutation.mutateAsync(input)
    if (opts.sendToZatca) {
      // The invoice is saved either way; a ZATCA failure shows on the invoice page with a retry.
      await issueMutation.mutateAsync({ invoiceId: created.id }).catch(() => undefined)
    }
    void queryClient.invalidateQueries(trpc.invoices.list.queryFilter())
    await navigate({
      to: '/workspace/invoices/$id',
      params: { id: created.id },
      search: lang === 'en' ? { lang: 'en' } : {},
    })
  }

  return (
    <WorkspaceShell lang={lang} title={lang === 'ar' ? 'فاتورة جديدة' : 'New invoice'}>
      {loading ? (
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="aspect-[1/1.414] w-full" />
        </div>
      ) : (
        <WorkspaceInvoiceEditor
          lang={lang}
          business={businessQuery.data ?? null}
          clients={clientsQuery.data ?? []}
          nextSeq={nextSeq}
          zatcaConnected={Boolean(zatcaStatus?.unit && !zatcaStatus.gate)}
          onSave={handleSave}
          initialClientId={initialClientId}
        />
      )}
    </WorkspaceShell>
  )
}

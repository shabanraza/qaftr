import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { AccountantPacketView } from '#/components/workspace/AccountantPacketView'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { getSeatCopy } from '#/lib/accountant/copy'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/firm/$businessId')({
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
  component: FirmClientPage,
})

function FirmClientPage() {
  const { businessId } = Route.useParams()
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const c = getSeatCopy(lang).firm
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const trpc = useTRPC()
  const profile = useQuery(trpc.seat.clientProfile.queryOptions({ businessId }))
  const invoices = useQuery(trpc.seat.clientInvoices.queryOptions({ businessId }))

  const name = profile.data ? (lang === 'ar' ? profile.data.nameAr : profile.data.nameEn || profile.data.nameAr) : ''
  const denied = profile.isError || invoices.isError

  return (
    <WorkspaceShell
      lang={lang}
      active="firm"
      title={name || c.title}
      subtitle={name ? c.detailSubtitle(name) : undefined}
      actions={
        <>
          <Badge variant="outline">{c.readOnly}</Badge>
          <Button asChild size="sm" variant="outline">
            <Link to="/workspace/firm" search={search} className="no-underline">
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
              {c.back}
            </Link>
          </Button>
        </>
      }
    >
      {denied ? (
        <p role="alert" className="p-5 text-sm text-muted-foreground">
          {c.noAccess}
        </p>
      ) : profile.isLoading ? (
        <Skeleton className="m-5 h-40 w-full max-w-4xl" />
      ) : (
        <AccountantPacketView
          lang={lang}
          invoices={invoices.data ?? []}
          isLoading={invoices.isLoading}
          filePrefix={`Qaftr_${(profile.data?.nameEn || profile.data?.vatNumber || 'client').replace(/[^A-Za-z0-9]+/g, '_')}`}
        />
      )}
    </WorkspaceShell>
  )
}

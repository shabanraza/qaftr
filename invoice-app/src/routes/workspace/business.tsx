import { Link, createFileRoute } from '@tanstack/react-router'
import { CreditCard } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { BusinessProfileForm } from '#/components/workspace/BusinessProfileForm'
import { ZatcaOnboardingCard } from '#/components/workspace/ZatcaOnboardingCard'
import { AccountantAccessCard } from '#/components/workspace/AccountantAccessCard'
import { getBillingCopy } from '#/lib/billing/copy'
import { Skeleton } from '#/components/ui/skeleton'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

export const Route = createFileRoute('/workspace/business')({
  validateSearch: marketingSearchSchema,
  loader: async ({ context }) => {
    if (typeof window === 'undefined') return
    void context.queryClient.prefetchQuery(context.trpc.business.get.queryOptions())
  },
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    return buildMarketingHead({
      title: lang === 'ar' ? 'ملف المنشأة — قافتر' : 'Business profile — Qaftr',
      description:
        lang === 'ar'
          ? 'بيانات منشأتك وعنوانها الوطني كما تتطلبها الفوترة الإلكترونية.'
          : 'Your business details and national address for e-invoicing.',
      path: '/workspace/business',
      lang,
    })
  },
  component: WorkspaceBusinessPage,
})

function WorkspaceBusinessPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: business, isLoading } = useQuery(trpc.business.get.queryOptions())
  const upsert = useMutation({
    ...trpc.business.upsert.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries(trpc.business.get.queryFilter())
      void queryClient.invalidateQueries(trpc.zatca.status.queryFilter())
    },
  })
  const { data: zatcaStatus } = useQuery(trpc.zatca.status.queryOptions())
  const { data: members = [] } = useQuery({ ...trpc.seat.members.queryOptions(), enabled: Boolean(business) })
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const invite = useMutation({
    ...trpc.seat.invite.mutationOptions(),
    onSuccess: ({ token }) => {
      const query = new URLSearchParams({ token, ...(lang === 'en' ? { lang: 'en' } : {}) })
      setInviteLink(`${window.location.origin}/accept-invite?${query.toString()}`)
      void queryClient.invalidateQueries(trpc.seat.members.queryFilter())
    },
  })
  const revoke = useMutation({
    ...trpc.seat.revoke.mutationOptions(),
    onSuccess: () => void queryClient.invalidateQueries(trpc.seat.members.queryFilter()),
  })
  const onboard = useMutation({
    ...trpc.zatca.onboard.mutationOptions(),
    onSuccess: () => void queryClient.invalidateQueries(trpc.zatca.status.queryFilter()),
  })

  return (
    <WorkspaceShell
      lang={lang}
      active="business"
      title={lang === 'ar' ? 'ملف المنشأة' : 'Business profile'}
      subtitle={
        lang === 'ar'
          ? 'بيانات منشأتك كما تظهر في الفواتير، وما تحتاجه المرحلة الثانية من الفوترة الإلكترونية.'
          : 'Your business details as they appear on invoices, and what ZATCA Phase 2 needs.'
      }
    >
      <div className="flex flex-col gap-0 px-5 py-6">
        {isLoading ? (
          <Skeleton className="h-96 w-full max-w-4xl rounded-xl" />
        ) : (
          <BusinessProfileForm
            key={business?.id ?? 'new'}
            lang={lang}
            initial={business ?? null}
            onSave={(values) =>
              upsert.mutateAsync({
                ...values,
                nameAr: values.nameAr ?? '',
                defaultLanguage: business?.defaultLanguage ?? lang,
              })
            }
          />
        )}
        {zatcaStatus ? (
          <div className="mt-8 max-w-4xl border-t border-border pt-6">
            <ZatcaOnboardingCard lang={lang} status={zatcaStatus} onOnboard={(values) => onboard.mutateAsync(values)} />
          </div>
        ) : null}
        <div className="mt-8 max-w-4xl border-t border-border pt-6">
          <Link
            to="/workspace/billing"
            search={lang === 'en' ? { lang: 'en' as const } : {}}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary no-underline hover:underline"
          >
            <CreditCard className="size-4" aria-hidden />
            {getBillingCopy(lang).settingsLink}
          </Link>
        </div>
        {business ? (
          <div className="mt-8 max-w-4xl border-t border-border pt-6">
            <AccountantAccessCard
              lang={lang}
              members={members}
              inviteLink={inviteLink}
              creating={invite.isPending}
              error={invite.error?.message ?? revoke.error?.message ?? null}
              onInvite={(email) => invite.mutate({ email })}
              onRevoke={(id) => revoke.mutate({ id })}
              onDismissLink={() => setInviteLink(null)}
            />
          </div>
        ) : null}
      </div>
    </WorkspaceShell>
  )
}

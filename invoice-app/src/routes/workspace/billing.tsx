import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useTRPC } from '#/integrations/trpc/react'
import { WorkspaceShell } from '#/components/workspace/WorkspaceShell'
import { BillingPlanCard } from '#/components/workspace/BillingPlanCard'
import { getBillingCopy } from '#/lib/billing/copy'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

const searchSchema = marketingSearchSchema.extend({
  checkout: z.enum(['success']).optional().catch(undefined),
})

export const Route = createFileRoute('/workspace/billing')({
  validateSearch: searchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const c = getBillingCopy(lang)
    return buildMarketingHead({ title: `${c.title} — ${lang === 'ar' ? 'قافتر' : 'Qaftr'}`, description: c.subtitle, path: '/workspace/billing', lang })
  },
  component: WorkspaceBillingPage,
})

/** How long to poll for the webhook after checkout. */
const WAIT_MS = 60_000

function WorkspaceBillingPage() {
  const { lang: searchLang, checkout } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const c = getBillingCopy(lang)
  const trpc = useTRPC()
  const justPaid = checkout === 'success'

  // Stop waiting for Polar's webhook after about a minute.
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    if (!justPaid) return
    const timer = setTimeout(() => setTimedOut(true), WAIT_MS)
    return () => clearTimeout(timer)
  }, [justPaid])

  const { data: usage, isLoading } = useQuery({
    ...trpc.billing.getUsage.queryOptions(),
    // After checkout, Pro turns on when Polar's webhook arrives: poll briefly.
    refetchInterval: (query) => {
      if (!justPaid || query.state.data?.plan === 'pro' || timedOut) return false
      return 2000
    },
  })

  const [pendingInterval, setPendingInterval] = useState<'monthly' | 'yearly' | null>(null)
  const checkoutMutation = useMutation({
    ...trpc.billing.checkout.mutationOptions(),
    onSuccess: ({ url }) => {
      window.location.assign(url)
    },
    onError: () => setPendingInterval(null),
  })
  const portal = useMutation({
    ...trpc.billing.portal.mutationOptions(),
    onSuccess: ({ url }) => {
      window.location.assign(url)
    },
  })

  const { reset: resetCheckout } = checkoutMutation
  const { reset: resetPortal } = portal
  // Coming back with the browser's Back button restores the page from cache: re-enable the buttons.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        resetCheckout()
        resetPortal()
        setPendingInterval(null)
      }
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [resetCheckout, resetPortal])

  const pending = portal.isPending ? 'portal' : checkoutMutation.isPending || checkoutMutation.isSuccess ? pendingInterval : null
  const stillProcessing = justPaid && usage?.plan !== 'pro' && timedOut

  return (
    <WorkspaceShell lang={lang} active="business" title={c.title} subtitle={c.subtitle}>
      <div className="p-5">
        <BillingPlanCard
          lang={lang}
          usage={usage}
          isLoading={isLoading}
          pending={pending}
          error={checkoutMutation.error?.message ?? portal.error?.message ?? null}
          justPaid={justPaid}
          stillProcessing={stillProcessing}
          onUpgrade={(interval) => {
            setPendingInterval(interval)
            checkoutMutation.mutate({ interval, lang })
          }}
          onManage={() => portal.mutate()}
        />
      </div>
    </WorkspaceShell>
  )
}

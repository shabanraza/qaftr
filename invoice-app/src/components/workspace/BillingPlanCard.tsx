import { useEffect } from 'react'
import { CheckCircle2, CreditCard, Loader2, Sparkles } from 'lucide-react'
import { track } from '#/lib/analytics/track'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import { getBillingCopy } from '#/lib/billing/copy'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { formatSaDate } from '#/lib/sa/format'

export type BillingUsage = {
  plan: 'free' | 'pro'
  used: number
  limit: number | null
  remaining: number | null
  webSubscription: boolean
  currentPeriodEnd: Date | string | null
  checkoutAvailable: boolean
}

type Props = {
  lang: MarketingLang
  usage: BillingUsage | undefined
  isLoading: boolean
  /** Which action is in flight, if any. */
  pending: 'monthly' | 'yearly' | 'portal' | null
  error: string | null
  /** Back from a successful checkout and Pro is not active yet. */
  justPaid: boolean
  /** Waited about a minute after checkout and Pro is still not active. */
  stillProcessing?: boolean
  onUpgrade: (interval: 'monthly' | 'yearly') => void
  onManage: () => void
}

export function BillingPlanCard({ lang, usage, isLoading, pending, error, justPaid, stillProcessing = false, onUpgrade: onUpgradeProp, onManage }: Props) {
  const c = getBillingCopy(lang)
  const seeingPaywall = Boolean(usage && usage.plan === 'free' && usage.checkoutAvailable)
  const activated = Boolean(usage && usage.plan === 'pro' && justPaid)
  useEffect(() => {
    if (seeingPaywall) track('paywall_view', { source: 'billing' })
  }, [seeingPaywall])
  useEffect(() => {
    if (activated) track('pro_activated', { interval: 'web' })
  }, [activated])
  const onUpgrade = (interval: 'monthly' | 'yearly') => {
    track('begin_checkout', { interval })
    onUpgradeProp(interval)
  }
  if (isLoading || !usage) {
    return <Skeleton className="h-64 w-full max-w-2xl" />
  }

  const isPro = usage.plan === 'pro'
  const busy = pending !== null
  const periodEnd = usage.currentPeriodEnd
    ? formatSaDate((typeof usage.currentPeriodEnd === 'string' ? usage.currentPeriodEnd : usage.currentPeriodEnd.toISOString()).slice(0, 10), lang)
    : null

  return (
    <div dir={langDir(lang)} lang={lang} className="flex max-w-2xl flex-col gap-4">
      {justPaid && !isPro ? (
        <Alert role="status">
          {stillProcessing ? null : <Loader2 className="size-4 animate-spin" aria-hidden />}
          <AlertDescription>{stillProcessing ? c.stillProcessing : c.activating}</AlertDescription>
        </Alert>
      ) : null}
      {justPaid && isPro ? (
        <Alert role="status">
          <CheckCircle2 className="size-4 text-primary" aria-hidden />
          <AlertDescription>{c.activated}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{c.errors[error] ?? c.genericError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg">{isPro ? c.proName : c.freeName}</CardTitle>
            {isPro ? (
              <Badge>
                <Sparkles className="size-3" aria-hidden /> {c.proName}
              </Badge>
            ) : null}
          </div>
          <CardDescription>{isPro ? c.proBody : c.freeBody}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {!isPro && usage.limit !== null ? (
            <div>
              <p className="font-semibold">{c.usage(usage.used, usage.limit)}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
              </div>
            </div>
          ) : null}

          {isPro && usage.webSubscription ? (
            <div className="flex flex-col gap-3">
              {periodEnd ? (
                <p>
                  {c.renews} <span className="font-semibold">{periodEnd}</span>
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={onManage} disabled={busy}>
                  {pending === 'portal' ? <Loader2 className="animate-spin" aria-hidden /> : <CreditCard aria-hidden />}
                  {c.manage}
                </Button>
                <span className="text-muted-foreground">{c.manageHint}</span>
              </div>
            </div>
          ) : null}

          {isPro && !usage.webSubscription ? <p className="text-muted-foreground">{c.storeManaged}</p> : null}
        </CardContent>
      </Card>

      {!isPro ? (
        <Card className="border-primary/40 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">{c.upgradeTitle}</CardTitle>
            <CardDescription>{c.proBody}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="button" size="lg" variant="outline" onClick={() => onUpgrade('monthly')} disabled={busy || !usage.checkoutAvailable}>
                    {pending === 'monthly' ? <Loader2 className="animate-spin" aria-hidden /> : null}
                    {c.monthly}
                  </Button>
                  <div className="flex flex-col gap-1">
                    <Button type="button" size="lg" onClick={() => onUpgrade('yearly')} disabled={busy || !usage.checkoutAvailable}>
                      {pending === 'yearly' ? <Loader2 className="animate-spin" aria-hidden /> : null}
                      {c.yearly}
                    </Button>
                    <span className="text-center text-xs font-semibold text-primary">{c.yearlyHint}</span>
                  </div>
                </div>
                {busy && pending !== 'portal' ? <p className="text-muted-foreground">{c.opening}</p> : null}
                {usage.checkoutAvailable ? (
                  <p className="text-xs leading-5 text-muted-foreground">{c.payNote}</p>
                ) : (
                  <p className="text-muted-foreground">{c.unavailable}</p>
                )}
              </>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

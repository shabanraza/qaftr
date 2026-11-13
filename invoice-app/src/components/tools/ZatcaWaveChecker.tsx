import { useEffect, useId, useRef, useState } from 'react'
import { track } from '#/lib/analytics/track'
import { Link } from '@tanstack/react-router'
import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  DownloadIcon,
  MessageCircleIcon,
} from 'lucide-react'
import { ZATCA_REVENUE_YEARS, getZatcaWaveStatus } from '@zatca/shared'
import type { ZatcaRevenueYear, ZatcaWaveStatus } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'
import { SUPPORT_EMAIL } from '#/lib/marketing/constants'
import { parseAmountInput } from '#/lib/ae/format'
import { formatSaDate, formatSaNumber, toArabicIndic, todayInSaudi } from '#/lib/sa/format'
import { getWaveCopy } from '#/lib/sa/wave-copy'
import { buildWaveReminder } from '#/lib/sa/wave-reminder'
import { downloadBlob } from '#/lib/invoice/pdf-render'
import { AuthGateDialog } from '#/components/instant-invoice/AuthGateDialog'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { FieldError } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

type Answer = 'yes' | 'no' | 'unsure'

type ZatcaWaveCheckerProps = {
  lang: MarketingLang
  /** Fixed "today" (YYYY-MM-DD) for tests; defaults to the Saudi calendar day at submit time. */
  today?: string
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}

function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  name: string
  legend: string
  options: ReadonlyArray<readonly [Answer, string]>
  value: Answer | null
  onChange: (value: Answer) => void
  error?: string
}) {
  const id = useId()
  return (
    <div
      role="radiogroup"
      aria-labelledby={`${id}-legend`}
      aria-describedby={error ? `${id}-error` : undefined}
      className="flex min-w-0 flex-col gap-3"
    >
      <p id={`${id}-legend`} className="text-sm font-medium text-foreground">
        {legend}
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
        {options.map(([optionValue, label]) => (
          <label key={optionValue} className="relative block min-w-0 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              className="peer sr-only"
            />
            <span className="block rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-medium transition-colors hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              {label}
            </span>
          </label>
        ))}
      </div>
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  )
}

export function ZatcaWaveChecker({ lang, today }: ZatcaWaveCheckerProps) {
  const copy = getWaveCopy(lang)
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const digits = (s: string) => (lang === 'ar' ? toArabicIndic(s) : s)
  const [vat, setVat] = useState<Answer | null>(null)
  const [notified, setNotified] = useState<Answer | null>(null)
  const [revenues, setRevenues] = useState<Record<ZatcaRevenueYear, string>>({
    2022: '',
    2023: '',
    2024: '',
    2025: '',
  })
  const [errors, setErrors] = useState<{ vat?: boolean; revenue?: boolean; years: ZatcaRevenueYear[] }>({
    years: [],
  })
  const [result, setResult] = useState<ZatcaWaveStatus | null>(null)
  const resultRef = useRef<HTMLElement>(null)
  const [scrollToken, setScrollToken] = useState(0)
  const [signupOpen, setSignupOpen] = useState(false)

  useEffect(() => {
    if (!scrollToken || !resultRef.current) return
    const small =
      typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 1023px)').matches
    if (!small) return
    const el = resultRef.current
    requestAnimationFrame(() => {
      if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el.focus({ preventScroll: true })
    })
  }, [scrollToken])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const registered = vat === 'yes'
    const parsed: Partial<Record<ZatcaRevenueYear, number>> = {}
    const badYears: ZatcaRevenueYear[] = []
    for (const year of ZATCA_REVENUE_YEARS) {
      const raw = revenues[year].trim()
      if (!raw) continue
      const n = parseAmountInput(raw)
      if (Number.isNaN(n) || n < 0) badYears.push(year)
      else parsed[year] = n
    }
    const nextErrors = {
      vat: vat === null,
      revenue: registered && Object.keys(parsed).length === 0 && badYears.length === 0,
      years: registered ? badYears : [],
    }
    setErrors(nextErrors)
    if (nextErrors.vat || nextErrors.revenue || nextErrors.years.length) {
      setResult(null)
      return
    }
    const status = getZatcaWaveStatus({
      // "not sure" is treated like registered only if revenue was entered
      vatRegistered: registered || (vat === 'unsure' && Object.keys(parsed).length > 0),
      revenues: parsed,
      notified: notified === null || notified === 'unsure' ? null : notified === 'yes',
      today: today ?? todayInSaudi(),
    })
    setResult(status)
    track('tool_used', { tool: 'zatca_wave_checker', result: status.status })
    setScrollToken((t) => t + 1)
  }

  // Deadline reminder: only for a future deadline from the wave data.
  const reminderInput =
    result?.status === 'due' && result.wave && result.deadline && result.daysRemaining
      ? { lang, wave: result.wave, deadline: result.deadline, daysRemaining: result.daysRemaining }
      : null
  const reminder = reminderInput ? buildWaveReminder({ ...reminderInput, now: new Date() }) : null
  const trackReminder = (cta: 'wave_reminder_ics' | 'wave_reminder_google' | 'wave_reminder_whatsapp') =>
    track('cta_click', { cta, cta_location: 'wave_checker_result' })

  function downloadIcs() {
    if (!reminderInput) return
    trackReminder('wave_reminder_ics')
    // rebuilt on click so DTSTAMP is the download time
    const { ics, filename } = buildWaveReminder({ ...reminderInput, now: new Date() })
    downloadBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), filename)
  }

  const subject = encodeURIComponent(copy.notifySubject)
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}`

  return (
    <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <Card className="min-w-0 border-border/80 py-0 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-5">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{copy.formTitle}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-6">
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-7">
              <RadioGroup
                name="wave-vat"
                legend={copy.vatQuestion}
                options={[
                  ['yes', copy.yes],
                  ['no', copy.no],
                  ['unsure', copy.notSure],
                ]}
                value={vat}
                onChange={setVat}
                error={errors.vat ? copy.errors.vat : undefined}
              />

              <fieldset className="flex min-w-0 flex-col gap-3" disabled={vat === 'no'}>
                <legend className="mb-1 text-sm font-medium text-foreground">{copy.revenueQuestion}</legend>
                <p className="-mt-1 text-xs text-muted-foreground">{copy.revenueHint}</p>
                <div className="grid grid-cols-2 gap-3">
                  {ZATCA_REVENUE_YEARS.map((year) => {
                    const id = `wave-revenue-${year}`
                    const bad = errors.years.includes(year)
                    return (
                      <div key={year} className="flex min-w-0 flex-col gap-1.5">
                        <label htmlFor={id} className="text-sm">
                          {copy.revenueLabel(digits(String(year)))}
                          <span className="sr-only"> ({digits(String(year))})</span>
                        </label>
                        <Input
                          id={id}
                          dir="ltr"
                          inputMode="decimal"
                          autoComplete="off"
                          maxLength={20}
                          aria-invalid={bad || undefined}
                          className="tabular-nums rtl:text-end"
                          value={revenues[year]}
                          onChange={(e) => setRevenues((r) => ({ ...r, [year]: e.target.value }))}
                        />
                        {bad ? <FieldError>{copy.errors.invalidYear(digits(String(year)))}</FieldError> : null}
                      </div>
                    )
                  })}
                </div>
                {errors.revenue ? <FieldError>{copy.errors.revenue}</FieldError> : null}
              </fieldset>

              <RadioGroup
                name="wave-notified"
                legend={copy.notifiedQuestion}
                options={[
                  ['yes', copy.yes],
                  ['no', copy.no],
                  ['unsure', copy.notSure],
                ]}
                value={notified}
                onChange={setNotified}
              />

              <Button type="submit" size="lg" className="qaftr-btn-primary w-full">
                {copy.submit}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          {result ? (
            <section
              ref={resultRef}
              tabIndex={-1}
              aria-labelledby="wave-result-title"
              aria-live="polite"
              className="scroll-mt-24 rounded-xl border border-border/80 bg-card p-5 shadow-sm outline-none"
            >
              <h2 id="wave-result-title" className="text-sm font-medium text-muted-foreground">
                {copy.resultTitle}
              </h2>
              <h3 className="mt-1 font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground">
                {fill(copy.status[result.status], { wave: digits(String(result.wave ?? '')) })}
              </h3>

              {result.deadline && result.daysRemaining !== null ? (
                <div
                  className={cn(
                    'mt-5 flex flex-wrap items-center gap-4 rounded-xl p-4',
                    result.status === 'overdue' ? 'bg-destructive/10' : 'bg-[var(--qaftr-gold)]/10',
                  )}
                >
                  <CalendarClockIcon className="size-8 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {copy.deadlineLabel}: <strong className="text-foreground">{formatSaDate(result.deadline, lang)}</strong>
                    </p>
                    {result.status === 'overdue' ? (
                      <p className="mt-1 font-semibold text-destructive">
                        {copy.daysOverdue(formatSaNumber(-result.daysRemaining, lang))}
                      </p>
                    ) : result.daysRemaining === 0 ? (
                      <p className="mt-1 font-semibold text-foreground">{copy.deadlineToday}</p>
                    ) : (
                      <p className="mt-1 flex items-baseline gap-2">
                        <span
                          data-testid="wave-days"
                          className="font-[family-name:var(--font-qaftr-display)] text-4xl font-bold tabular-nums text-[var(--qaftr-gold)]"
                        >
                          {formatSaNumber(result.daysRemaining, lang)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {result.daysRemaining === 1 ? copy.daysLeftOne : copy.daysLeft}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                {result.triggeringYears.length ? (
                  <p>
                    {fill(copy.triggeringYears, {
                      years: result.triggeringYears.map((y) => digits(String(y))).join(lang === 'ar' ? '، ' : ', '),
                    })}
                  </p>
                ) : null}
                {result.mayBeEarlierWave ? <p>{copy.earlierWave}</p> : null}
                {result.status === 'overdue' ? <p>{copy.overdueBody}</p> : null}
                {result.status === 'below-threshold' ? <p>{copy.belowBody}</p> : null}
                {result.status === 'not-registered' ? <p>{copy.notRegisteredBody}</p> : null}
                {result.status !== 'not-registered' ? (
                  <p className="rounded-lg bg-muted/40 p-3 text-foreground/80">{copy.notifiedCaveat}</p>
                ) : null}
              </div>

              {result.status === 'due' || result.status === 'overdue' ? (
                <div className="mt-5">
                  <h4 className="font-semibold text-foreground">{copy.nextStepsTitle}</h4>
                  <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground">
                    {copy.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {reminder ? (
                <section
                  aria-labelledby="wave-reminder-title"
                  data-testid="wave-reminder"
                  className="mt-5 rounded-xl border border-border/80 bg-muted/20 p-4"
                >
                  <h4 id="wave-reminder-title" className="flex items-center gap-2 font-semibold text-foreground">
                    <BellIcon className="size-4 text-[var(--qaftr-gold)]" aria-hidden />
                    {copy.reminder.title}
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.reminder.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-auto max-w-full whitespace-normal py-2 text-start"
                      onClick={downloadIcs}
                    >
                      <DownloadIcon className="size-4 shrink-0" aria-hidden />
                      {copy.reminder.ics}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-auto max-w-full whitespace-normal py-2 text-start"
                    >
                      <a
                        href={reminder.googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline"
                        onClick={() => trackReminder('wave_reminder_google')}
                      >
                        <CalendarPlusIcon className="size-4 shrink-0" aria-hidden />
                        {copy.reminder.google}
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-auto max-w-full whitespace-normal py-2 text-start"
                    >
                      <a
                        href={reminder.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline"
                        onClick={() => trackReminder('wave_reminder_whatsapp')}
                      >
                        <MessageCircleIcon className="size-4 shrink-0" aria-hidden />
                        {copy.reminder.whatsapp}
                      </a>
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{copy.reminder.privacy}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                    <span>{copy.reminder.signupBody}</span>
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                      onClick={() => setSignupOpen(true)}
                    >
                      {copy.reminder.signupCta}
                    </button>
                  </p>
                </section>
              ) : null}

              <Link
                to="/guides/zatca-wave-25"
                search={search}
                className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                {copy.guideLink}
                <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>

              <div className="mt-5 flex flex-col gap-3 rounded-xl bg-primary p-4 text-primary-foreground sm:flex-row sm:items-center">
                <p className="flex-1 text-sm text-primary-foreground/90">{copy.resultCtaBody}</p>
                <Button asChild variant="secondary" className="shrink-0">
                  <Link
                    to="/tools/fatora"
                    search={search}
                    className="no-underline"
                    onClick={() =>
                      track('cta_click', { cta: 'create_invoice', cta_location: 'wave_result' })
                    }
                  >
                    {copy.resultCta}
                  </Link>
                </Button>
              </div>
            </section>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
              <CalendarClockIcon className="size-8 text-muted-foreground/70" aria-hidden />
              <p className="text-sm text-muted-foreground">{copy.resultEmpty}</p>
            </div>
          )}

          <div className="rounded-xl border border-dashed border-[var(--qaftr-gold)]/60 p-5 text-sm">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <BellIcon className="size-4" aria-hidden />
              {copy.notifyTitle}
            </p>
            <p className="mt-1 text-muted-foreground">{copy.notifyBody}</p>
            <Button asChild variant="outline" size="sm" className="mt-3 h-auto whitespace-normal py-2">
              <a href={mailto} className="no-underline">
                {copy.notifyCta}
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/80">{copy.disclaimer}</p>
        </div>
      </div>
      <AuthGateDialog
        lang={lang}
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={() => setSignupOpen(false)}
        initialMode="signup"
        context="general"
      />
    </section>
  )
}

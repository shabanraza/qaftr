import { useEffect, useRef, useState } from 'react'
import { track } from '#/lib/analytics/track'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BellRingIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
} from 'lucide-react'
import { getUaeEInvoicingReadiness } from '@zatca/shared'
import type { UaeEInvoicingReadiness } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'
import { SUPPORT_EMAIL } from '#/lib/marketing/constants'
import { getAeCopy } from '#/lib/ae/copy'
import {
  formatAeDate,
  langSearch,
  parseAmountInput,
  todayInUae,
} from '#/lib/ae/format'
import { AE_PAGE_PATHS } from '#/lib/ae/pages'
import { READINESS_QUESTIONS } from '#/lib/ae/readiness-quiz'
import type { ReadinessQuestion } from '#/lib/ae/readiness-quiz'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

type Customers = 'b2b' | 'mixed' | 'b2c'
type Errors = Partial<Record<'gov' | 'customers' | 'revenue', boolean>>

type UaeReadinessQuizProps = {
  lang: MarketingLang
  /** YYYY-MM-DD; defaults to today's date in the UAE when the form is submitted. */
  today?: string
}

function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  errorTestId,
  columns = '',
}: {
  name: string
  legend: string
  options: ReadonlyArray<readonly [T, string]>
  value: T | null
  onChange: (value: T) => void
  error?: string
  errorTestId: string
  columns?: string
}) {
  const errorId = `${name}-error`
  return (
    <fieldset
      data-testid="readiness-question"
      className="flex min-w-0 flex-col gap-3"
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-3 text-sm font-medium text-foreground">
        {legend}
      </legend>
      <div className={cn('grid gap-2', columns)}>
        {options.map(([optionValue, label]) => (
          <label key={optionValue} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              data-testid={`${name}-${optionValue}`}
              className="peer sr-only"
            />
            <span className="block rounded-xl border border-border bg-background px-4 py-3 text-start text-sm font-medium transition-colors hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              {label}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <FieldError id={errorId} data-testid={errorTestId}>
          {error}
        </FieldError>
      ) : null}
    </fieldset>
  )
}

const questionNumber = (id: ReadinessQuestion) =>
  READINESS_QUESTIONS.indexOf(id) + 1

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}

export function UaeReadinessQuiz({ lang, today }: UaeReadinessQuizProps) {
  const copy = getAeCopy(lang)
  const q = copy.readiness
  const search = langSearch(lang)
  const [gov, setGov] = useState<'yes' | 'no' | null>(null)
  const [customers, setCustomers] = useState<Customers | null>(null)
  const [revenue, setRevenue] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [result, setResult] = useState<UaeEInvoicingReadiness | null>(null)

  const isGov = gov === 'yes'
  // B2C-only sellers are out of scope whatever their revenue, so don't ask.
  const needsRevenue = !isGov && customers !== 'b2c'
  const resultRef = useRef<HTMLDivElement>(null)

  // On phones the result sits below the form, so bring it into view.
  useEffect(() => {
    const el = resultRef.current
    // jsdom (tests) has no scrollIntoView, so feature-check it.
    if (
      result &&
      el &&
      'scrollIntoView' in el &&
      typeof el.scrollIntoView === 'function'
    ) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [result])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const revenueAed = parseAmountInput(revenue)
    const next: Errors = {
      gov: gov === null,
      customers: !isGov && customers === null,
      revenue: needsRevenue && (!Number.isFinite(revenueAed) || revenueAed < 0),
    }
    setErrors(next)
    if (next.gov || next.customers || next.revenue) {
      setResult(null)
      return
    }
    const readiness = getUaeEInvoicingReadiness({
      annualRevenueAed: needsRevenue ? revenueAed : 0,
      isGovernmentEntity: isGov,
      sellsB2BorB2G: isGov || customers !== 'b2c',
      sellsOnlyB2C: !isGov && customers === 'b2c',
      today: today ?? todayInUae(),
    })
    setResult(readiness)
    if (readiness) track('tool_used', { tool: 'uae_readiness_quiz', result: readiness.phase })
  }

  function reset() {
    setGov(null)
    setCustomers(null)
    setRevenue('')
    setErrors({})
    setResult(null)
  }

  const date = result?.mandatoryDate
    ? formatAeDate(result.mandatoryDate, lang)
    : null
  const subject = date
    ? fill(q.remindersSubject, { date })
    : q.remindersSubjectNoDate
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`

  return (
    <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{q.formTitle}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-6">
            <form
              data-testid="readiness-form"
              onSubmit={submit}
              noValidate
              className="flex flex-col gap-7"
            >
              <ChoiceGroup
                name="gov"
                legend={`${questionNumber('government')}. ${q.govQuestion}`}
                options={[
                  ['yes', q.yes],
                  ['no', q.no],
                ]}
                value={gov}
                onChange={setGov}
                error={errors.gov ? q.errors.gov : undefined}
                errorTestId="gov-error"
                columns="grid-cols-2"
              />

              {!isGov ? (
                <ChoiceGroup
                  name="customers"
                  legend={`${questionNumber('customers')}. ${q.customersQuestion}`}
                  options={[
                    ['b2b', q.customersB2b],
                    ['mixed', q.customersMixed],
                    ['b2c', q.customersB2c],
                  ]}
                  value={customers}
                  onChange={setCustomers}
                  error={errors.customers ? q.errors.customers : undefined}
                  errorTestId="customers-error"
                />
              ) : null}

              {needsRevenue ? (
                <Field
                  data-testid="readiness-question"
                  data-invalid={errors.revenue || undefined}
                >
                  <FieldLabel htmlFor="uae-revenue">
                    {questionNumber('revenue')}. {q.revenueQuestion}
                  </FieldLabel>
                  <Input
                    id="uae-revenue"
                    data-testid="revenue-input"
                    inputMode="decimal"
                    dir="ltr"
                    autoComplete="off"
                    maxLength={20}
                    className="text-lg tabular-nums"
                    placeholder={q.revenuePlaceholder}
                    value={revenue}
                    aria-invalid={errors.revenue || undefined}
                    aria-describedby={
                      errors.revenue ? 'revenue-error' : undefined
                    }
                    onChange={(e) => setRevenue(e.target.value)}
                  />
                  <FieldDescription>{q.revenueHint}</FieldDescription>
                  {errors.revenue ? (
                    <FieldError id="revenue-error" data-testid="revenue-error">
                      {q.errors.revenue}
                    </FieldError>
                  ) : null}
                </Field>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1"
                  data-testid="readiness-submit"
                >
                  {q.submit}
                </Button>
                {result ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={reset}
                  >
                    {q.reset}
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div aria-live="polite" ref={resultRef} className="scroll-mt-6">
          {result ? (
            <div data-testid="readiness-result" className="flex flex-col gap-5">
              <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground shadow-sm">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(200,151,58,0.35),transparent_50%)]"
                  aria-hidden
                />
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-[family-name:var(--font-qaftr-display)] text-lg font-bold">
                      {q.resultTitle}
                    </h2>
                    <Badge
                      data-testid="readiness-status"
                      className="bg-[var(--qaftr-gold)] text-primary"
                    >
                      {q.status[result.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-primary-foreground/85">
                    {q.phases[result.phase]}
                  </p>

                  {date ? (
                    <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
                      {result.status === 'upcoming' ? (
                        <div>
                          <p
                            data-testid="readiness-days"
                            className="font-[family-name:var(--font-qaftr-display)] text-6xl font-bold leading-none tabular-nums text-[var(--qaftr-gold)] md:text-7xl"
                          >
                            {result.daysRemaining}
                          </p>
                          <p className="mt-2 text-sm text-primary-foreground/85">
                            {q.daysLeft}
                          </p>
                        </div>
                      ) : null}
                      <div>
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary-foreground/75">
                          <CalendarClockIcon className="size-4" aria-hidden />
                          {q.mandatoryFrom}
                        </p>
                        <p
                          data-testid="readiness-date"
                          className="mt-1 font-[family-name:var(--font-qaftr-display)] text-2xl font-bold"
                        >
                          {date}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {result.status === 'overdue-mandatory' ? (
                    <p className="mt-5 text-sm">{q.overdueBody}</p>
                  ) : null}
                  {result.status === 'not-in-scope-yet' ? (
                    <p className="mt-5 text-sm">{q.notInScopeBody}</p>
                  ) : null}
                  <p className="mt-5 text-xs text-primary-foreground/70">
                    {copy.verifyNote}
                  </p>
                </div>
              </div>

              <Card
                className="gap-2 py-5 shadow-none"
                data-testid="readiness-asp"
              >
                <CardHeader className="px-5">
                  <CardTitle className="text-base">
                    <h3>{q.aspTitle}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 text-sm text-muted-foreground">
                  {result.aspAppointment.recommendation === 'appoint-now' &&
                  result.aspAppointment.reportedDeadline
                    ? fill(
                        result.aspAppointment.deadlinePassed
                          ? q.aspLargePassed
                          : q.aspLarge,
                        {
                          deadline: formatAeDate(
                            result.aspAppointment.reportedDeadline,
                            lang,
                          ),
                          alternate: result.aspAppointment
                            .alternateReportedDeadline
                            ? formatAeDate(
                                result.aspAppointment.alternateReportedDeadline,
                                lang,
                              )
                            : '',
                        },
                      )
                    : result.aspAppointment.recommendation === 'plan-now'
                      ? q.aspPlan
                      : q.aspMonitor}
                </CardContent>
              </Card>

              {result.status !== 'not-in-scope-yet' ? (
                <Card className="gap-3 py-5 shadow-none">
                  <CardHeader className="px-5">
                    <CardTitle className="text-base">
                      <h3>{q.stepsTitle}</h3>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5">
                    <ol
                      data-testid="readiness-steps"
                      className="flex flex-col gap-4"
                    >
                      {q.steps.map((step, index) => (
                        <li key={step.title} className="flex gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-foreground">
                              {step.title}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {step.body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="gap-3 border-[var(--qaftr-gold)]/40 bg-accent/40 py-5 shadow-none">
                <CardHeader className="px-5">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BellRingIcon
                      className="size-4 text-[var(--qaftr-gold)]"
                      aria-hidden
                    />
                    <h3>{q.remindersTitle}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 px-5">
                  <p className="text-sm text-muted-foreground">
                    {q.remindersBody}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild>
                      <a
                        data-testid="reminder-mailto"
                        href={mailto}
                        className="no-underline text-primary-foreground hover:text-primary-foreground"
                      >
                        {q.remindersCta}
                      </a>
                    </Button>
                    <Button asChild variant="outline">
                      <Link
                        to={AE_PAGE_PATHS.guide}
                        search={search}
                        className="no-underline"
                      >
                        {q.guideCta}
                        <ArrowRight
                          className="size-4 rtl:rotate-180"
                          aria-hidden
                        />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed py-10 shadow-none">
              <CardContent className="flex flex-col items-center gap-3 px-6 text-center">
                <CheckCircle2Icon
                  className="size-8 text-[var(--qaftr-gold)]"
                  aria-hidden
                />
                <p className="max-w-sm text-sm text-muted-foreground">
                  {q.subtitle}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}

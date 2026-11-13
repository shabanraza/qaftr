import { useMemo, useState } from 'react'
import { useTrackToolResult } from '#/lib/analytics/use-track-result'
import { Link } from '@tanstack/react-router'
import {
  ArrowUpRightIcon,
  CheckIcon,
  CircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  XIcon,
} from 'lucide-react'
import { UAE_TRN_PREFIX, analyzeUaeTrn } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'
import { getAeCopy } from '#/lib/ae/copy'
import { langSearch } from '#/lib/ae/format'
import { AE_PAGE_PATHS } from '#/lib/ae/pages'
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

export const FTA_WEBSITE_URL = 'https://tax.gov.ae/'

function RuleRow({
  ok,
  label,
  testId,
}: {
  ok: boolean | null
  label: string
  testId: string
}) {
  return (
    <li
      className="flex items-center gap-3 text-sm"
      data-testid={testId}
      data-ok={String(ok)}
    >
      {ok === null ? (
        <CircleIcon className="size-4 text-muted-foreground/50" aria-hidden />
      ) : ok ? (
        <CheckIcon className="size-4 text-primary" aria-hidden />
      ) : (
        <XIcon className="size-4 text-destructive" aria-hidden />
      )}
      <span
        className={cn(
          ok === false && 'text-destructive',
          ok === true && 'text-foreground',
        )}
      >
        {label}
      </span>
    </li>
  )
}

type UaeTrnCheckerToolProps = {
  lang: MarketingLang
}

export function UaeTrnCheckerTool({ lang }: UaeTrnCheckerToolProps) {
  const copy = getAeCopy(lang).trn
  const [value, setValue] = useState('')
  const analysis = useMemo(() => analyzeUaeTrn(value), [value])
  const hasInput = analysis.normalized.length > 0
  const outcome = analysis.valid ? 'valid' : 'invalid'
  // Keyed on the outcome only: the TRN itself is never sent.
  useTrackToolResult('uae_trn_checker', hasInput ? outcome : null, { result: outcome })
  const search = langSearch(lang)

  const charsOk = hasInput
    ? !analysis.issues.includes('INVALID_CHARACTERS')
    : null
  const lengthOk = hasInput ? !analysis.issues.includes('INVALID_LENGTH') : null
  const prefixOk = hasInput
    ? analysis.normalized.startsWith(UAE_TRN_PREFIX)
    : null

  const statusLabel = !hasInput
    ? copy.statusEmpty
    : analysis.valid
      ? copy.statusValid
      : copy.statusInvalid

  return (
    <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <Badge variant="outline" className="w-fit">
              {copy.badge}
            </Badge>
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{copy.inputLabel}</h2>
            </CardTitle>
            <CardDescription>{copy.inputHint}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="uae-trn-input">
                  {copy.inputLabel}
                </FieldLabel>
                <Input
                  id="uae-trn-input"
                  inputMode="numeric"
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-lg tracking-[0.08em] tabular-nums"
                  placeholder={copy.inputPlaceholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  aria-describedby="uae-trn-status"
                />
                <FieldDescription>{copy.inputHint}</FieldDescription>
              </Field>
            </FieldGroup>
            <Alert className="mt-6">
              <InfoIcon aria-hidden />
              <AlertTitle>{copy.formatOnlyTitle}</AlertTitle>
              <AlertDescription>
                <p>{copy.formatOnlyBody}</p>
                <a
                  href={FTA_WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-medium text-primary"
                >
                  {copy.ftaLink}
                  <ExternalLinkIcon className="size-3.5" aria-hidden />
                </a>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 px-5 py-5">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{copy.rulesTitle}</h2>
            </CardTitle>
            <Badge
              id="uae-trn-status"
              data-testid="trn-status"
              role="status"
              aria-live="polite"
              variant={
                analysis.valid
                  ? 'default'
                  : hasInput
                    ? 'destructive'
                    : 'outline'
              }
            >
              {statusLabel}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-5 pb-2">
            <ul className="flex flex-col gap-3">
              <RuleRow
                ok={charsOk}
                label={copy.rules.characters}
                testId="rule-characters"
              />
              <RuleRow
                ok={lengthOk}
                label={copy.rules.length}
                testId="rule-length"
              />
              <RuleRow
                ok={prefixOk}
                label={copy.rules.prefix}
                testId="rule-prefix"
              />
            </ul>
            {hasInput ? (
              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  {copy.normalizedLabel} · {copy.digitCount}:{' '}
                  {analysis.digitCount}
                </p>
                <p
                  dir="ltr"
                  data-testid="trn-normalized"
                  className="mt-1 break-all font-mono text-lg tracking-[0.08em] tabular-nums text-foreground"
                >
                  {analysis.normalized}
                </p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3 px-5 pb-5 pt-4">
            <p className="text-sm font-medium text-foreground">
              {copy.nextTitle}
            </p>
            <p className="text-sm text-muted-foreground">{copy.nextBody}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild>
                <Link
                  to={AE_PAGE_PATHS['vat-calculator']}
                  search={search}
                  className="no-underline text-primary-foreground hover:text-primary-foreground"
                >
                  {copy.nextVat}
                  <ArrowUpRightIcon
                    data-icon="inline-end"
                    className="rtl:-scale-x-100"
                  />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to={AE_PAGE_PATHS['e-invoicing-readiness']}
                  search={search}
                  className="no-underline"
                >
                  {copy.nextReadiness}
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

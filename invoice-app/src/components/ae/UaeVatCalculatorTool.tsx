import { useMemo, useState } from 'react'
import { useTrackToolResult } from '#/lib/analytics/use-track-result'
import { Link } from '@tanstack/react-router'
import { ArrowUpRightIcon } from 'lucide-react'
import { MAX_VAT_AMOUNT, UAE_VAT_RATE, calculateVat } from '@zatca/shared'
import type { VatCalculationMode } from '@zatca/shared'
import type { MarketingLang } from '#/lib/marketing/lang'
import { getAeCopy } from '#/lib/ae/copy'
import { formatAed, langSearch, parseAmountInput } from '#/lib/ae/format'
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
import { Separator } from '#/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

type UaeVatCalculatorToolProps = {
  lang: MarketingLang
}

export function UaeVatCalculatorTool({ lang }: UaeVatCalculatorToolProps) {
  const copy = getAeCopy(lang).vat
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<VatCalculationMode>('exclusive')
  const search = langSearch(lang)

  const parsed = parseAmountInput(amount)
  const tooLarge = parsed > MAX_VAT_AMOUNT
  const result = useMemo(() => {
    if (!amount.trim()) return null
    return calculateVat(parsed, mode, UAE_VAT_RATE)
  }, [amount, parsed, mode])
  useTrackToolResult('uae_vat_calculator', result ? `${mode}:${amount.trim()}` : null, { result: mode })

  return (
    <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <Card className="overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <Badge variant="outline" className="w-fit">
              {copy.badge}
            </Badge>
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{copy.cardTitle}</h2>
            </CardTitle>
            <CardDescription>{copy.rateNote}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-6">
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel htmlFor="uae-vat-amount">
                  {copy.amountLabel}
                </FieldLabel>
                <Input
                  id="uae-vat-amount"
                  inputMode="decimal"
                  dir="ltr"
                  autoComplete="off"
                  className="text-lg tabular-nums"
                  placeholder={copy.amountPlaceholder}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  maxLength={20}
                />
              </Field>
              <Field>
                <FieldLabel>{copy.modeLabel}</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={mode}
                  onValueChange={(value) => {
                    if (value === 'exclusive' || value === 'inclusive')
                      setMode(value)
                  }}
                  className="w-full"
                  aria-label={copy.modeLabel}
                >
                  <ToggleGroupItem value="exclusive" className="flex-1">
                    {copy.modeExclusive}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="inclusive" className="flex-1">
                    {copy.modeInclusive}
                  </ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>{copy.rateNote}</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 py-0 shadow-sm">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_80%_0%,rgba(200,151,58,0.18),transparent_55%)]"
            aria-hidden
          />
          <CardHeader className="relative gap-2 px-5 py-5">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{copy.resultsTitle}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative px-5 pb-2" aria-live="polite">
            {result ? (
              <dl className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <dt className="text-sm text-muted-foreground">
                    {copy.subtotal}
                  </dt>
                  <dd
                    data-testid="vat-subtotal"
                    dir="ltr"
                    className="text-lg font-semibold tabular-nums text-foreground"
                  >
                    {formatAed(result.subtotal, lang)}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <dt className="text-sm text-muted-foreground">{copy.vat}</dt>
                  <dd
                    data-testid="vat-amount"
                    dir="ltr"
                    className="text-lg font-semibold tabular-nums text-primary"
                  >
                    {formatAed(result.vatAmount, lang)}
                  </dd>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <dt className="text-base font-medium text-foreground">
                    {copy.total}
                  </dt>
                  <dd
                    data-testid="vat-total"
                    dir="ltr"
                    className="break-all font-[family-name:var(--font-qaftr-display)] text-3xl font-bold tabular-nums text-[var(--qaftr-gold)]"
                  >
                    {formatAed(result.total, lang)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p
                data-testid={tooLarge ? 'vat-too-large' : 'vat-empty'}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                {tooLarge ? copy.tooLargeHint : copy.emptyHint}
              </p>
            )}
          </CardContent>
          <CardFooter className="relative flex-col items-stretch gap-3 px-5 pb-5 pt-4">
            <Button asChild className="w-full" size="lg">
              <Link
                to="/ae/tools/invoice-generator"
                search={search}
                className="no-underline text-primary-foreground hover:text-primary-foreground"
              >
                {copy.createInvoice}
                <ArrowUpRightIcon
                  data-icon="inline-end"
                  className="rtl:-scale-x-100"
                />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">{copy.invoiceNote}</p>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

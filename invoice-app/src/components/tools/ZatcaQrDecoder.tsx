import { useId, useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangleIcon, ArrowUpRightIcon, CheckCircle2Icon, ImageUpIcon, ShieldCheckIcon, XCircleIcon } from 'lucide-react'
import { decodeZatcaQrPayload, encodeZatcaQr } from '@zatca/shared'
import type { DecodedZatcaQr } from '@zatca/shared'
import { useTrackToolResult } from '#/lib/analytics/use-track-result'
import type { MarketingLang } from '#/lib/marketing/lang'
import { getQrCopy } from '#/lib/sa/qr-copy'
import { decodeQrFromImage } from '#/lib/sa/qr-image'
import { toArabicIndic } from '#/lib/sa/format'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '#/components/ui/field'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'

const SAMPLE = encodeZatcaQr({
  sellerName: 'مؤسسة قافتر التجارية',
  vatNumber: '300000000000003',
  timestamp: '2026-11-13T10:30:00Z',
  invoiceTotal: '1150.00',
  vatTotal: '150.00',
})

function money(value: string, lang: MarketingLang): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return value
  const [whole, fraction] = n.toFixed(2).split('.')
  const grouped = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
  return lang === 'ar' ? `${toArabicIndic(grouped)} ر.س` : `SAR ${grouped}`
}

function Row({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2.5 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-sm font-medium text-foreground sm:text-end" data-testid={testId}>
        {children}
      </dd>
    </div>
  )
}

export function ZatcaQrDecoder({ lang }: { lang: MarketingLang }) {
  const copy = getQrCopy(lang)
  const inputId = useId()
  const fileId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [reading, setReading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  const result = useMemo(() => (value.trim() ? decodeZatcaQrPayload(value) : null), [value])
  const errors = result?.ok ? result.qr.issues.filter((i) => i.severity === 'error').length : 0
  const resultKey = !result ? null : result.ok ? `phase${result.qr.phase}_${errors ? 'issues' : 'ok'}` : 'invalid'
  // Keyed on the outcome only: the invoice data itself is never sent.
  useTrackToolResult('zatca_qr_decoder', resultKey, resultKey ? { result: resultKey } : undefined)

  const setPayload = (text: string) => {
    setImageError(false)
    setValue(text)
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setReading(true)
    setImageError(false)
    try {
      const text = await decodeQrFromImage(file)
      if (text) setValue(text)
      else setImageError(true)
    } catch {
      setImageError(true)
    } finally {
      setReading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <Card className="min-w-0 overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/60 bg-muted/20 px-5 py-5">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
              <h2>{copy.inputLabel}</h2>
            </CardTitle>
            <CardDescription>{copy.privacyNote}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-5 py-6">
            <Field>
              <FieldLabel htmlFor={inputId}>{copy.inputLabel}</FieldLabel>
              <Textarea
                id={inputId}
                dir="ltr"
                rows={5}
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs break-all"
                placeholder="AR..."
                value={value}
                onChange={(e) => setPayload(e.target.value)}
              />
              <FieldDescription>{copy.inputHint}</FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                id={fileId}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={copy.upload}
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <Button type="button" variant="default" onClick={() => fileRef.current?.click()} disabled={reading}>
                {reading ? <Spinner aria-hidden /> : <ImageUpIcon data-icon="inline-start" aria-hidden />}
                {reading ? copy.reading : copy.upload}
              </Button>
              <Button type="button" variant="outline" onClick={() => setPayload(SAMPLE)}>
                {copy.sample}
              </Button>
              {value ? (
                <Button type="button" variant="ghost" onClick={() => setPayload('')}>
                  {copy.clear}
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{copy.uploadHint}</p>
            {imageError ? (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {copy.noQrInImage}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="min-w-0 border-border/80 py-0 shadow-sm" aria-live="polite">
            <CardHeader className="px-5 pt-5">
              <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-xl">
                <h2>{copy.resultTitle}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 px-5 pb-5">
              {!result ? (
                <p className="text-sm text-muted-foreground">{copy.errors.EMPTY}</p>
              ) : !result.ok ? (
                <p role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {copy.errors[result.error]}
                </p>
              ) : (
                <DecodedResult qr={result.qr} lang={lang} errors={errors} />
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p>{copy.formatOnlyNote}</p>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--qaftr-gold)]/60 p-4 text-sm">
            <p className="font-semibold text-foreground">{copy.ctaTitle}</p>
            <p className="mt-1 text-muted-foreground">{copy.ctaBody}</p>
            <Link to="/tools/fatora" search={search} className="mt-2 inline-flex items-center gap-1 font-medium">
              {copy.ctaLink}
              <ArrowUpRightIcon className="size-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function DecodedResult({ qr, lang, errors }: { qr: DecodedZatcaQr; lang: MarketingLang; errors: number }) {
  const copy = getQrCopy(lang)
  const f = copy.fields
  const ltr = (v: string) => <span dir="ltr">{v || '—'}</span>
  const tags = qr.tags.join(', ')
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid="qr-status"
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold',
            errors ? 'text-destructive' : 'text-primary',
          )}
        >
          {errors ? <XCircleIcon className="size-4" aria-hidden /> : <CheckCircle2Icon className="size-4" aria-hidden />}
          {errors ? copy.statusIssues(errors) : copy.statusOk}
        </span>
        <Badge variant="outline" data-testid="qr-phase">
          {qr.phase === 2 ? copy.phase2 : copy.phase1}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{qr.phase === 2 ? copy.phase2Note : copy.phase1Note}</p>

      {qr.issues.length ? (
        <div>
          <p className="text-sm font-semibold text-foreground">{copy.issuesTitle}</p>
          <ul data-testid="qr-issues" className="mt-2 flex flex-col gap-2">
            {qr.issues.map((issue) => (
              <li
                key={issue.code}
                className={cn(
                  'flex gap-2 text-sm',
                  issue.severity === 'error' ? 'text-destructive' : 'text-[var(--qaftr-gold)]',
                )}
              >
                {issue.severity === 'error' ? (
                  <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                ) : (
                  <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-label={copy.warning} />
                )}
                <span>{copy.issues[issue.code]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <dl>
        <Row label={f.sellerName}>
          <span dir="auto">{qr.sellerName || '—'}</span>
        </Row>
        <Row label={f.vatNumber}>{ltr(qr.vatNumber)}</Row>
        <Row label={f.timestamp}>{ltr(qr.timestamp)}</Row>
        <Row label={f.total} testId="qr-total">
          <span dir="ltr">{qr.total ? money(qr.total, lang) : '—'}</span>
        </Row>
        <Row label={f.vatTotal}>
          <span dir="ltr">{qr.vatTotal ? money(qr.vatTotal, lang) : '—'}</span>
        </Row>
        {qr.invoiceHash !== undefined ? <Row label={f.invoiceHash}>{ltr(qr.invoiceHash)}</Row> : null}
        {qr.signature !== undefined ? (
          <Row label={f.signature}>{ltr(qr.signature.length > 48 ? `${qr.signature.slice(0, 48)}…` : qr.signature)}</Row>
        ) : null}
        {qr.publicKeyBytes !== undefined ? <Row label={f.publicKey}>{f.bytes(qr.publicKeyBytes)}</Row> : null}
        {qr.certificateSignatureBytes !== undefined ? (
          <Row label={f.certificateSignature}>{f.bytes(qr.certificateSignatureBytes)}</Row>
        ) : null}
        <Row label={f.tags}>{ltr(lang === 'ar' ? toArabicIndic(tags) : tags)}</Row>
      </dl>
    </>
  )
}

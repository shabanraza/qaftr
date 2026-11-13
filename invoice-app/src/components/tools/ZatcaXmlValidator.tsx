import { useEffect, useId, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CheckCircle2Icon,
  FileUpIcon,
  InfoIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from 'lucide-react'
import type { ZatcaXmlInspection, ZatcaXmlReport } from '@zatca/shared/zatca-phase2'
import { useTrackToolResult } from '#/lib/analytics/use-track-result'
import type { MarketingLang } from '#/lib/marketing/lang'
import { getQrCopy } from '#/lib/sa/qr-copy'
import { getXmlValidatorCopy } from '#/lib/sa/xml-validator-copy'
import { toArabicIndic } from '#/lib/sa/format'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '#/components/ui/field'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'

const MAX_FILE_BYTES = 5 * 1024 * 1024

type FileError = 'FILE_TOO_LARGE' | 'FILE_UNREADABLE'
type Severity = 'ok' | 'error' | 'warning' | 'info'

// Loaded on demand: the inspector pulls in the secp256k1 verifier.
const loadInspector = () => import('@zatca/shared/zatca-phase2').then((m) => m.inspectZatcaInvoiceXml)
const loadSample = () =>
  import('../../../../packages/shared/src/zatca-phase2/__fixtures__/sandbox-compliance-simplified.xml?raw').then(
    (m) => m.default as string,
  )

function money(value: string, lang: MarketingLang): string {
  const n = Number(value)
  if (!value || !Number.isFinite(n)) return value || '—'
  const [whole, fraction] = n.toFixed(2).split('.')
  const grouped = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
  return lang === 'ar' ? `${toArabicIndic(grouped)} ر.س` : `SAR ${grouped}`
}

function useInspection(xml: string) {
  const [state, setState] = useState<{ xml: string; result: ZatcaXmlInspection } | null>(null)
  useEffect(() => {
    if (!xml.trim()) {
      setState(null)
      return
    }
    let cancelled = false
    void loadInspector().then((inspect) => {
      if (!cancelled) setState({ xml, result: inspect(xml) })
    })
    return () => {
      cancelled = true
    }
  }, [xml])
  const current = state && state.xml === xml ? state.result : null
  return { result: current, pending: !!xml.trim() && !current }
}

export function ZatcaXmlValidator({ lang }: { lang: MarketingLang }) {
  const copy = getXmlValidatorCopy(lang)
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [fileError, setFileError] = useState<FileError | null>(null)
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const { result, pending } = useInspection(value)

  const report = result?.ok ? result.report : null
  const resultKey = !result ? null : report ? `${report.summary.subtype}_${report.errorCount ? 'issues' : 'ok'}` : 'invalid'
  // Keyed on the outcome only: the invoice data itself is never sent.
  useTrackToolResult('zatca_xml_validator', resultKey, resultKey ? { result: resultKey } : undefined)

  const setXml = (text: string) => {
    setFileError(null)
    setValue(text)
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    try {
      if (file.size > MAX_FILE_BYTES) {
        setValue('')
        setFileError('FILE_TOO_LARGE')
        return
      }
      setXml(await file.text())
    } catch {
      setFileError('FILE_UNREADABLE')
    } finally {
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
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                className="sr-only"
                aria-label={copy.upload}
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              <Button type="button" variant="default" onClick={() => fileRef.current?.click()}>
                <FileUpIcon data-icon="inline-start" aria-hidden />
                {copy.upload}
              </Button>
              <Button type="button" variant="outline" onClick={() => void loadSample().then(setXml)}>
                {copy.sample}
              </Button>
              {value ? (
                <Button type="button" variant="ghost" onClick={() => setXml('')}>
                  {copy.clear}
                </Button>
              ) : null}
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">{copy.uploadHint}</p>
            <Field>
              <FieldLabel htmlFor={inputId}>{copy.inputLabel}</FieldLabel>
              <Textarea
                id={inputId}
                dir="ltr"
                rows={12}
                autoComplete="off"
                spellCheck={false}
                className="max-h-[28rem] font-mono text-xs break-all"
                placeholder='<?xml version="1.0" encoding="UTF-8"?>'
                value={value}
                onChange={(e) => setXml(e.target.value)}
              />
              <FieldDescription>{copy.inputHint}</FieldDescription>
            </Field>
            {fileError ? (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {copy.errors[fileError]}
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
            <CardContent className="flex flex-col gap-5 px-5 pb-5">
              {pending ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner aria-hidden />
                  {copy.checking}
                </p>
              ) : !result ? (
                <p className="text-sm text-muted-foreground">{copy.emptyResult}</p>
              ) : !result.ok ? (
                <p role="alert" className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {copy.errors[result.error]}
                </p>
              ) : (
                <Report report={result.report} lang={lang} />
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p>{copy.officialNote}</p>
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

function StatusIcon({ severity, className }: { severity: Severity; className?: string }) {
  const cls = cn('mt-0.5 size-4 shrink-0', className)
  if (severity === 'ok') return <CheckCircle2Icon className={cn(cls, 'text-primary')} aria-hidden />
  if (severity === 'error') return <XCircleIcon className={cn(cls, 'text-destructive')} aria-hidden />
  if (severity === 'warning') return <AlertTriangleIcon className={cn(cls, 'text-[var(--qaftr-gold)]')} aria-hidden />
  return <InfoIcon className={cn(cls, 'text-muted-foreground')} aria-hidden />
}

function Section({
  title,
  severity,
  testId,
  children,
}: {
  title: string
  severity: Severity
  testId: string
  children: React.ReactNode
}) {
  return (
    <section data-testid={testId} className="border-t border-border/60 pt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <StatusIcon severity={severity} className="mt-0" />
        {title}
      </h3>
      <div className="mt-2 flex flex-col gap-2 text-sm">{children}</div>
    </section>
  )
}

function Item({ severity, children, detail }: { severity: Severity; children: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <StatusIcon severity={severity} />
      <div className="min-w-0">
        <p className={cn(severity === 'error' ? 'text-destructive' : 'text-foreground')}>{children}</p>
        {detail ? <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground" dir="ltr">{detail}</p> : null}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-all text-sm font-medium text-foreground sm:text-end">{children}</dd>
    </div>
  )
}

function Report({ report, lang }: { report: ZatcaXmlReport; lang: MarketingLang }) {
  const copy = getXmlValidatorCopy(lang)
  const qrCopy = getQrCopy(lang)
  const { summary, missing, rules, totals, qr, signature } = report
  const num = (s: string) => (lang === 'ar' ? toArabicIndic(s) : s)
  const failedTotals = totals.filter((t) => !t.ok)
  const sev = (s: 'error' | 'warning' | 'info' | undefined): Severity => s ?? 'error'
  const subtypeKey = summary.subtype

  const qrSeverity: Severity =
    qr.status === 'missing'
      ? sev(qr.severity)
      : qr.status === 'invalid' || qr.mismatches.length || qr.issues.some((i) => i.severity === 'error')
        ? 'error'
        : qr.issues.length
          ? 'warning'
          : 'ok'
  const signatureSeverity: Severity = signature.status === 'verified' ? 'ok' : sev(signature.severity)
  const missingText = (key: 'qrMissing' | 'signatureMissing') =>
    copy[`${key}${subtypeKey === 'standard' ? 'Standard' : subtypeKey === 'simplified' ? 'Simplified' : 'Unknown'}`]

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span
          data-testid="xml-status"
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold',
            report.errorCount ? 'text-destructive' : 'text-primary',
          )}
        >
          {report.errorCount ? <XCircleIcon className="size-4" aria-hidden /> : <CheckCircle2Icon className="size-4" aria-hidden />}
          {report.errorCount ? copy.statusIssues(report.errorCount) : copy.statusOk}
        </span>
        {report.warningCount ? (
          <span className="text-sm text-[var(--qaftr-gold)]">· {copy.statusWarnings(report.warningCount)}</span>
        ) : null}
        <Badge variant="outline" data-testid="xml-type">
          {copy.types[subtypeKey]} · {copy.kinds[summary.kind]}
        </Badge>
      </div>

      <dl>
        <Row label={copy.summary.number}>
          <span dir="ltr">{summary.id || '—'}</span>
        </Row>
        <Row label={copy.summary.issued}>
          <span dir="ltr">{[summary.issueDate, summary.issueTime].filter(Boolean).join(' ') || '—'}</span>
        </Row>
        <Row label={copy.summary.seller}>
          <span dir="auto">{summary.sellerName || '—'}</span>
        </Row>
        <Row label={copy.summary.vat}>
          <span dir="ltr">{summary.sellerVat || '—'}</span>
        </Row>
        {summary.buyerName ? (
          <Row label={copy.summary.buyer}>
            <span dir="auto">{summary.buyerName}</span>
          </Row>
        ) : null}
        <Row label={copy.summary.total}>
          <span dir="ltr">{money(summary.total, lang)}</span>
        </Row>
        <Row label={copy.summary.lines}>{num(String(summary.lineCount))}</Row>
      </dl>

      <Section title={copy.sections.missing} severity={missing.length ? 'error' : 'ok'} testId="xml-missing">
        {missing.length ? (
          missing.map((m) => (
            <Item key={m.field} severity="error" detail={m.path}>
              {copy.fields[m.field]}
            </Item>
          ))
        ) : (
          <p className="text-muted-foreground">{copy.allPresent}</p>
        )}
      </Section>

      <Section title={copy.sections.rules} severity={rules.length ? 'error' : 'ok'} testId="xml-rules">
        {rules.length ? (
          rules.map((r, i) => (
            <Item key={`${r.code}-${r.path}-${i}`} severity="error" detail={`${r.rule} · ${r.path}`}>
              {copy.rules[r.code]}
            </Item>
          ))
        ) : (
          <p className="text-muted-foreground">{copy.noRuleIssues}</p>
        )}
      </Section>

      <Section title={copy.sections.totals} severity={failedTotals.length ? 'error' : 'ok'} testId="xml-totals">
        {failedTotals.length ? (
          failedTotals.map((t, i) => (
            <Item key={`${t.check}-${t.line ?? 0}-${i}`} severity="error" detail={t.rule}>
              {t.line !== undefined ? (t.check === 'SUBTOTAL_VAT' ? copy.subtotalPrefix(t.line) : copy.linePrefix(t.line)) : null}
              {copy.totals[t.check]} — <span dir="ltr">{copy.expectedFound(num(t.expected), num(t.actual))}</span>
            </Item>
          ))
        ) : (
          <p className="text-muted-foreground">{copy.totalsOk}</p>
        )}
      </Section>

      <Section title={copy.sections.qr} severity={qrSeverity} testId="xml-qr">
        {qr.status === 'missing' ? (
          <Item severity={qrSeverity}>{missingText('qrMissing')}</Item>
        ) : qr.status === 'invalid' ? (
          <Item severity="error">{qr.error ? qrCopy.errors[qr.error] : null}</Item>
        ) : (
          <>
            <p>
              <Badge variant="outline">{copy.qrPhase(qr.phase ?? 1)}</Badge>
            </p>
            {qr.mismatches.map((m) => (
              <Item key={m.field} severity="error" detail={copy.qrMismatchValues(m.qr, m.document)}>
                {copy.mismatches[m.field]}
              </Item>
            ))}
            {qr.issues.map((issue) => (
              <Item key={issue.code} severity={issue.severity}>
                {qrCopy.issues[issue.code]}
              </Item>
            ))}
            {!qr.mismatches.length ? <Item severity="ok">{copy.qrMatches}</Item> : null}
          </>
        )}
      </Section>

      <Section title={copy.sections.signature} severity={signatureSeverity} testId="xml-signature">
        {signature.status === 'verified' ? (
          <Item severity="ok">{copy.signatureVerified}</Item>
        ) : signature.status === 'failed' ? (
          <>
            <Item severity="error">{copy.signatureFailed}</Item>
            <ul className="flex flex-col gap-1 ps-6">
              {signature.checks
                ? (Object.keys(copy.signatureChecks) as (keyof typeof copy.signatureChecks)[]).map((k) => (
                    <li key={k} className="flex items-center gap-2">
                      <StatusIcon severity={signature.checks?.[k] ? 'ok' : 'error'} className="mt-0" />
                      {copy.signatureChecks[k]}
                    </li>
                  ))
                : null}
            </ul>
          </>
        ) : signature.status === 'error' ? (
          <Item severity="error">{copy.signatureError}</Item>
        ) : (
          <Item severity={signatureSeverity}>{missingText('signatureMissing')}</Item>
        )}
      </Section>
    </>
  )
}

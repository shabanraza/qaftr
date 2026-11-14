import { useMemo, useState } from 'react'
import { CheckCircle2Icon, CircleAlertIcon } from 'lucide-react'
import { checkSellerFormat, normalizePartyInput, sellerZatcaReadiness } from '@zatca/shared'
import type { PartyIssue } from '@zatca/shared'
import { Button } from '#/components/ui/button'
import { FormSection } from './FormSection'
import type { MarketingLang } from '#/lib/marketing/lang'
import { toArabicIndic } from '#/lib/sa/format'
import { getPartyCopy } from '#/lib/zatca/party-copy'
import { parseProfileError } from '#/lib/zatca/party-input'
import { cn } from '#/lib/utils'
import { PartyFields } from './PartyFields'
import type { PartyFormKey, PartyValues } from './PartyFields'

const IDENTITY: PartyFormKey[] = ['nameAr', 'nameEn', 'vatNumber', 'crNumber']
const ADDRESS: PartyFormKey[] = ['street', 'buildingNumber', 'additionalNumber', 'district', 'city', 'postalCode']
const ALL = [...IDENTITY, ...ADDRESS]

export type BusinessProfileValues = Record<(typeof ALL)[number], string | null>

const TEXT = {
  ar: {
    identityTitle: 'بيانات المنشأة',
    identityHint: 'تظهر هذه البيانات في كل فاتورة تصدرها.',
    save: 'حفظ',
    saving: 'جارٍ الحفظ…',
    saved: 'تم الحفظ',
    failed: 'تعذّر الحفظ. حاول مرة أخرى.',
    ready: 'ملفك مكتمل للمرحلة الثانية من الفوترة الإلكترونية (الربط مع هيئة الزكاة والضريبة والجمارك).',
    missing: (n: number) => `البيانات الناقصة للمرحلة الثانية: ${toArabicIndic(String(n))}`,
    missingHint: 'يمكنك الحفظ الآن وإكمال الباقي لاحقاً.',
  },
  en: {
    identityTitle: 'Business details',
    identityHint: 'These details appear on every invoice you issue.',
    save: 'Save',
    saving: 'Saving…',
    saved: 'Saved',
    failed: 'Could not save. Please try again.',
    ready: 'Your profile is complete for ZATCA Phase 2 (integration).',
    missing: (n: number) => `${n} ${n === 1 ? 'detail' : 'details'} missing for ZATCA Phase 2`,
    missingHint: 'You can save now and finish the rest later.',
  },
}

const toForm = (initial: Partial<BusinessProfileValues> | null): PartyValues =>
  Object.fromEntries(ALL.map((k) => [k, initial?.[k] ?? ''])) as PartyValues

export function BusinessProfileForm({
  lang,
  initial,
  onSave,
}: {
  lang: MarketingLang
  initial: Partial<BusinessProfileValues> | null
  onSave: (values: BusinessProfileValues) => Promise<unknown> | unknown
}) {
  const copy = getPartyCopy(lang)
  const t = TEXT[lang]
  const [values, setValues] = useState<PartyValues>(() => toForm(initial))
  const [showErrors, setShowErrors] = useState(false)
  const [serverIssues, setServerIssues] = useState<PartyIssue[]>([])
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  const formatIssues = useMemo(() => {
    const issues = checkSellerFormat({ ...values, name: values.nameAr })
    if (!values.nameAr?.trim()) issues.unshift({ field: 'name', code: 'REQUIRED' })
    return issues
  }, [values])
  const readiness = useMemo(() => sellerZatcaReadiness({ ...values, name: values.nameAr }), [values])
  const shownIssues = showErrors ? [...formatIssues, ...serverIssues.filter((s) => !formatIssues.some((f) => f.field === s.field))] : serverIssues

  const onChange = (key: PartyFormKey, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setServerIssues((issues) => issues.filter((i) => i.field !== key))
    if (state !== 'saving') setState('idle')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setShowErrors(true)
    if (formatIssues.length) return
    setState('saving')
    try {
      const normalized = normalizePartyInput(values)
      const payload = Object.fromEntries(ALL.map((k) => [k, normalized[k] ?? null])) as BusinessProfileValues
      await onSave(payload)
      setServerIssues([])
      setState('saved')
    } catch (error) {
      const issues = parseProfileError(error instanceof Error ? error.message : undefined)
      setServerIssues(issues)
      setState(issues.length ? 'idle' : 'failed')
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col">
          <FormSection title={t.identityTitle} description={t.identityHint}>
            <PartyFields idPrefix="biz" keys={IDENTITY} values={values} onChange={onChange} issues={shownIssues} copy={copy} />
          </FormSection>
          <FormSection title={copy.addressTitle} description={copy.addressHint}>
            <PartyFields idPrefix="biz" keys={ADDRESS} values={values} onChange={onChange} issues={shownIssues} copy={copy} />
          </FormSection>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" className="qaftr-btn-primary" disabled={state === 'saving'}>
            {state === 'saving' ? t.saving : t.save}
          </Button>
          {state === 'saved' ? (
            <p role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <CheckCircle2Icon className="size-4" aria-hidden />
              {t.saved}
            </p>
          ) : null}
          {state === 'failed' ? (
            <p role="alert" className="text-sm text-destructive">
              {t.failed}
            </p>
          ) : null}
        </div>
      </div>

      <aside
        data-testid="zatca-readiness"
        aria-live="polite"
        className={cn(
          'border-s-2 py-1 ps-4 text-sm lg:sticky lg:top-6',
          readiness.ready ? 'border-primary' : 'border-[var(--qaftr-gold)]',
        )}
      >
        {readiness.ready ? (
          <p className="flex gap-2 font-medium text-foreground">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {t.ready}
          </p>
        ) : (
          <>
            <p className="flex gap-2 font-semibold text-foreground">
              <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-[var(--qaftr-gold)]" aria-hidden />
              {t.missing(readiness.issues.length)}
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1 ps-9 text-muted-foreground">
              {readiness.issues.map((issue) => (
                <li key={issue.field}>{copy.issueLine(issue.field === 'name' ? { ...issue, field: 'nameAr' as never } : issue)}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{t.missingHint}</p>
          </>
        )}
      </aside>
    </form>
  )
}

import { useState } from 'react'
import { CheckCircle2Icon, CircleAlertIcon, ClockIcon, SendIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import type { MarketingLang } from '#/lib/marketing/lang'
import { cn } from '#/lib/utils'

export interface ZatcaInvoiceState {
  zatcaStatus: string
  icv: number | null
  zatcaSubtype: 'standard' | 'simplified' | null
  zatcaLastError: unknown
}

type Tone = 'ok' | 'warn' | 'bad' | 'idle'

const STATUS: Record<string, { ar: string; en: string; tone: Tone }> = {
  not_required: { ar: 'لم تُرسل إلى هيئة الزكاة بعد', en: 'Not sent to ZATCA yet', tone: 'idle' },
  draft: { ar: 'لم تُرسل إلى هيئة الزكاة بعد', en: 'Not sent to ZATCA yet', tone: 'idle' },
  signed: { ar: 'موقّعة وبانتظار الإرسال إلى الهيئة', en: 'Signed, waiting to be reported to ZATCA', tone: 'warn' },
  pending_clearance: { ar: 'موقّعة وبانتظار اعتماد الهيئة', en: 'Signed, waiting for ZATCA clearance', tone: 'warn' },
  reported: { ar: 'أُبلغت بها هيئة الزكاة', en: 'Reported to ZATCA', tone: 'ok' },
  reported_with_warnings: { ar: 'أُبلغت بها الهيئة مع ملاحظات', en: 'Reported to ZATCA with warnings', tone: 'ok' },
  cleared: { ar: 'اعتمدتها هيئة الزكاة', en: 'Cleared by ZATCA', tone: 'ok' },
  cleared_with_warnings: { ar: 'اعتمدتها الهيئة مع ملاحظات', en: 'Cleared by ZATCA with warnings', tone: 'ok' },
  rejected: { ar: 'رفضتها هيئة الزكاة', en: 'Rejected by ZATCA', tone: 'bad' },
  failed: { ar: 'تعذّر الإرسال', en: 'Sending failed', tone: 'bad' },
}

const TEXT = {
  ar: {
    title: 'الفوترة الإلكترونية (المرحلة الثانية)',
    send: 'إرسال إلى هيئة الزكاة',
    sending: 'جارٍ التوقيع والإرسال…',
    retry: 'إعادة الإرسال',
    icv: 'عدّاد الفاتورة',
    standard: 'فاتورة ضريبية (للشركات)',
    simplified: 'فاتورة ضريبية مبسطة',
    sendHint: 'بعد الإرسال لا يمكن تعديل الفاتورة أو حذفها؛ يُصحَّح الخطأ بإشعار دائن.',
    errorCodes: 'رموز الهيئة',
    errors: {
      BUYER_NOT_READY: 'بيانات العميل لفواتير الشركات ناقصة. أكملها من صفحة العملاء.',
      SELLER_NOT_READY: 'ملف المنشأة غير مكتمل للمرحلة الثانية.',
      INVOICE_TOTALS_MISMATCH: 'مجاميع الفاتورة لا تطابق حساب الفاتورة الإلكترونية.',
      EGS_NOT_ONBOARDED: 'اربط منشأتك بهيئة الزكاة أولًا من ملف المنشأة.',
      INVOICE_ALREADY_SIGNED: 'أُرسلت هذه الفاتورة بالفعل.',
      CHAIN_BUSY: 'تُرسَل فاتورة أخرى الآن. حاول بعد لحظات.',
      ZATCA_PRO_REQUIRED: 'يتطلب الإرسال الباقة الاحترافية.',
      generic: 'تعذّر الإرسال. حاول مجددًا.',
    } as Record<string, string>,
  },
  en: {
    title: 'E-invoicing (Phase 2)',
    send: 'Send to ZATCA',
    sending: 'Signing and sending…',
    retry: 'Retry sending',
    icv: 'Invoice counter',
    standard: 'Tax invoice (B2B)',
    simplified: 'Simplified tax invoice',
    sendHint: 'Once sent, the invoice cannot be edited or deleted; correct mistakes with a credit note.',
    errorCodes: 'ZATCA codes',
    errors: {
      BUYER_NOT_READY: 'The client’s B2B details are incomplete. Complete them on the Clients page.',
      SELLER_NOT_READY: 'The business profile is not complete for Phase 2.',
      INVOICE_TOTALS_MISMATCH: 'The invoice totals do not match the e-invoice calculation.',
      EGS_NOT_ONBOARDED: 'Connect your business to ZATCA first, from the business profile.',
      INVOICE_ALREADY_SIGNED: 'This invoice was already sent.',
      CHAIN_BUSY: 'Another invoice is being sent right now. Try again in a moment.',
      ZATCA_PRO_REQUIRED: 'Sending needs the Pro plan.',
      generic: 'Could not send. Please try again.',
    } as Record<string, string>,
  },
}

const TONE: Record<Tone, string> = {
  ok: 'text-primary',
  warn: 'text-amber-700 dark:text-amber-400',
  bad: 'text-destructive',
  idle: 'text-muted-foreground',
}

function errorCodes(e: unknown): string[] {
  if (e && typeof e === 'object' && Array.isArray((e as { codes?: unknown }).codes)) {
    return (e as { codes: unknown[] }).codes.filter((c): c is string => typeof c === 'string')
  }
  return []
}

export function ZatcaInvoicePanel({
  lang,
  invoice,
  connected,
  onIssue,
  onRetry,
}: {
  lang: MarketingLang
  invoice: ZatcaInvoiceState
  /** The business has an active EGS for this deployment's ZATCA environment. */
  connected: boolean
  onIssue: () => Promise<unknown>
  onRetry: () => Promise<unknown>
}) {
  const t = TEXT[lang]
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const unsigned = invoice.zatcaStatus === 'not_required' || invoice.zatcaStatus === 'draft'
  if (unsigned && !connected) return null

  const s = STATUS[invoice.zatcaStatus] ?? STATUS.failed!
  const Icon = s.tone === 'ok' ? CheckCircle2Icon : s.tone === 'warn' ? ClockIcon : s.tone === 'bad' ? CircleAlertIcon : SendIcon
  const retryable = connected && (invoice.zatcaStatus === 'signed' || invoice.zatcaStatus === 'pending_clearance')
  const codes = errorCodes(invoice.zatcaLastError)

  async function run(action: () => Promise<unknown>) {
    setPending(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      setError(t.errors[message] ?? t.errors.generic!)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="rounded-xl border border-border/80 p-4" data-testid="zatca-invoice-panel">
      <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>
      <p className={cn('mt-2 inline-flex items-center gap-1.5 text-sm font-medium', TONE[s.tone])}>
        <Icon className="size-4" aria-hidden />
        {s[lang]}
      </p>
      {invoice.icv ? (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          {invoice.zatcaSubtype ? (
            <>
              <dt className="text-muted-foreground">{lang === 'ar' ? 'النوع' : 'Type'}</dt>
              <dd>{invoice.zatcaSubtype === 'standard' ? t.standard : t.simplified}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">{t.icv}</dt>
          <dd dir="ltr" className="text-start font-mono">
            {invoice.icv}
          </dd>
        </dl>
      ) : null}
      {codes.length ? (
        <p className="mt-2 text-xs text-destructive">
          {t.errorCodes}: <span dir="ltr">{codes.join(', ')}</span>
        </p>
      ) : null}
      {unsigned ? <p className="mt-2 text-xs text-muted-foreground">{t.sendHint}</p> : null}
      {unsigned || retryable ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" className="gap-1.5" disabled={pending} onClick={() => void run(unsigned ? onIssue : onRetry)}>
            <SendIcon className="size-3.5" aria-hidden />
            {pending ? t.sending : unsigned ? t.send : t.retry}
          </Button>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

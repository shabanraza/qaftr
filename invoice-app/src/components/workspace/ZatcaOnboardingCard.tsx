import { useState } from 'react'
import { CheckCircle2Icon, FlaskConicalIcon, PlugZapIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Field, FieldDescription, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import type { MarketingLang } from '#/lib/marketing/lang'

export interface ZatcaOnboardingStatus {
  env: 'sandbox' | 'simulation' | 'production' | null
  gate: 'ZATCA_DISABLED' | 'ZATCA_PRO_REQUIRED' | null
  hasBusiness: boolean
  sellerReady: boolean
  sandboxOtp: string | null
  unit: {
    id: string
    status: string
    commonName: string
    egsSerial: string
    certNotAfter: Date | null
    createdAt: Date
  } | null
}

export interface OnboardValues {
  industry: string
  branchName?: string
  otp?: string
}

const TEXT = {
  ar: {
    title: 'الربط مع هيئة الزكاة (المرحلة الثانية)',
    hint: 'نُسجّل جهاز فوترة (EGS) باسم منشأتك لدى هيئة الزكاة والضريبة والجمارك، ثم توقَّع فواتيرك وتُرسَل تلقائيًا.',
    sandbox: 'بيئة الاختبار لدى هيئة الزكاة: لا تُرسَل فواتير حقيقية، ونستخدم رمز التحقق التجريبي.',
    simulation: 'بيئة المحاكاة لدى هيئة الزكاة: استخدم رمز تحقق من بوابة فاتورة للمحاكاة.',
    notReady: 'أكمل ملف المنشأة أعلاه (الرقم الضريبي، السجل التجاري والعنوان الوطني) قبل الربط.',
    noBusiness: 'احفظ ملف المنشأة أولًا.',
    pro: 'الربط مع هيئة الزكاة في البيئة الفعلية يتطلب الباقة الاحترافية.',
    industry: 'النشاط التجاري',
    industryHint: 'مثال: تجارة التجزئة، الاستشارات، المقاولات.',
    branch: 'اسم الفرع (اختياري)',
    branchHint: 'يظهر في شهادة الجهاز. الافتراضي: المركز الرئيسي.',
    otp: 'رمز التحقق (OTP) من بوابة فاتورة',
    otpHint: 'من fatoora.zatca.gov.sa ← تسجيل جهاز جديد. صالح لمدة ساعة.',
    otpInvalid: 'رمز التحقق 6 أرقام.',
    industryRequired: 'اكتب النشاط التجاري.',
    submit: 'الربط مع هيئة الزكاة',
    pending: 'جارٍ الربط… قد يستغرق دقيقة',
    connected: 'متصل بهيئة الزكاة',
    device: 'اسم الجهاز',
    validUntil: 'الشهادة صالحة حتى',
    expiring: (d: number) => `تنتهي شهادة الجهاز خلال ${d} يومًا. جدّدها برمز تحقق جديد من بوابة فاتورة قبل انتهائها حتى لا يتوقف الإرسال.`,
    expired: 'انتهت شهادة الجهاز. لا يمكن إرسال الفواتير حتى تجديدها.',
    errors: {
      SELLER_NOT_READY: 'ملف المنشأة غير مكتمل للمرحلة الثانية.',
      OTP_INVALID: 'رمز التحقق 6 أرقام.',
      OTP_REJECTED: 'رمز التحقق غير صحيح أو منتهي. أنشئ رمزًا جديدًا من بوابة فاتورة.',
      CSR_REJECTED: 'رفضت الهيئة طلب الشهادة. راجع بيانات المنشأة ثم حاول مجددًا.',
      COMPLIANCE_CHECK_FAILED: 'لم تجتز فواتير الاختبار فحص الهيئة. راجع بيانات المنشأة ثم حاول مجددًا.',
      PRODUCTION_CSID_FAILED: 'تعذّر إصدار شهادة الإنتاج. حاول مجددًا بعد قليل.',
      ZATCA_UNAVAILABLE: 'خدمة هيئة الزكاة غير متاحة الآن. حاول بعد قليل.',
      EGS_ALREADY_ACTIVE: 'منشأتك مربوطة بالفعل.',
      ZATCA_PRO_REQUIRED: 'يتطلب الربط الباقة الاحترافية.',
      generic: 'تعذّر الربط. حاول مجددًا.',
    } as Record<string, string>,
  },
  en: {
    title: 'Connect to ZATCA (Phase 2)',
    hint: 'We register an e-invoicing device (EGS) for your business with ZATCA, then your invoices are signed and sent automatically.',
    sandbox: 'ZATCA test environment: no real invoices are sent, and the test OTP is used for you.',
    simulation: 'ZATCA simulation environment: use an OTP from the Fatoora simulation portal.',
    notReady: 'Complete the business profile above (VAT number, CR number and national address) before connecting.',
    noBusiness: 'Save the business profile first.',
    pro: 'Connecting to ZATCA for real invoices needs the Pro plan.',
    industry: 'Business activity',
    industryHint: 'For example: retail, consulting, contracting.',
    branch: 'Branch name (optional)',
    branchHint: 'Shown on the device certificate. Defaults to Head Office.',
    otp: 'One-time password (OTP) from the Fatoora portal',
    otpHint: 'fatoora.zatca.gov.sa → Onboard new solution unit/device. Valid for one hour.',
    otpInvalid: 'The OTP is 6 digits.',
    industryRequired: 'Enter your business activity.',
    submit: 'Connect to ZATCA',
    pending: 'Connecting… this can take a minute',
    connected: 'Connected to ZATCA',
    device: 'Device name',
    validUntil: 'Certificate valid until',
    expiring: (d: number) => `The device certificate expires in ${d} days. Renew it with a new Fatoora OTP before then so sending does not stop.`,
    expired: 'The device certificate has expired. Invoices cannot be sent until it is renewed.',
    errors: {
      SELLER_NOT_READY: 'The business profile is not complete for Phase 2.',
      OTP_INVALID: 'The OTP is 6 digits.',
      OTP_REJECTED: 'The OTP is wrong or expired. Generate a new one in the Fatoora portal.',
      CSR_REJECTED: 'ZATCA rejected the certificate request. Check the business details and try again.',
      COMPLIANCE_CHECK_FAILED: 'The test invoices did not pass ZATCA’s checks. Check the business details and try again.',
      PRODUCTION_CSID_FAILED: 'ZATCA could not issue the production certificate. Try again shortly.',
      ZATCA_UNAVAILABLE: 'ZATCA is not reachable right now. Try again shortly.',
      EGS_ALREADY_ACTIVE: 'Your business is already connected.',
      ZATCA_PRO_REQUIRED: 'Connecting needs the Pro plan.',
      generic: 'Could not connect. Please try again.',
    } as Record<string, string>,
  },
}

const toLatinDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/\s/g, '')

export function ZatcaOnboardingCard({
  lang,
  status,
  onOnboard,
}: {
  lang: MarketingLang
  status: ZatcaOnboardingStatus
  onOnboard: (values: OnboardValues) => Promise<unknown>
}) {
  const t = TEXT[lang]
  const [industry, setIndustry] = useState('')
  const [branchName, setBranchName] = useState('')
  const [otp, setOtp] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ industry?: string; otp?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!status.env || status.gate === 'ZATCA_DISABLED') return null
  const needsOtp = !status.sandboxOtp
  const dateFmt = (d: Date) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof fieldErrors = {}
    if (!industry.trim()) errs.industry = t.industryRequired
    const code = toLatinDigits(otp)
    if (needsOtp && !/^\d{6}$/.test(code)) errs.otp = t.otpInvalid
    setFieldErrors(errs)
    setServerError(null)
    if (Object.keys(errs).length) return
    const values: OnboardValues = { industry: industry.trim() }
    if (branchName.trim()) values.branchName = branchName.trim()
    if (needsOtp) values.otp = code
    setPending(true)
    try {
      await onOnboard(values)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setServerError(t.errors[message] ?? t.errors.generic!)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="py-0 shadow-none" data-testid="zatca-onboarding">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlugZapIcon className="size-4 text-primary" aria-hidden />
          {t.title}
        </CardTitle>
        <CardDescription>{t.hint}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        {status.env !== 'production' ? (
          <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <FlaskConicalIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {status.env === 'sandbox' ? t.sandbox : t.simulation}
          </p>
        ) : null}

        {status.unit ? (
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <CheckCircle2Icon className="size-4" aria-hidden />
              {t.connected}
            </p>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-muted-foreground">{t.device}</dt>
              <dd dir="ltr" className="text-start font-mono text-xs leading-5">
                {status.unit.commonName}
              </dd>
              {status.unit.certNotAfter ? (
                <>
                  <dt className="text-muted-foreground">{t.validUntil}</dt>
                  <dd>{dateFmt(status.unit.certNotAfter)}</dd>
                </>
              ) : null}
            </dl>
            {(() => {
              if (!status.unit.certNotAfter) return null
              const days = Math.ceil((new Date(status.unit.certNotAfter).getTime() - Date.now()) / 86_400_000)
              if (days > 30) return null
              return (
                <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
                  {days <= 0 ? t.expired : t.expiring(days)}
                </p>
              )
            })()}
          </div>
        ) : status.gate === 'ZATCA_PRO_REQUIRED' ? (
          <p className="text-sm text-muted-foreground">{t.pro}</p>
        ) : (
          <form className="space-y-4" onSubmit={submit} noValidate>
            {!status.hasBusiness || !status.sellerReady ? (
              <p className="text-sm text-muted-foreground">{status.hasBusiness ? t.notReady : t.noBusiness}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(fieldErrors.industry)}>
                <FieldLabel htmlFor="zatca-industry">{t.industry}</FieldLabel>
                <Input
                  id="zatca-industry"
                  value={industry}
                  maxLength={100}
                  aria-invalid={Boolean(fieldErrors.industry)}
                  onChange={(e) => setIndustry(e.target.value)}
                />
                {fieldErrors.industry ? <FieldError>{fieldErrors.industry}</FieldError> : <FieldDescription>{t.industryHint}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="zatca-branch">{t.branch}</FieldLabel>
                <Input id="zatca-branch" value={branchName} maxLength={100} onChange={(e) => setBranchName(e.target.value)} />
                <FieldDescription>{t.branchHint}</FieldDescription>
              </Field>
              {needsOtp ? (
                <Field data-invalid={Boolean(fieldErrors.otp)}>
                  <FieldLabel htmlFor="zatca-otp">{t.otp}</FieldLabel>
                  <Input
                    id="zatca-otp"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    maxLength={12}
                    aria-invalid={Boolean(fieldErrors.otp)}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  {fieldErrors.otp ? <FieldError>{fieldErrors.otp}</FieldError> : <FieldDescription>{t.otpHint}</FieldDescription>}
                </Field>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending || !status.hasBusiness || !status.sellerReady}>
                {pending ? t.pending : t.submit}
              </Button>
              {serverError ? (
                <p role="alert" className="text-sm text-destructive">
                  {serverError}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

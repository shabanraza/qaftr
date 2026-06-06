import { createFileRoute } from '@tanstack/react-router'
import {
  Check,
  FileText,
  MessageCircle,
  QrCode,
  Sparkles,
  Users,
} from 'lucide-react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { t, seoCopy } from '#/lib/marketing/i18n'
import { buildMarketingHead } from '#/lib/marketing/seo'
import { BRAND } from '#/lib/marketing/constants'

const featureIcons = [QrCode, Users, MessageCircle, Sparkles, FileText, Check]

export const Route = createFileRoute('/')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const seo = seoCopy(lang).home
    return buildMarketingHead({ ...seo, path: '/', lang })
  },
  component: HomePage,
})

function HomePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = t(lang).home

  return (
    <MarketingLayout lang={lang}>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-8 pt-12 md:grid-cols-2 md:px-8 md:pt-20">
        <div className="qaftr-rise order-2 md:order-1">
          <p
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E4EBE7] bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-[#0A3D2E]"
            style={{ animationDelay: '0ms' }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: BRAND.gold }}
            />
            {copy.kicker}
          </p>
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-4xl font-bold leading-[1.15] tracking-tight text-[#0E1C16] md:text-5xl lg:text-[3.25rem]">
            {copy.title}
            <span className="mt-1 block text-[#0A3D2E]">{copy.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-[#3E5A4A] md:text-lg">
            {copy.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#0A3D2E]/10 px-3 py-1 text-xs font-bold text-[#0A3D2E]">
              {copy.badgeZatca}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold text-[#0A3D2E]"
              style={{ backgroundColor: `${BRAND.gold}22` }}
            >
              {copy.badgeFreelancer}
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <span
              className="inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-md"
              style={{ backgroundColor: BRAND.green }}
            >
              {t(lang).cta.comingSoon}
            </span>
          </div>
        </div>

        <div className="qaftr-rise order-1 md:order-2" style={{ animationDelay: '120ms' }}>
          <InvoicePreview lang={lang} />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="mb-10 text-center md:text-start">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-[#0E1C16] md:text-3xl">
            {copy.featuresTitle}
          </h2>
          <div
            className="mx-auto mt-3 h-1 w-16 rounded-full md:mx-0"
            style={{ backgroundColor: BRAND.gold }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.features.map((feature, i) => {
            const Icon = featureIcons[i] ?? Check
            return (
              <article
                key={feature.title}
                className="qaftr-card group rounded-2xl border border-[#E4EBE7] bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <div
                  className="mb-4 flex size-11 items-center justify-center rounded-xl text-[#0A3D2E]"
                  style={{ backgroundColor: `${BRAND.green}12` }}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-[#0A3D2E]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3E5A4A]">{feature.body}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <h2 className="mb-10 text-center font-[family-name:var(--font-qaftr-display)] text-2xl font-bold md:text-3xl">
          {copy.howTitle}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {copy.steps.map((step) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-[#E4EBE7] bg-white/80 p-6 text-center md:text-start"
            >
              <span
                className="mb-3 inline-flex size-10 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: BRAND.gold }}
              >
                {step.num}
              </span>
              <h3 className="text-lg font-bold text-[#0A3D2E]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#3E5A4A]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold md:text-3xl">
            {copy.pricingTitle}
          </h2>
          <p className="mt-3 text-[#3E5A4A]">{copy.pricingSubtitle}</p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          <PricingCard
            name={copy.free.name}
            price={copy.free.price}
            period={copy.free.period}
            features={copy.free.features}
            highlighted={false}
          />
          <PricingCard
            name={copy.pro.name}
            price={copy.pro.priceMonthly}
            period={lang === 'ar' ? 'ر.س / شهر' : 'SAR / month'}
            yearly={
              lang === 'ar'
                ? `أو ${copy.pro.priceYearly} ر.س / سنة`
                : `or ${copy.pro.priceYearly} SAR / year`
            }
            badge={copy.pro.badge}
            features={copy.pro.features}
            highlighted
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <div
          className="rounded-3xl px-8 py-12 text-center text-white md:px-12"
          style={{ backgroundColor: BRAND.green }}
        >
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold md:text-3xl">
            {copy.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[#A8D5BC]">{copy.ctaBody}</p>
          <span
            className="mt-8 inline-flex rounded-full px-8 py-3 text-sm font-bold"
            style={{ backgroundColor: BRAND.gold, color: BRAND.ink }}
          >
            {t(lang).cta.comingSoon}
          </span>
        </div>
      </section>
    </MarketingLayout>
  )
}

function PricingCard({
  name,
  price,
  period,
  yearly,
  badge,
  features,
  highlighted,
  lang,
}: {
  name: string
  price: string
  period: string
  yearly?: string
  badge?: string
  features: string[]
  highlighted: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        highlighted
          ? 'border-[#C8973A] bg-[#0A3D2E] text-white shadow-xl'
          : 'border-[#E4EBE7] bg-white'
      }`}
    >
      {badge && (
        <span
          className="absolute -top-3 start-6 rounded-full px-3 py-0.5 text-xs font-bold"
          style={{ backgroundColor: BRAND.gold, color: BRAND.ink }}
        >
          {badge}
        </span>
      )}
      <p className={`text-sm font-semibold ${highlighted ? 'text-[#A8D5BC]' : 'text-[#3E5A4A]'}`}>
        {name}
      </p>
      <p className="mt-3 text-4xl font-extrabold">{price}</p>
      <p className={`text-sm ${highlighted ? 'text-[#A8D5BC]' : 'text-[#3E5A4A]'}`}>{period}</p>
      {yearly && (
        <p className={`mt-1 text-sm ${highlighted ? 'text-[#A8D5BC]' : 'text-[#8AA396]'}`}>
          {yearly}
        </p>
      )}
      <ul className="mt-6 flex flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check
              className={`mt-0.5 size-4 shrink-0 ${highlighted ? 'text-[#C8973A]' : 'text-[#0A3D2E]'}`}
              aria-hidden
            />
            <span className={highlighted ? 'text-white/90' : 'text-[#3E5A4A]'}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function InvoicePreview({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar'
  return (
    <div
      className="relative mx-auto max-w-sm rotate-1 rounded-2xl border border-[#E4EBE7] bg-white p-6 shadow-2xl transition-transform hover:rotate-0 md:max-w-md"
      aria-hidden
    >
      <div className="mb-4 flex items-center justify-between border-b border-[#E4EBE7] pb-4">
        <div>
          <p className="text-xs font-semibold text-[#8AA396]">
            {isAr ? 'فاتورة ضريبية' : 'Tax Invoice'}
          </p>
          <p className="font-bold text-[#0A3D2E]">{isAr ? 'قافتر للتصميم' : 'Qaftr Design'}</p>
        </div>
        <div
          className="flex size-12 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: BRAND.green }}
        >
          QR
        </div>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-[#3E5A4A]">
          <span>{isAr ? 'تصميم شعار' : 'Logo design'}</span>
          <span className="font-semibold text-[#0E1C16]">1,500</span>
        </div>
        <div className="flex justify-between text-[#3E5A4A]">
          <span>{isAr ? 'ضريبة 15٪' : 'VAT 15%'}</span>
          <span className="font-semibold text-[#0E1C16]">225</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-[#E4EBE7] pt-3 font-bold text-[#0A3D2E]">
          <span>{isAr ? 'الإجمالي' : 'Total'}</span>
          <span>1,725 {isAr ? 'ر.س' : 'SAR'}</span>
        </div>
      </div>
      <div
        className="absolute -bottom-3 -end-3 rounded-full px-3 py-1 text-[10px] font-bold text-white shadow-lg"
        style={{ backgroundColor: BRAND.gold }}
      >
        ZATCA Phase 1
      </div>
    </div>
  )
}

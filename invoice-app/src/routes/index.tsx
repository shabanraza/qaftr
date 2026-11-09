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
import { InstantInvoiceTool } from '#/components/instant-invoice/InstantInvoiceTool'
import { getInstantInvoiceCopy } from '#/lib/instant-invoice/copy'
import { cn } from '#/lib/utils'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'

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
  const toolCopy = getInstantInvoiceCopy(lang)

  return (
    <MarketingLayout lang={lang} deadline>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:px-8 md:pt-16 lg:gap-14">
        <div className="qaftr-rise">
          <Badge
            variant="outline"
            className="mb-4 gap-2 border-border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-primary"
          >
            <span className="size-1.5 rounded-full bg-secondary" />
            {copy.kicker}
          </Badge>
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-[2rem] font-bold leading-[1.25] tracking-tight text-balance text-foreground sm:text-4xl lg:text-[2.75rem] xl:text-5xl">
            {copy.title}
            <span className="mt-1 block text-primary">{copy.titleAccent}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            {copy.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {copy.badgeZatca}
            </Badge>
            <Badge variant="outline" className="border-secondary/30 bg-accent text-primary">
              {copy.badgeAudience}
            </Badge>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="qaftr-btn-primary shadow-md">
              <a href="#invoice-tool" className="no-underline">
                {toolCopy.heroCta}
              </a>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t(lang).cta.noCardNote}</p>
        </div>

        <div className="qaftr-rise hidden md:block" style={{ animationDelay: '120ms' }}>
          <InvoicePreview lang={lang} />
        </div>
      </section>

      <InstantInvoiceTool lang={lang} />

      <section id="features" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="mb-10 text-center md:text-start">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground md:text-3xl">
            {copy.featuresTitle}
          </h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-secondary md:mx-0" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.features.map((feature, i) => {
            const Icon = featureIcons[i] ?? Check
            return (
              <Card
                key={feature.title}
                className="qaftr-card gap-3 py-6 transition-transform hover:-translate-y-0.5"
              >
                <CardHeader className="px-6 pb-0">
                  <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon strokeWidth={1.75} aria-hidden />
                  </div>
                  <CardTitle className="text-lg text-primary">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </CardContent>
              </Card>
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
            <Card key={step.title} className="gap-3 py-6 text-center md:text-start">
              <CardHeader className="items-center px-6 pb-0 md:items-start">
                <span className="mb-1 inline-flex size-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                  {step.num}
                </span>
                <CardTitle className="text-lg text-primary">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold md:text-3xl">
            {copy.pricingTitle}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {copy.pricingSubtitle}
          </p>
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
            period={copy.pro.period}
            yearly={copy.pro.yearly(copy.pro.priceYearly)}
            badge={copy.pro.badge}
            features={copy.pro.features}
            highlighted
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        <Card className="rounded-3xl border-primary bg-primary px-8 py-12 text-center text-primary-foreground md:px-12">
          <CardHeader className="px-0">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-2xl md:text-3xl">
              {copy.ctaTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="mx-auto max-w-md text-primary-foreground/70">{copy.ctaBody}</p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="mt-8 px-8 text-primary"
            >
              <a href="#invoice-tool" className="no-underline">
                {t(lang).cta.createInvoice}
              </a>
            </Button>
            <p className="mt-3 text-sm text-primary-foreground/70">{t(lang).cta.noCard}</p>
          </CardContent>
        </Card>
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
    <Card
      className={cn(
        'relative gap-4 py-8',
        highlighted && 'border-secondary bg-primary text-primary-foreground shadow-xl',
      )}
    >
      {badge ? (
        <Badge variant="secondary" className="absolute -top-3 start-6">
          {badge}
        </Badge>
      ) : null}
      <CardHeader className="px-8 pb-0">
        <p className={cn('text-sm font-semibold', highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {name}
        </p>
        <p className="mt-3 text-4xl font-extrabold">{price}</p>
        <p className={cn('text-sm', highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {period}
        </p>
        {yearly ? (
          <p className={cn('mt-1 text-sm', highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
            {yearly}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="px-8">
        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check
                className={cn(
                  'mt-0.5 shrink-0',
                  highlighted ? 'text-secondary' : 'text-primary',
                )}
                aria-hidden
              />
              <span className={highlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'}>
                {f}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function InvoicePreview({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar'
  return (
    <Card
      className="relative mx-auto max-w-sm rotate-1 py-6 shadow-2xl transition-transform hover:rotate-0 md:max-w-md"
      aria-hidden
    >
      <CardHeader className="px-6 pb-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {isAr ? 'فاتورة ضريبية' : 'Tax Invoice'}
            </p>
            <CardTitle className="text-base text-primary">
              {isAr ? 'مؤسسة قافتر التجارية' : 'Qaftr Trading Est.'}
            </CardTitle>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            QR
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-6 text-sm">
        <p className="text-xs text-muted-foreground">
          {isAr ? 'المشتري: شركة الأفق للمقاولات' : 'Buyer: Horizon Contracting Co.'}
        </p>
        <Separator />
        <div className="flex justify-between text-muted-foreground">
          <span>{isAr ? 'توريد وتركيب' : 'Supply & installation'}</span>
          <span className="font-semibold text-foreground">{isAr ? '١٬٥٠٠' : '1,500'}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>{isAr ? 'ضريبة القيمة المضافة ١٥٪' : 'VAT 15%'}</span>
          <span className="font-semibold text-foreground">{isAr ? '٢٢٥' : '225'}</span>
        </div>
        <Separator />
        <div className="flex justify-between pt-1 font-bold text-primary">
          <span>{isAr ? 'الإجمالي شامل الضريبة' : 'Total incl. VAT'}</span>
          <span>{isAr ? '١٬٧٢٥ ر.س' : '1,725 SAR'}</span>
        </div>
      </CardContent>
      <Badge variant="secondary" className="absolute -bottom-3 -end-3 shadow-lg">
        {t(lang).home.badgeZatca}
      </Badge>
    </Card>
  )
}

import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  FileSpreadsheet,
  FileText,
  Languages,
  MessageCircle,
  Percent,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { AccountCta } from '#/components/marketing/AccountCta'
import { ComparisonTable } from '#/components/marketing/ComparisonTable'
import { ToolFaqSection, buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { t, seoCopy } from '#/lib/marketing/i18n'
import { getHomeContent } from '#/lib/marketing/home-content'
import type { BentoTile, ResourceItem } from '#/lib/marketing/home-content'
import { buildJsonLdScript, buildMarketingHead } from '#/lib/marketing/seo'
import { InstantInvoiceTool } from '#/components/instant-invoice/InstantInvoiceTool'
import { AuthGateDialog } from '#/components/instant-invoice/AuthGateDialog'
import { getInstantInvoiceCopy } from '#/lib/instant-invoice/copy'
import { cn } from '#/lib/utils'
import { authClient } from '#/lib/auth-client'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

const tileIcons: Record<string, typeof Check> = {
  'qr-pdf-whatsapp': QrCode,
  arabic: Languages,
  vat: Percent,
  notes: ReceiptText,
  phase2: ShieldCheck,
  accountant: FileSpreadsheet,
  tools: Wrench,
}

export const Route = createFileRoute('/')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    const seo = seoCopy(lang).home
    return {
      ...buildMarketingHead({ ...seo, path: '/', lang }),
      scripts: [buildJsonLdScript(buildFaqSchema(getHomeContent(lang).faq))],
    }
  },
  component: HomePage,
})

function HomePage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const copy = t(lang).home
  const home = getHomeContent(lang)
  const toolCopy = getInstantInvoiceCopy(lang)
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const [signupOpen, setSignupOpen] = useState(false)
  // Account pitches (no-account notes, demo hint) are for signed-out visitors only.
  const signedIn = Boolean(authClient.useSession().data?.user)

  return (
    <MarketingLayout lang={lang} deadline>
      {/* 1. Hero + live demo */}
      <section className="mx-auto max-w-4xl px-5 pb-8 pt-10 text-center md:px-8 md:pt-16">
        <div className="qaftr-rise">
          <Badge
            variant="outline"
            className="mb-4 gap-2 border-border bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-primary"
          >
            <span className="size-1.5 rounded-full bg-secondary" />
            {copy.kicker}
          </Badge>
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-[2rem] font-bold leading-[1.25] tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
            {copy.title}
            <span className="mt-1 block text-primary">{copy.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {copy.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="qaftr-btn-primary shadow-md">
              <Link to="/" search={search} hash="invoice-tool" data-cta="#invoice-tool">
                {toolCopy.heroCta}
                <ArrowRight className="size-4 rotate-90" aria-hidden />
              </Link>
            </Button>
            <AccountCta
              lang={lang}
              label={home.demo.secondaryCta}
              onSignUp={() => setSignupOpen(true)}
              size="lg"
              variant="outline"
              data-cta="hero_signup"
            />
          </div>
          {signedIn ? null : <p className="mt-3 text-sm text-muted-foreground">{t(lang).cta.noCardNote}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {copy.badgeZatca}
            </Badge>
            <Badge variant="outline" className="border-secondary/30 bg-accent text-primary">
              {copy.badgeAudience}
            </Badge>
          </div>
        </div>
      </section>

      <div className="qaftr-rise mx-auto max-w-6xl px-3 md:px-6" style={{ animationDelay: '120ms' }}>
        <div className="overflow-hidden rounded-3xl border border-border bg-muted/30 shadow-xl">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-card px-5 py-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--qaftr-gold)] opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--qaftr-gold)]" />
              </span>
              {signedIn ? home.demo.signedInLabel : home.demo.label}
            </span>
            <span className="text-xs text-muted-foreground">{signedIn ? home.demo.signedInHint : home.demo.hint}</span>
          </div>
          <div className="pt-4">
            <InstantInvoiceTool lang={lang} showIntro={false} />
          </div>
        </div>
      </div>

      {/* 2. Bento grid */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 md:px-8">
        <SectionHeading title={home.bentoTitle} subtitle={home.bentoSubtitle} />
        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-[auto_auto_auto]">
          {home.bento.map((tile) => (
            <BentoCard key={tile.id} tile={tile} lang={lang} />
          ))}
        </div>
      </section>

      {/* 3. How it works */}
      <section className="mx-auto max-w-6xl px-5 pt-20 md:px-8">
        <SectionHeading title={copy.howTitle} />
        <ol className="grid gap-6 md:grid-cols-3">
          {copy.steps.map((step) => (
            <li key={step.title} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
                {step.num}
              </span>
              <p className="text-lg font-semibold text-primary">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Comparison */}
      <section id="compare" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 md:px-8">
        <ComparisonTable lang={lang} />
        <Link
          to="/e-invoicing-software-comparison-saudi-arabia"
          search={search}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary no-underline hover:underline"
        >
          {home.comparisonCta}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
      </section>

      {/* 5. Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 md:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold md:text-3xl">
            {copy.pricingTitle}
          </h2>
          <p className="mt-3 text-muted-foreground">{copy.pricingSubtitle}</p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          <PricingCard
            name={copy.free.name}
            price={copy.free.price}
            period={copy.free.period}
            features={copy.free.features}
            highlighted={false}
            cta={
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link to="/" search={search} hash="invoice-tool" data-cta="pricing_free">
                  {toolCopy.heroCta}
                </Link>
              </Button>
            }
          />
          <PricingCard
            name={copy.pro.name}
            price={copy.pro.priceMonthly}
            period={copy.pro.period}
            yearly={copy.pro.yearly(copy.pro.priceYearly)}
            badge={copy.pro.badge}
            features={copy.pro.features}
            highlighted
            cta={
              <AccountCta
                lang={lang}
                label={lang === 'ar' ? 'إنشاء حساب' : 'Create account'}
                onSignUp={() => setSignupOpen(true)}
                size="lg"
                variant="secondary"
                className="w-full text-primary"
                data-cta="pricing_pro"
              />
            }
          />
        </div>
      </section>

      {/* 6. Guides and tools */}
      <section id="resources" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-20 md:px-8">
        <SectionHeading title={home.resources.title} subtitle={home.resources.subtitle} />
        <div className="grid gap-4 md:grid-cols-3">
          {(['guides', 'solutions', 'tools'] as const).map((group) => (
            <ResourceColumn
              key={group}
              title={home.groups[group]}
              icon={group === 'guides' ? BookOpen : group === 'tools' ? Wrench : FileText}
              items={home.resources.items.filter((i) => i.group === group)}
              lang={lang}
            />
          ))}
        </div>
      </section>

      {/* 7. FAQ (FAQPage JSON-LD in head) */}
      <div className="pt-8">
        <ToolFaqSection title={home.faqTitle} items={home.faq} />
      </div>

      {/* 8. Final CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-4 md:px-8">
        <Card className="rounded-3xl border-primary bg-primary px-8 py-12 text-center text-primary-foreground md:px-12">
          <CardHeader className="px-0">
            <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-2xl md:text-3xl">
              {copy.ctaTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <p className="mx-auto max-w-md text-primary-foreground/70">{copy.ctaBody}</p>
            <Button asChild size="lg" variant="secondary" className="mt-8 px-8 text-primary">
              <Link to="/" search={search} hash="invoice-tool" data-cta="#invoice-tool">
                {t(lang).cta.createInvoice}
              </Link>
            </Button>
            {signedIn ? null : <p className="mt-3 text-sm text-primary-foreground/70">{t(lang).cta.noCard}</p>}
          </CardContent>
        </Card>
      </section>
      <AuthGateDialog
        lang={lang}
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSuccess={() => setSignupOpen(false)}
        initialMode="signup"
        context="general"
      />
    </MarketingLayout>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground md:text-3xl">
        {title}
      </h2>
      <div className="mt-3 h-1 w-16 rounded-full bg-secondary" />
      {subtitle ? <p className="mt-4 text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

const tileSpan: Record<BentoTile['size'], string> = {
  lg: 'md:col-span-2 md:row-span-2',
  md: 'md:col-span-1',
  sm: 'md:col-span-2',
}

function BentoCard({ tile, lang }: { tile: BentoTile; lang: MarketingLang }) {
  const Icon = tileIcons[tile.id] ?? Check
  const isLarge = tile.size === 'lg'
  const isBeta = tile.id === 'phase2'
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-transform hover:-translate-y-0.5',
        tileSpan[tile.size],
        isLarge ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
        isBeta && 'border-[var(--qaftr-gold)]/50 bg-[var(--qaftr-gold)]/10',
      )}
    >
      <div
        className={cn(
          'mb-4 flex size-11 items-center justify-center rounded-xl',
          isLarge ? 'bg-primary-foreground/10 text-secondary' : 'bg-accent text-primary',
        )}
      >
        <Icon strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className={cn('font-semibold', isLarge ? 'text-2xl font-[family-name:var(--font-qaftr-display)]' : 'text-lg text-primary')}>
        {tile.title}
      </h3>
      <p className={cn('mt-2 text-sm leading-relaxed', isLarge ? 'text-primary-foreground/80 md:text-base' : 'text-muted-foreground')}>
        {tile.body}
      </p>
      {isLarge ? <InvoiceArtifacts lang={lang} /> : null}
      {tile.href ? (
        <Link
          to={tile.href as '/tools'}
          search={lang === 'en' ? { lang: 'en' } : {}}
          className={cn(
            'mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold no-underline hover:underline',
            isLarge ? 'text-secondary' : 'text-primary',
          )}
        >
          {tile.linkLabel}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
      ) : null}
    </div>
  )
}

/** Three output chips on the large tile: what the user walks away with. */
function InvoiceArtifacts({ lang }: { lang: MarketingLang }) {
  const items = [
    { icon: QrCode, label: lang === 'ar' ? 'رمز QR' : 'QR code' },
    { icon: FileText, label: 'PDF' },
    { icon: MessageCircle, label: lang === 'ar' ? 'واتساب' : 'WhatsApp' },
  ]
  return (
    <ul className="mt-6 grid grid-cols-3 gap-3" aria-hidden>
      {items.map(({ icon: ItemIcon, label }) => (
        <li
          key={label}
          className="flex flex-col items-center gap-2 rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 px-2 py-4 text-xs font-semibold"
        >
          <ItemIcon className="size-7 text-secondary" strokeWidth={1.5} />
          {label}
        </li>
      ))}
    </ul>
  )
}

function ResourceColumn({
  title,
  icon: Icon,
  items,
  lang,
}: {
  title: string
  icon: typeof Check
  items: ResourceItem[]
  lang: MarketingLang
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="mb-4 flex items-center gap-2 font-semibold text-foreground">
        <Icon className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
        {title}
      </p>
      <ul className="flex flex-col gap-2.5 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href as '/tools'}
              search={lang === 'en' ? { lang: 'en' } : {}}
              className="text-muted-foreground no-underline hover:text-primary hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
  cta,
}: {
  name: string
  price: string
  period: string
  yearly?: string
  badge?: string
  features: string[]
  highlighted: boolean
  cta: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        'relative gap-6 py-8',
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
                className={cn('mt-0.5 shrink-0', highlighted ? 'text-secondary' : 'text-primary')}
                aria-hidden
              />
              <span className={highlighted ? 'text-primary-foreground/90' : 'text-muted-foreground'}>
                {f}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="mt-auto px-8">{cta}</div>
    </Card>
  )
}

import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpenIcon,
  CalculatorIcon,
  CalendarClockIcon,
  ReceiptTextIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { UAE_EINVOICING_MILESTONES } from '@zatca/shared'
import { getAeCopy } from '#/lib/ae/copy'
import { formatAeDate, langSearch } from '#/lib/ae/format'
import { AE_HUB_CARD_IDS, AE_PAGE_PATHS } from '#/lib/ae/pages'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Badge } from '#/components/ui/badge'
import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

const CARD_ICONS = {
  'e-invoicing-readiness': CalendarClockIcon,
  'invoice-generator': ReceiptTextIcon,
  'trn-checker': ShieldCheckIcon,
  'vat-calculator': CalculatorIcon,
  guide: BookOpenIcon,
} as const

type AeHubContentProps = {
  lang: MarketingLang
}

export function AeHubContent({ lang }: AeHubContentProps) {
  const copy = getAeCopy(lang)
  const hub = copy.hub
  const dir = langDir(lang)
  const search = langSearch(lang)

  return (
    <div dir={dir} lang={lang}>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(200,151,58,0.22),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(10,61,46,0.10),transparent_50%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-12 md:px-8 md:pb-16 md:pt-20">
          <Badge
            variant="outline"
            className="mb-5 border-secondary/50 bg-accent text-primary"
          >
            {hub.eyebrow}
          </Badge>
          <h1 className="max-w-4xl font-[family-name:var(--font-qaftr-display)] text-[2rem] font-bold leading-[1.25] text-balance text-foreground sm:text-4xl lg:text-5xl">
            {hub.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {hub.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="qaftr-btn-primary">
              <Link
                to={AE_PAGE_PATHS['e-invoicing-readiness']}
                search={search}
                className="no-underline"
              >
                {hub.primaryCta}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link
                to={AE_PAGE_PATHS.guide}
                search={search}
                className="no-underline"
              >
                {hub.secondaryCta}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
        <div className="rounded-2xl border border-primary/15 bg-primary px-5 py-6 text-primary-foreground shadow-sm md:px-8">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-lg font-bold">
            {hub.timelineTitle}
          </h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hub.timeline.map((item) => (
              <li
                key={item.key}
                className="rounded-xl bg-white/8 px-4 py-3 ring-1 ring-white/15"
              >
                <p className="font-[family-name:var(--font-qaftr-display)] text-xl font-bold tabular-nums text-[var(--qaftr-gold)]">
                  {formatAeDate(
                    UAE_EINVOICING_MILESTONES[
                      item.key as keyof typeof UAE_EINVOICING_MILESTONES
                    ] as string,
                    lang,
                  )}
                </p>
                <p className="mt-1 text-sm text-primary-foreground/85">
                  {item.label}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-xs text-primary-foreground/75">
            {hub.b2cNote} {copy.verifyNote}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8 md:px-8">
        <h2 className="mb-6 font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground">
          {hub.toolsTitle}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {AE_HUB_CARD_IDS.map((id) => {
            const card = hub.cards[id]
            const Icon = CARD_ICONS[id]
            return (
              <Card
                key={id}
                className={cn(
                  'group h-full min-w-0 gap-0 py-0 shadow-sm transition-transform duration-300 hover:-translate-y-0.5',
                  id === 'guide' && 'md:col-span-2',
                )}
              >
                <CardHeader className="gap-3 px-5 pt-5 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-accent ring-1 ring-border/60">
                      <Icon className="size-5 text-primary" aria-hidden />
                    </div>
                    <Badge variant="secondary">{card.badge}</Badge>
                  </div>
                  <CardTitle className="font-[family-name:var(--font-qaftr-display)] text-lg leading-snug">
                    <h3>{card.title}</h3>
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto px-5 pt-4 pb-5">
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto min-h-9 w-full whitespace-normal py-2 text-center"
                  >
                    <Link
                      to={AE_PAGE_PATHS[id]}
                      search={search}
                      className="no-underline"
                    >
                      {hub.cardCta}: {card.title}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
        <p className="mt-8 text-xs text-muted-foreground/80">
          {copy.disclaimer}
        </p>
      </section>
    </div>
  )
}

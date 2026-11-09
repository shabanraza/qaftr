import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  CalculatorIcon,
  CalendarClockIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { AeBreadcrumb } from '#/components/ae/AeBreadcrumb'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { getAeCopy } from '#/lib/ae/copy'
import { formatAeDate, langSearch } from '#/lib/ae/format'
import { AE_GUIDE_DATE_MODIFIED, getAeGuide } from '#/lib/ae/guide-content'
import type { GuideBlock } from '#/lib/ae/guide-content'
import { AE_PAGE_PATHS } from '#/lib/ae/pages'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'

function Block({ block }: { block: GuideBlock }) {
  if (block.type === 'p')
    return <p className="mt-4 leading-8 text-foreground/90">{block.text}</p>
  return (
    <ul className="mt-4 flex list-disc flex-col gap-2 ps-6 leading-7 text-foreground/90 marker:text-[var(--qaftr-gold)]">
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

type AeGuideContentProps = {
  lang: MarketingLang
}

export function AeGuideContent({ lang }: AeGuideContentProps) {
  const guide = getAeGuide(lang)
  const copy = getAeCopy(lang)
  const dir = langDir(lang)
  const search = langSearch(lang)

  const toolLinks = [
    {
      path: AE_PAGE_PATHS['e-invoicing-readiness'],
      label: guide.tools.readiness,
      Icon: CalendarClockIcon,
    },
    {
      path: AE_PAGE_PATHS['trn-checker'],
      label: guide.tools.trn,
      Icon: ShieldCheckIcon,
    },
    {
      path: AE_PAGE_PATHS['vat-calculator'],
      label: guide.tools.vat,
      Icon: CalculatorIcon,
    },
  ] as const

  return (
    <article dir={dir} lang={lang}>
      <header className="mx-auto max-w-3xl px-5 pb-6 pt-10 md:px-8">
        <AeBreadcrumb lang={lang} current={copy.pageNames.guide} />
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold leading-tight text-foreground md:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-xs text-muted-foreground">
          {guide.updatedLabel}:{' '}
          <time dateTime={AE_GUIDE_DATE_MODIFIED}>
            {formatAeDate(AE_GUIDE_DATE_MODIFIED, lang)}
          </time>
        </p>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          {guide.intro}
        </p>
        <Button asChild size="lg" className="qaftr-btn-primary mt-6">
          <Link
            to={AE_PAGE_PATHS['e-invoicing-readiness']}
            search={search}
            className="no-underline"
          >
            {guide.tools.readiness}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </Link>
        </Button>
      </header>

      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <nav
          aria-label={guide.tocTitle}
          className="rounded-2xl border border-border/70 bg-card/60 px-5 py-4"
        >
          <p className="text-sm font-bold text-foreground">{guide.tocTitle}</p>
          <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-primary no-underline hover:underline"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {guide.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 pt-10"
          >
            <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground">
              {section.heading}
            </h2>
            {section.id === 'timeline' ? (
              <div className="mt-5 overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full min-w-[32rem] border-collapse text-sm">
                  <caption className="px-4 pt-3 text-start text-xs text-muted-foreground">
                    {guide.timeline.caption}
                  </caption>
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30">
                      {guide.timeline.headers.map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-3 text-start font-semibold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guide.timeline.rows.map((row) => (
                      <tr
                        key={row.date}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-primary">
                          {formatAeDate(row.date, lang)}
                        </td>
                        <td className="px-4 py-3">{row.who}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.what}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </section>
        ))}

        <section className="mt-12 rounded-2xl bg-primary px-5 py-6 text-primary-foreground md:px-8">
          <h2 className="font-[family-name:var(--font-qaftr-display)] text-xl font-bold">
            {guide.toolsTitle}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {toolLinks.map(({ path, label, Icon }) => (
              <Link
                key={path}
                to={path}
                search={search}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-primary-foreground no-underline ring-1 ring-white/15 hover:bg-white/15"
              >
                <Icon
                  className="size-5 shrink-0 text-[var(--qaftr-gold)]"
                  aria-hidden
                />
                {label}
              </Link>
            ))}
          </div>
        </section>
        <Badge
          variant="outline"
          className="mt-6 h-auto whitespace-normal text-start text-xs font-normal"
        >
          {guide.verifyNote}
        </Badge>
      </div>

      <ToolFaqSection title={guide.faqTitle} items={guide.faq} />
    </article>
  )
}

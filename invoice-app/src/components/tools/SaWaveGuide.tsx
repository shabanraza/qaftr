import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarClockIcon } from 'lucide-react'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { Button } from '#/components/ui/button'
import type { GuideBlock } from '#/lib/ae/guide-content'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { formatSaDate, toArabicIndic } from '#/lib/sa/format'
import { WAVE_GUIDE_DATE_MODIFIED, getWaveGuide } from '#/lib/sa/wave-guide-content'

function Block({ block }: { block: GuideBlock }) {
  if (block.type === 'p') return <p className="mt-4 leading-8 text-foreground/90">{block.text}</p>
  return (
    <ul className="mt-4 flex list-disc flex-col gap-2 ps-6 leading-7 text-foreground/90 marker:text-[var(--qaftr-gold)]">
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

/** /guides/zatca-wave-25 pillar guide (Saudi region). */
export function SaWaveGuide({ lang }: { lang: MarketingLang }) {
  const guide = getWaveGuide(lang)
  const dir = langDir(lang)
  const search = lang === 'en' ? { lang: 'en' as const } : {}
  const digits = (s: string) => (lang === 'ar' ? toArabicIndic(s) : s)

  return (
    <article dir={dir} lang={lang}>
      <header className="mx-auto max-w-3xl px-5 pb-6 pt-10 md:px-8">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          <Link to="/" search={search} className="text-primary no-underline hover:underline">
            {lang === 'ar' ? 'قافتر' : 'Qaftr'}
          </Link>{' '}
          / {lang === 'ar' ? 'دليل الموجة ٢٥' : 'Wave 25 guide'}
        </p>
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold leading-tight text-foreground md:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-xs text-muted-foreground">
          {guide.updatedLabel}:{' '}
          <time dateTime={WAVE_GUIDE_DATE_MODIFIED}>{formatSaDate(WAVE_GUIDE_DATE_MODIFIED, lang)}</time>
        </p>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{guide.intro}</p>
        <Button asChild size="lg" className="qaftr-btn-primary mt-6 h-auto whitespace-normal py-2.5">
          <Link to="/tools/zatca-wave-checker" search={search} className="no-underline">
            {guide.ctaButton}
            <ArrowRight data-icon="inline-end" className="rtl:-scale-x-100" aria-hidden />
          </Link>
        </Button>
      </header>

      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <nav aria-label={guide.tocTitle} className="rounded-xl border border-border/80 bg-muted/20 p-5">
          <p className="font-semibold text-foreground">{guide.tocTitle}</p>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 ps-5 text-sm">
            {guide.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 pt-10">
            <h2 className="font-[family-name:var(--font-qaftr-display)] text-2xl font-bold text-foreground">
              {section.heading}
            </h2>
            {section.id === 'timeline' ? (
              <div className="mt-5 overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full min-w-[20rem] border-collapse text-sm">
                  <caption className="px-4 py-3 text-start text-xs text-muted-foreground">
                    {guide.timeline.caption}
                  </caption>
                  <thead className="bg-muted/40">
                    <tr>
                      {guide.timeline.headers.map((h) => (
                        <th key={h} scope="col" className="px-4 py-2.5 text-start font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guide.timeline.rows.map((row) => (
                      <tr key={row.wave} className="border-t border-border/60">
                        <th scope="row" className="px-4 py-2.5 text-start font-semibold">
                          {digits(String(row.wave))}
                        </th>
                        <td className="px-4 py-2.5 tabular-nums">{row.threshold}</td>
                        <td className="px-4 py-2.5">
                          <time dateTime={row.deadline}>{formatSaDate(row.deadline, lang)}</time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}

        <aside className="mt-12 flex flex-col gap-3 rounded-xl border border-[var(--qaftr-gold)]/50 bg-[var(--qaftr-gold)]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <CalendarClockIcon className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">{guide.ctaTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{guide.ctaBody}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="h-auto shrink-0 whitespace-normal py-2">
            <Link to="/tools/zatca-wave-checker" search={search} className="no-underline">
              {guide.ctaButton}
            </Link>
          </Button>
        </aside>
      </div>

      <ToolFaqSection title={guide.faqTitle} items={guide.faq} />
      <p className="mx-auto max-w-3xl px-5 pb-6 text-xs text-muted-foreground/80 md:px-8">{guide.verifyNote}</p>
    </article>
  )
}

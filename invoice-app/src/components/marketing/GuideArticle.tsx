import { Link } from '@tanstack/react-router'
import { ArrowRight, FileText } from 'lucide-react'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { Button } from '#/components/ui/button'
import { GUIDES_DATE_MODIFIED, getGuide, getGuidesHub } from '#/lib/guides/content'
import type { ContentBlock, GuideSlug } from '#/lib/guides/content'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { formatSaDate } from '#/lib/sa/format'

function Block({ block }: { block: ContentBlock }) {
  if (block.type === 'p') return <p className="mt-4 leading-8 text-foreground/90">{block.text}</p>
  if (block.type === 'ul') {
    return (
      <ul className="mt-4 flex list-disc flex-col gap-2 ps-6 leading-7 text-foreground/90 marker:text-[var(--qaftr-gold)]">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  return (
    <div className="relative mt-5 overflow-x-auto rounded-xl border border-border/80">
      <table className="w-full min-w-[24rem] border-collapse text-sm">
        <caption className="px-4 py-3 text-start text-xs text-muted-foreground">{block.caption}</caption>
        <thead className="bg-muted/40">
          <tr>
            {block.headers.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-2.5 text-start font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row[0]} className="border-t border-border/60">
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-2.5 text-start font-semibold">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-4 py-2.5">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** /guides/<slug> article: breadcrumb, TOC, sections, CTA, FAQ, related links. */
export function GuideArticle({ slug, lang }: { slug: GuideSlug; lang: MarketingLang }) {
  const guide = getGuide(slug, lang)
  const hub = getGuidesHub(lang)
  const dir = langDir(lang)
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  return (
    <article dir={dir} lang={lang}>
      <header className="mx-auto max-w-3xl px-5 pb-6 pt-10 md:px-8">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          <Link to="/" search={search} className="text-primary no-underline hover:underline">
            {lang === 'ar' ? 'قافتر' : 'Qaftr'}
          </Link>{' '}
          /{' '}
          <Link to="/guides" search={search} className="text-primary no-underline hover:underline">
            {hub.breadcrumb}
          </Link>{' '}
          / {guide.breadcrumb}
        </p>
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold leading-tight text-foreground md:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-4 text-xs text-muted-foreground">
          {hub.updatedLabel}: <time dateTime={GUIDES_DATE_MODIFIED}>{formatSaDate(GUIDES_DATE_MODIFIED, lang)}</time>
        </p>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{guide.intro}</p>
      </header>

      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <nav aria-label={hub.tocTitle} className="rounded-xl border border-border/80 bg-muted/20 p-5">
          <p className="font-semibold text-foreground">{hub.tocTitle}</p>
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
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}

        <aside className="mt-12 flex flex-col gap-3 rounded-xl border border-[var(--qaftr-gold)]/50 bg-[var(--qaftr-gold)]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <FileText className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">{guide.cta.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{guide.cta.body}</p>
            </div>
          </div>
          <Button asChild className="qaftr-btn-primary h-auto shrink-0 whitespace-normal py-2">
            <Link to="/" search={search} hash="invoice-tool" className="no-underline">
              {guide.cta.button}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </Link>
          </Button>
        </aside>
      </div>

      <ToolFaqSection title={hub.faqTitle} items={guide.faq} />

      <section className="mx-auto max-w-3xl px-5 pb-6 md:px-8">
        <h2 className="mb-4 font-[family-name:var(--font-qaftr-display)] text-xl font-bold text-foreground">
          {hub.relatedTitle}
        </h2>
        <div className="flex flex-wrap gap-3">
          {guide.related.map((item) => (
            <Button key={item.href} asChild variant="outline" size="sm">
              <Link to={item.href as '/tools'} search={search} className="no-underline">
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>
      <p className="mx-auto max-w-3xl px-5 pb-6 text-xs text-muted-foreground/80 md:px-8">{hub.verifyNote}</p>
    </article>
  )
}

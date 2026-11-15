import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Wrench } from 'lucide-react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { Button } from '#/components/ui/button'
import { getGuideList, getGuidesHub } from '#/lib/guides/content'
import { buildGuidesHubHead } from '#/lib/guides/head'
import { langDir, marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'

export const Route = createFileRoute('/guides/')({
  validateSearch: marketingSearchSchema,
  head: ({ match }) => buildGuidesHubHead(resolveLang(match.search)),
  component: GuidesHubPage,
})

function GuidesHubPage() {
  const { lang: searchLang } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const hub = getGuidesHub(lang)
  const guides = getGuideList(lang)
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  return (
    <MarketingLayout lang={lang}>
      <section dir={langDir(lang)} lang={lang} className="mx-auto max-w-6xl px-5 pb-6 pt-10 md:px-8 md:pt-16">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          <Link to="/" search={search} className="text-primary no-underline hover:underline">
            {lang === 'ar' ? 'قافتر' : 'Qaftr'}
          </Link>{' '}
          / {hub.breadcrumb}
        </p>
        <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold leading-tight text-foreground md:text-5xl">
          {hub.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{hub.intro}</p>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {guides.map((g) => (
            <li key={g.href}>
              <Link
                to={g.href as '/guides/zatca-wave-25'}
                search={search}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 no-underline transition-transform hover:-translate-y-0.5"
              >
                <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <BookOpen className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-lg font-semibold leading-snug text-primary">{g.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{g.description}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary group-hover:underline">
                  {hub.readMore}
                  <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <aside className="mt-10 flex flex-col gap-3 rounded-2xl border border-[var(--qaftr-gold)]/50 bg-[var(--qaftr-gold)]/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Wrench className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-semibold text-foreground">{hub.toolsTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{hub.toolsBody}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/tools" search={search} className="no-underline">
              {hub.toolsCta}
            </Link>
          </Button>
        </aside>
      </section>
    </MarketingLayout>
  )
}

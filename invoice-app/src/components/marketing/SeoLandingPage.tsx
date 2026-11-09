import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import type { SeoLandingSlug } from '#/lib/marketing/seo-landing-pages'
import { getSeoLandingPage } from '#/lib/marketing/seo-landing-pages'

type SeoLandingPageProps = {
  slug: SeoLandingSlug
  lang: MarketingLang
}

export function SeoLandingPage({ slug, lang }: SeoLandingPageProps) {
  const page = getSeoLandingPage(slug, lang)
  const dir = langDir(lang)
  const toolSearch = lang === 'en' ? { lang: 'en' as const } : {}

  return (
    <MarketingLayout lang={lang}>
      <section
        dir={dir}
        lang={lang}
        className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16"
      >
        <div className="max-w-3xl">
          <Badge
            variant="outline"
            className="mb-4 border-secondary/40 bg-accent text-primary"
          >
            {page.eyebrow}
          </Badge>
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {page.heading}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="qaftr-btn-primary">
              <Link
                to="/tools/fatora"
                search={toolSearch}
                className="no-underline"
              >
                {page.cta}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/tools" search={toolSearch} className="no-underline">
                {lang === 'ar' ? 'كل الأدوات' : 'All tools'}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section
        dir={dir}
        lang={lang}
        className="mx-auto grid max-w-6xl gap-4 px-5 py-4 md:grid-cols-2 md:px-8"
      >
        {page.sections.map((section) => (
          <Card key={section.heading} className="gap-3 py-6">
            <CardHeader className="px-6 pb-0">
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2
                  className="size-5"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </div>
              <CardTitle className="text-lg text-primary">
                {section.heading}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <ToolFaqSection
        title={lang === 'ar' ? 'أسئلة شائعة' : 'Frequently asked questions'}
        items={page.faq}
      />

      <section
        dir={dir}
        lang={lang}
        className="mx-auto max-w-6xl px-5 pb-16 md:px-8"
      >
        <h2 className="mb-4 font-[family-name:var(--font-qaftr-display)] text-xl font-bold text-foreground">
          {lang === 'ar' ? 'روابط ذات صلة' : 'Related pages'}
        </h2>
        <div className="flex flex-wrap gap-3">
          {page.related.map((item) => (
            <Button key={item.href} asChild variant="outline" size="sm">
              {/* Client-side navigation (preload, no full reload); keeps ?lang.
                  Related hrefs are plain strings; every target uses the
                  shared marketingSearchSchema, typed here via /tools/fatora. */}
              <Link
                to={item.href as '/tools/fatora'}
                search={toolSearch}
                className="no-underline"
              >
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </section>
    </MarketingLayout>
  )
}

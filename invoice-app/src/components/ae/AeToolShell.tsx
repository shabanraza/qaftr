import type { ReactNode } from 'react'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { ToolFaqSection } from '#/components/tools/ToolFaqSection'
import { AeBreadcrumb } from '#/components/ae/AeBreadcrumb'
import { getAeCopy } from '#/lib/ae/copy'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'

type AeToolShellProps = {
  lang: MarketingLang
  crumb: string
  title: string
  subtitle: string
  faqTitle?: string
  faq?: { question: string; answer: string }[]
  /** UAE 2027 deadline strip (off on the readiness checker itself). */
  deadline?: boolean
  children: ReactNode
}

/** Shared layout for /ae tool pages: breadcrumb, single h1, tool body, FAQ, disclaimer. */
export function AeToolShell({
  lang,
  crumb,
  title,
  subtitle,
  faqTitle,
  faq,
  deadline = true,
  children,
}: AeToolShellProps) {
  const dir = langDir(lang)
  const copy = getAeCopy(lang)

  return (
    <MarketingLayout lang={lang} deadline={deadline}>
      <div dir={dir} lang={lang}>
        <div className="mx-auto max-w-6xl px-5 pb-6 pt-10 md:px-8">
          <AeBreadcrumb lang={lang} current={crumb} />
          <h1 className="font-[family-name:var(--font-qaftr-display)] text-3xl font-bold text-balance text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        {faq && faqTitle ? (
          <ToolFaqSection title={faqTitle} items={faq} />
        ) : null}
        <p className="mx-auto max-w-3xl px-5 text-xs text-muted-foreground/80 md:px-8">
          {copy.disclaimer}
        </p>
      </div>
    </MarketingLayout>
  )
}

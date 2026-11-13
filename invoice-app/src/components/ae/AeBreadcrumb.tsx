import { Link } from '@tanstack/react-router'
import type { MarketingLang } from '#/lib/marketing/lang'
import { getAeCopy } from '#/lib/ae/copy'
import { langSearch } from '#/lib/ae/format'

type AeBreadcrumbProps = {
  lang: MarketingLang
  current: string
}

export function AeBreadcrumb({ lang, current }: AeBreadcrumbProps) {
  const copy = getAeCopy(lang)
  const search = langSearch(lang)

  return (
    <nav aria-label={lang === 'ar' ? 'مسار التنقل' : 'Breadcrumb'}>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        <Link
          to="/"
          search={search}
          className="text-primary no-underline hover:underline"
        >
          {copy.brand}
        </Link>{' '}
        /{' '}
        <Link
          to="/ae"
          search={search}
          className="text-primary no-underline hover:underline"
        >
          {copy.regionLabel}
        </Link>{' '}
        / {current}
      </p>
    </nav>
  )
}

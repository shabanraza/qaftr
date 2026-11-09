import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { langSearch } from '#/lib/ae/format'
import { AE_PAGE_PATHS } from '#/lib/ae/pages'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

type AeCrossLinkCardProps = {
  lang: MarketingLang
}

/** Banner on the Saudi /tools hub pointing UAE visitors to /ae. */
export function AeCrossLinkCard({ lang }: AeCrossLinkCardProps) {
  const ar = lang === 'ar'

  return (
    <aside className="mt-8 flex flex-col gap-4 rounded-2xl border border-[var(--qaftr-gold)]/40 bg-accent/50 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-7">
      <div>
        <Badge variant="secondary" className="mb-2">
          {ar ? 'جديد · الإمارات' : 'New · UAE'}
        </Badge>
        <h2 className="font-[family-name:var(--font-qaftr-display)] text-lg font-bold text-foreground">
          {ar
            ? 'في الإمارات؟ استعد للفوترة الإلكترونية ٢٠٢٧'
            : 'In the UAE? Get ready for e-invoicing in 2027'}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          {ar
            ? 'اختبار الجاهزية، والتحقق من رقم التسجيل الضريبي (TRN)، وحاسبة ضريبة ٥٪ بالدرهم، مجاناً.'
            : 'Readiness checker, TRN format checker and a 5% VAT calculator in AED — free.'}
        </p>
      </div>
      <Button asChild size="lg" className="qaftr-btn-primary shrink-0">
        <Link
          to={AE_PAGE_PATHS.hub}
          search={langSearch(lang)}
          className="no-underline"
        >
          {ar ? 'أدوات الإمارات' : 'UAE tools'}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
        </Link>
      </Button>
    </aside>
  )
}

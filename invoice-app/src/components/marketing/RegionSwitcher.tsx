import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import { DropdownMenu as DropdownPrimitive } from 'radix-ui'
import { langDir, regionFromPath } from '#/lib/marketing/lang'
import type { MarketingLang, MarketingRegion } from '#/lib/marketing/lang'
import {
  equivalentPath,
  readRegionCookie,
  rememberRegion,
  suggestRegion,
} from '#/lib/marketing/regions'
import { getRegionCopy } from '#/lib/marketing/region-copy'
import { getVisitorCountry } from '#/lib/marketing/region-geo'
import { Button } from '#/components/ui/button'
import { RegionFlag } from './RegionFlag'
import { cn } from '#/lib/utils'

const REGIONS: MarketingRegion[] = ['sa', 'ae']

function useRegionLocation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return { pathname, region: regionFromPath(pathname) }
}

function langSearch(lang: MarketingLang) {
  return lang === 'en' ? { lang: 'en' as const } : {}
}

function RegionLabel({ lang, region }: { lang: MarketingLang; region: MarketingRegion }) {
  const r = getRegionCopy(lang).regions[region]
  return (
    <>
      <RegionFlag region={region} />
      <span>{r.label}</span>
    </>
  )
}

/**
 * Header region picker: flag + currency trigger, a menu of both regions.
 * Each option is a real link to the equivalent page (keeps ?lang) and
 * remembers the choice in the `qaftr_region` cookie.
 */
export function RegionPicker({
  lang,
  className,
}: {
  lang: MarketingLang
  className?: string
}) {
  const copy = getRegionCopy(lang)
  const { pathname, region } = useRegionLocation()
  const current = copy.regions[region]

  return (
    <DropdownPrimitive.Root dir={langDir(lang)} modal={false}>
      <DropdownPrimitive.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-1 rounded-full px-2.5', className)}
          aria-label={copy.pickerCurrent(region)}
        >
          <RegionFlag region={region} />
          <span>{current.currency}</span>
          <ChevronDownIcon aria-hidden className="size-3.5 opacity-60" />
        </Button>
      </DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align="end"
          sideOffset={6}
          lang={lang}
          aria-label={copy.pickerLabel}
          className="qaftr-marketing z-50 min-w-[12rem] rounded-xl border border-border bg-popover p-1 font-[family-name:var(--font-qaftr-body)] text-popover-foreground shadow-lg"
        >
          <DropdownPrimitive.RadioGroup value={region}>
            {REGIONS.map((r) => (
              <DropdownPrimitive.RadioItem key={r} value={r} asChild>
                <Link
                  to={equivalentPath(pathname, r)}
                  search={langSearch(lang)}
                  onClick={() => rememberRegion(r)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground no-underline outline-none data-[highlighted]:bg-accent data-[state=checked]:font-semibold data-[state=checked]:text-primary"
                >
                  <RegionLabel lang={lang} region={r} />
                </Link>
              </DropdownPrimitive.RadioItem>
            ))}
          </DropdownPrimitive.RadioGroup>
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  )
}

/**
 * Plain, crawlable region links (footer and mobile menu). Google recommends
 * visible links to the other regional versions on every page.
 */
export function RegionLinks({
  lang,
  className,
  linkClassName,
  onNavigate,
}: {
  lang: MarketingLang
  className?: string
  linkClassName?: string
  onNavigate?: () => void
}) {
  const copy = getRegionCopy(lang)
  const { pathname } = useRegionLocation()
  return (
    <nav aria-label={copy.pickerLabel} data-region-picker="" className={className}>
      <ul className="flex flex-wrap items-center gap-2">
        {REGIONS.map((r) => (
          <li key={r}>
            <Link
              to={equivalentPath(pathname, r)}
              search={langSearch(lang)}
              onClick={() => {
                rememberRegion(r)
                onNavigate?.()
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm no-underline hover:text-primary aria-[current=page]:border-primary/40 aria-[current=page]:bg-primary/5 aria-[current=page]:font-semibold aria-[current=page]:text-primary',
                linkClassName,
              )}
            >
              <RegionLabel lang={lang} region={r} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// One lookup per document, reused across client-side navigations (the layout
// re-mounts per route).
let countryLookup: { geo: string | undefined; promise: Promise<string | null> } | null =
  null

/** Test hook: forget the cached visitor-country lookup. */
export function resetVisitorCountryCache() {
  countryLookup = null
}

function lookupCountry(geo: string | undefined) {
  if (!countryLookup || countryLookup.geo !== geo) {
    const promise = Promise.resolve()
      .then(() => getVisitorCountry({ data: { geo } }))
      .then((res) => res.country)
      .catch(() => {
        countryLookup = null
        return null
      })
    countryLookup = { geo, promise }
  }
  return countryLookup.promise
}

/**
 * Geo suggestion banner. Rendered only on the client after hydration from a
 * per-visitor server-function call, so the server HTML never varies by
 * country (cache-safe, no hydration mismatch) and crawlers never see it.
 * Never redirects: both buttons just record the choice.
 */
export function RegionSuggestionBanner({ lang }: { lang: MarketingLang }) {
  const copy = getRegionCopy(lang)
  const { pathname, region } = useRegionLocation()
  const [country, setCountry] = useState<string | null>(null)
  const [chosen, setChosen] = useState<MarketingRegion | null>(null)

  useEffect(() => {
    const cookieRegion = readRegionCookie(document.cookie)
    if (cookieRegion) {
      setChosen(cookieRegion)
      return
    }
    const geo = new URLSearchParams(window.location.search).get('_geo') ?? undefined
    let alive = true
    void lookupCountry(geo).then((c) => {
      if (alive) setCountry(c)
    })
    return () => {
      alive = false
    }
  }, [])

  const target = suggestRegion({ country, pageRegion: region, cookieRegion: chosen })
  if (!target) return null

  const choose = (r: MarketingRegion) => {
    rememberRegion(r)
    setChosen(r)
  }

  return (
    <section
      aria-label={copy.banner.label}
      className="relative z-20 border-b border-primary/20 bg-primary/5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:px-5 sm:py-2.5 md:px-8">
        <p className="flex min-w-0 items-center gap-2 leading-snug font-medium text-foreground sm:flex-1">
          <RegionFlag region={target} className="shrink-0" />
          <span>{copy.banner.message(target)}</span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button size="sm" className="qaftr-btn-primary" asChild>
            <Link
              to={equivalentPath(pathname, target)}
              search={langSearch(lang)}
              onClick={() => choose(target)}
              className="no-underline"
            >
              {copy.banner.go(target)}
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => choose(region)}>
            {copy.banner.stay(region)}
          </Button>
        </div>
      </div>
    </section>
  )
}

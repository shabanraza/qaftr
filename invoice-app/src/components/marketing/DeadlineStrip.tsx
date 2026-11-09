import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, CalendarClock, X } from 'lucide-react'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang, MarketingRegion } from '#/lib/marketing/lang'
import { getRegionCopy } from '#/lib/marketing/region-copy'

const TARGETS = {
  sa: '/tools/zatca-wave-checker',
  ae: '/ae/tools/e-invoicing-readiness',
} as const

/** Bump when the deadline text changes so dismissed visitors see the new one. */
const STORAGE_KEY = (region: MarketingRegion) => `qaftr:deadline-dismissed:${region}:v1`

function readDismissed(region: MarketingRegion) {
  try {
    return localStorage.getItem(STORAGE_KEY(region)) === '1'
  } catch {
    return false
  }
}

/**
 * Slim, dismissible deadline strip linking to the region's deadline checker
 * (competitor spec item 12). Server-rendered visible; a visitor who dismissed
 * it (per browser) stops seeing it after hydration.
 */
export function DeadlineStrip({
  lang,
  region,
}: {
  lang: MarketingLang
  region: MarketingRegion
}) {
  const copy = getRegionCopy(lang).deadline
  const item = copy.regions[region]
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (readDismissed(region)) setDismissed(true)
  }, [region])

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY(region), '1')
    } catch {
      // storage blocked: hidden for this page view only
    }
  }

  return (
    <section
      aria-label={copy.label}
      dir={langDir(lang)}
      lang={lang}
      className="relative z-10 border-b border-secondary/30 bg-accent/70"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-5 py-2.5 text-sm md:items-center md:px-8">
        <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-primary md:mt-0" />
        <p className="min-w-0 flex-1 text-foreground">
          <span>{item.message}</span>{' '}
          <Link
            to={TARGETS[region]}
            search={lang === 'en' ? { lang: 'en' } : {}}
            className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-primary underline-offset-4 hover:underline"
          >
            {item.link}
            <ArrowLeft aria-hidden className="size-3.5 ltr:rotate-180" />
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={copy.dismiss}
          className="-m-1 shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </section>
  )
}

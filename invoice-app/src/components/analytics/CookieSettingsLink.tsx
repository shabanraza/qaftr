import { useEffect, useState } from 'react'
import { analyticsActive, openConsentSettings } from '#/lib/analytics/consent'
import { getConsentCopy } from '#/lib/analytics/consent-copy'
import type { MarketingLang } from '#/lib/marketing/lang'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

/**
 * Footer "Cookie settings": reopens the consent banner so visitors can change
 * their choice. Client-only and shown under the same condition as the banner
 * (GA actually loaded on this page), so SSR markup never includes it.
 */
export function CookieSettingsLink({
  lang,
  className = 'no-underline hover:text-primary',
}: {
  lang: MarketingLang
  className?: string
}) {
  const [active, setActive] = useState(false)
  useEffect(() => setActive(analyticsActive()), [])
  if (!active) return null
  return (
    // Text-link look to sit with the other footer links (font-normal! beats
    // the bold the marketing theme gives every [data-slot=button]).
    <Button
      type="button"
      variant="link"
      onClick={openConsentSettings}
      className={cn('h-auto p-0 text-sm text-inherit font-normal! hover:no-underline', className)}
    >
      {getConsentCopy(lang).settings}
    </Button>
  )
}

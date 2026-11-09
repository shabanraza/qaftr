import { useEffect, useState } from 'react'
import { analyticsActive, openConsentSettings } from '#/lib/analytics/consent'
import { getConsentCopy } from '#/lib/analytics/consent-copy'
import type { MarketingLang } from '#/lib/marketing/lang'

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
    <button
      type="button"
      onClick={openConsentSettings}
      className={`cursor-pointer bg-transparent p-0 ${className}`}
    >
      {getConsentCopy(lang).settings}
    </button>
  )
}

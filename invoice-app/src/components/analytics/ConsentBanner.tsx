import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  analyticsActive,
  applyConsent,
  onConsentSettingsRequest,
  readConsent,
} from '#/lib/analytics/consent'
import type { ConsentChoice } from '#/lib/analytics/consent'
import { getConsentCopy } from '#/lib/analytics/consent-copy'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'

/**
 * Consent Mode v2 banner. Client-only (rendered after mount, fixed to the
 * bottom so it never shifts layout) and only when GA was actually loaded.
 * Accept and Reject are deliberately identical in weight. The footer's
 * "Cookie settings" button reopens it (openConsentSettings) so the choice can
 * be changed later; it then takes focus.
 */
/** Height of the open consent banner, read by fixed bottom bars. */
const OFFSET_VAR = '--qaftr-consent-offset'

export function ConsentBanner({ lang }: { lang: MarketingLang }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const copy = getConsentCopy(lang)

  const ref = useRef<HTMLElement>(null)
  const focusOnOpen = useRef(false)

  useEffect(() => {
    if (analyticsActive() && readConsent() === null) setOpen(true)
    return onConsentSettingsRequest(() => {
      if (!analyticsActive()) return
      focusOnOpen.current = true
      setOpen(true)
    })
  }, [])

  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false
      ref.current?.focus()
    }
  }, [open])

  // Publish the banner height so other fixed bottom UI (the invoice tools'
  // sticky download bar) and the page padding stack above it, not under it.
  useEffect(() => {
    const el = ref.current
    if (!open || !el) return
    const root = document.documentElement
    const publish = () => root.style.setProperty(OFFSET_VAR, `${el.offsetHeight}px`)
    publish()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(publish)
    observer?.observe(el)
    window.addEventListener('resize', publish)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', publish)
      root.style.removeProperty(OFFSET_VAR)
    }
  }, [open])

  if (!open) return null

  const choose = (choice: ConsentChoice) => {
    applyConsent(choice)
    setOpen(false)
  }
  const buttonClass = 'min-w-24 flex-1 sm:flex-none'

  return (
    <section
      ref={ref}
      role="region"
      aria-labelledby={titleId}
      dir={langDir(lang)}
      lang={lang}
      data-testid="consent-banner"
      tabIndex={-1}
      className="qaftr-marketing fixed inset-x-0 bottom-0 z-50 p-3 outline-none sm:p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-lg sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-semibold">
            {copy.label}
          </h2>
          <p className="mt-1 leading-6 text-muted-foreground">
            {copy.body}{' '}
            <a href={lang === 'en' ? '/privacy?lang=en' : '/privacy'} className="underline underline-offset-2">
              {copy.privacy}
            </a>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" className={buttonClass} onClick={() => choose('denied')}>
            {copy.reject}
          </Button>
          <Button type="button" variant="outline" className={buttonClass} onClick={() => choose('granted')}>
            {copy.accept}
          </Button>
        </div>
      </div>
    </section>
  )
}

import { contextFromLocation, track } from './track'
import type { AnalyticsEvents } from './track'

type Loc = { pathname: string; search: string }

type SwitchEvent =
  | { name: 'language_switch'; params: AnalyticsEvents['language_switch'] }
  | { name: 'region_switch'; params: AnalyticsEvents['region_switch'] }

/** language_switch / region_switch events implied by a client-side navigation. */
export function switchEvents(prev: Loc, next: Loc): SwitchEvent[] {
  const a = contextFromLocation(prev)
  const b = contextFromLocation(next)
  const events: SwitchEvent[] = []
  if (a.lang !== b.lang) events.push({ name: 'language_switch', params: { from: a.lang, to: b.lang } })
  if (a.region !== b.region) events.push({ name: 'region_switch', params: { from: a.region, to: b.region } })
  return events
}

export function trackSwitches(prev: Loc, next: Loc) {
  for (const e of switchEvents(prev, next)) {
    if (e.name === 'language_switch') track(e.name, e.params)
    else track(e.name, e.params)
  }
}

/**
 * Primary CTAs: anything marked `data-cta="name"`, or styled `.qaftr-btn-primary`
 * (named by its link path/hash, never by its visible text).
 */
export function ctaFromElement(target: Element): AnalyticsEvents['cta_click'] | null {
  const el = target.closest('[data-cta], .qaftr-btn-primary')
  if (!el) return null
  let cta = el.getAttribute('data-cta') ?? ''
  if (!cta) {
    const href = el.getAttribute('href') ?? el.querySelector('a[href]')?.getAttribute('href') ?? ''
    if (href.startsWith('#')) cta = href
    else if (href) {
      try {
        cta = new URL(href, 'https://x.invalid').pathname
      } catch {
        cta = ''
      }
    }
  }
  if (!cta) cta = 'button'
  const section = el.closest('header, nav, footer, main, [role="dialog"]')
  const tag = section?.tagName.toLowerCase()
  const cta_location = section?.getAttribute('role') === 'dialog' ? 'dialog' : (tag ?? 'page')
  return { cta, cta_location }
}

export function handleDocumentClick(event: MouseEvent) {
  try {
    if (!(event.target instanceof Element)) return
    const cta = ctaFromElement(event.target)
    if (cta) track('cta_click', cta)
  } catch {
    // ignore
  }
}

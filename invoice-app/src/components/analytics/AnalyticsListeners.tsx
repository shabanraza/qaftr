import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { handleDocumentClick, trackSwitches } from '#/lib/analytics/listeners'

/**
 * Site-wide analytics that need no per-component wiring:
 * - cta_click for `[data-cta]` / `.qaftr-btn-primary` (one delegated listener)
 * - language_switch / region_switch when a navigation changes ?lang or /ae
 * GA4 enhanced measurement already records SPA page views.
 */
export function AnalyticsListeners() {
  const location = useRouterState({ select: (s) => s.location })
  const prev = useRef<{ pathname: string; search: string } | null>(null)
  const pathname = location.pathname
  const searchStr = location.searchStr

  useEffect(() => {
    const next = { pathname, search: searchStr }
    if (prev.current) trackSwitches(prev.current, next)
    prev.current = next
  }, [pathname, searchStr])

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [])

  return null
}

import { CONSENT_STORAGE_KEY } from './config'

export { CONSENT_STORAGE_KEY }

export type ConsentChoice = 'granted' | 'denied'

type ConsentUpdate = Partial<
  Record<'ad_storage' | 'ad_user_data' | 'ad_personalization' | 'analytics_storage', ConsentChoice>
>

/** Accept grants analytics only (Qaftr runs no ads); reject denies everything. */
export function consentUpdateFor(choice: ConsentChoice): ConsentUpdate {
  if (choice === 'granted') return { analytics_storage: 'granted' }
  return {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  }
}

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function writeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice)
  } catch {
    // Storage blocked (private mode etc.): the banner will ask again next visit.
  }
}

export function applyConsent(choice: ConsentChoice) {
  writeConsent(choice)
  try {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
    if (typeof gtag === 'function') gtag('consent', 'update', consentUpdateFor(choice))
  } catch {
    // never break the page over analytics
  }
}

/** True once the head bootstrap configured GA on this page. */
export function analyticsActive(): boolean {
  return typeof window !== 'undefined' && (window as { __qaftrAnalytics?: boolean }).__qaftrAnalytics === true
}

const SETTINGS_EVENT = 'qaftr:consent-settings'

/** Asks the consent banner to reopen (footer "Cookie settings"). */
export function openConsentSettings() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(SETTINGS_EVENT))
}

/** Subscribes to settings requests; returns the unsubscribe function. */
export function onConsentSettingsRequest(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(SETTINGS_EVENT, listener)
  return () => window.removeEventListener(SETTINGS_EVENT, listener)
}

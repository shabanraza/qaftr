/**
 * Browser error reporting. The SDK is only downloaded when a DSN was built in,
 * and nothing is sent unless the visitor accepted analytics cookies (checked at
 * send time, so withdrawing consent stops it at once). It sets no cookies and
 * writes no storage.
 */
import { readConsent } from '#/lib/analytics/consent'
import { buildRelease, resolveSentryConfig, sharedSentryOptions } from './options'
import type { SentryEnvInput } from './options'

export interface BrowserSdk {
  init(options: any): unknown
  captureException(error: unknown): unknown
  integrations(): unknown[]
}

const MAX_QUEUED = 10

let started: Promise<void> | null = null
let sdk: BrowserSdk | null = null
/** Errors seen while the SDK is loading; `null` when not loading. */
let queue: unknown[] | null = null

function readBrowserEnv(): SentryEnvInput {
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined,
    release: buildRelease(),
    isDev: import.meta.env.DEV,
    mode: import.meta.env.MODE,
  }
}

export function captureBrowserError(error: unknown): void {
  if (sdk) sdk.captureException(error)
  else if (queue && queue.length < MAX_QUEUED && !queue.includes(error)) queue.push(error)
}

const onError = (event: ErrorEvent) => {
  if (event.error) captureBrowserError(event.error)
}
const onRejection = (event: Event) => {
  captureBrowserError((event as PromiseRejectionEvent).reason)
}

function listen(on: boolean) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  window[method]('error', onError as EventListener)
  window[method]('unhandledrejection', onRejection)
}

export function startBrowserErrorReporting(
  env: SentryEnvInput = readBrowserEnv(),
  load: () => Promise<BrowserSdk> = () => import('./browser-sdk'),
): Promise<void> {
  if (started) return started
  const config = resolveSentryConfig(env)
  if (!config) return Promise.resolve()

  queue = []
  listen(true)
  started = load()
    .then((loaded) => {
      const shared = sharedSentryOptions(config)
      loaded.init({
        ...shared,
        integrations: loaded.integrations(),
        denyUrls: [/^(chrome|moz|safari-web)-extension:/i],
        beforeSend(event: object) {
          if (readConsent() !== 'granted') return null
          const sent = shared.beforeSend({ ...event, request: { url: window.location.href } })
          if (!sent) return null
          // Added after scrubbing: the browser type is the only header sent.
          Object.assign((sent as { request: object }).request, {
            headers: { 'User-Agent': window.navigator.userAgent },
          })
          return sent
        },
      })
      listen(false)
      const early = queue ?? []
      queue = null
      sdk = loaded
      early.forEach(captureBrowserError)
    })
    .catch(() => {
      // Error reporting must never break the page.
      listen(false)
      queue = null
    })
  return started
}

/** For tests. */
export function resetBrowserErrorReporting(): void {
  if (typeof window !== 'undefined') listen(false)
  started = null
  sdk = null
  queue = null
}

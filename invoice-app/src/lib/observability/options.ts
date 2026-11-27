/**
 * When Sentry runs and what it may collect, shared by the Worker (server.ts)
 * and the browser (browser.ts). Errors only: no tracing, session replay, logs
 * or breadcrumbs.
 */
import { scrubEvent } from './scrub'

/** Set by vite.config.ts (`define`); absent under vitest. */
declare const __SENTRY_RELEASE__: string | undefined

export function buildRelease(): string | undefined {
  return typeof __SENTRY_RELEASE__ === 'string' && __SENTRY_RELEASE__
    ? __SENTRY_RELEASE__
    : undefined
}

export interface SentryEnvInput {
  dsn?: string
  environment?: string
  release?: string
  isDev: boolean
  mode: string
}

export interface SentryConfig {
  dsn: string
  environment: string
  explicitEnvironment: boolean
  release?: string
}

/** `null` means Sentry stays off. */
export function resolveSentryConfig(input: SentryEnvInput): SentryConfig | null {
  const dsn = input.dsn?.trim()
  if (!dsn || !/^https?:\/\/[^@\s]+@[^\s]+\/\d+$/.test(dsn)) return null
  if (input.isDev || input.mode === 'test') return null
  const environment = input.environment?.trim()
  return {
    dsn,
    environment: environment || 'production',
    explicitEnvironment: Boolean(environment),
    release: input.release,
  }
}

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$|\.localhost$|\.test$/i

function isLocalUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false
  try {
    return LOCAL_HOST.test(new URL(url).hostname)
  } catch {
    return false
  }
}

export function sharedSentryOptions(config: SentryConfig) {
  return {
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    defaultIntegrations: false as const,
    // 0 rather than unset, so a SENTRY_TRACES_SAMPLE_RATE variable cannot turn tracing on.
    // The sampler also overrides an incoming sentry-trace header asking to sample.
    tracesSampler: () => 0,
    tracesSampleRate: 0,
    traceLifecycle: 'static' as const,
    tracePropagationTargets: [] as string[],
    enableLogs: false,
    sendClientReports: false,
    maxBreadcrumbs: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    beforeBreadcrumb: () => null,
    beforeSendTransaction: () => null,
    beforeSend<T extends object>(event: T): T | null {
      // A local production build (preview, e2e) must not report as production.
      const url = (event as { request?: { url?: unknown } }).request?.url
      if (!config.explicitEnvironment && isLocalUrl(url)) return null
      return scrubEvent(event) as unknown as T
    },
  }
}

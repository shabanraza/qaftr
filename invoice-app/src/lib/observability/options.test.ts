import { describe, expect, it } from 'vitest'
import { resolveSentryConfig, sharedSentryOptions } from './options'

const DSN = 'https://abc@o1.ingest.de.sentry.io/2'
const base = { dsn: DSN, isDev: false, mode: 'production' }

describe('resolveSentryConfig', () => {
  it('is off without a DSN', () => {
    expect(resolveSentryConfig({ ...base, dsn: undefined })).toBeNull()
    expect(resolveSentryConfig({ ...base, dsn: '  ' })).toBeNull()
    expect(resolveSentryConfig({ ...base, dsn: 'not a url' })).toBeNull()
  })

  it('is off in local dev and in tests, even with a DSN', () => {
    expect(resolveSentryConfig({ ...base, isDev: true })).toBeNull()
    expect(resolveSentryConfig({ ...base, mode: 'test' })).toBeNull()
  })

  it('is off under vitest by default', () => {
    expect(
      resolveSentryConfig({ dsn: DSN, isDev: import.meta.env.DEV, mode: import.meta.env.MODE }),
    ).toBeNull()
  })

  it('tags environment and release', () => {
    expect(resolveSentryConfig({ ...base, release: 'qaftr-web@abc' })).toEqual({
      dsn: DSN,
      environment: 'production',
      explicitEnvironment: false,
      release: 'qaftr-web@abc',
    })
    expect(resolveSentryConfig({ ...base, environment: 'preview' })).toMatchObject({
      environment: 'preview',
      explicitEnvironment: true,
    })
  })
})

describe('sharedSentryOptions', () => {
  const config = resolveSentryConfig({ ...base, release: 'r1' })!
  const options = sharedSentryOptions(config)

  it('turns off every data collection category', () => {
    expect(options.dataCollection).toEqual({
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
    })
  })

  it('collects errors only: no tracing, replay, logs or breadcrumbs', () => {
    expect(options).toMatchObject({
      defaultIntegrations: false,
      tracesSampleRate: 0,
      tracePropagationTargets: [],
      enableLogs: false,
      sendClientReports: false,
      maxBreadcrumbs: 0,
      release: 'r1',
      environment: 'production',
    })
    expect(options.beforeBreadcrumb()).toBeNull()
    // A rate of 0 still follows an incoming sentry-trace header; a sampler does not.
    expect(options.tracesSampler()).toBe(0)
    expect(options.beforeSendTransaction()).toBeNull()
    expect(options).not.toHaveProperty('replaysSessionSampleRate')
    expect(options).not.toHaveProperty('replaysOnErrorSampleRate')
  })

  it('scrubs events before they are sent', () => {
    const sent = options.beforeSend({ user: { email: 'a@b.com' } })
    expect(JSON.stringify(sent)).not.toContain('a@b.com')
  })

  it.each(['http://localhost:4173/', 'http://127.0.0.1/x', 'http://qaftr.localhost/'])(
    'drops events from %s unless an environment was named',
    (url) => {
      expect(options.beforeSend({ request: { url } })).toBeNull()
      const named = sharedSentryOptions(resolveSentryConfig({ ...base, environment: 'local-check' })!)
      expect(named.beforeSend({ request: { url } })).not.toBeNull()
    },
  )
})

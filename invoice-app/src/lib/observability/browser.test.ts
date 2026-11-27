import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { writeConsent } from '#/lib/analytics/consent'
import {
  captureBrowserError,
  resetBrowserErrorReporting,
  startBrowserErrorReporting,
} from './browser'

const DSN = 'https://abc@o1.ingest.de.sentry.io/2'
const env = { dsn: DSN, isDev: false, mode: 'production', environment: 'check' }

function fakeSdk() {
  return {
    init: vi.fn(),
    captureException: vi.fn(),
    integrations: () => [],
  }
}

const initOptions = (sdk: ReturnType<typeof fakeSdk>) => sdk.init.mock.calls[0]![0]

beforeEach(() => window.localStorage.clear())
afterEach(() => resetBrowserErrorReporting())

describe('startBrowserErrorReporting', () => {
  it('does not even load the SDK without a DSN', async () => {
    const load = vi.fn()
    await startBrowserErrorReporting({ ...env, dsn: undefined }, load)
    captureBrowserError(new Error('x'))
    expect(load).not.toHaveBeenCalled()
  })

  it('does not load the SDK in dev', async () => {
    const load = vi.fn()
    await startBrowserErrorReporting({ ...env, isDev: true }, load)
    expect(load).not.toHaveBeenCalled()
  })

  it('initialises once and captures errors', async () => {
    const sdk = fakeSdk()
    const load = vi.fn(async () => sdk)
    await startBrowserErrorReporting(env, load)
    await startBrowserErrorReporting(env, load)
    const error = new Error('boom')
    captureBrowserError(error)
    expect(sdk.init).toHaveBeenCalledTimes(1)
    expect(sdk.captureException).toHaveBeenCalledWith(error)
  })

  it('keeps errors thrown while the SDK is still loading', async () => {
    const sdk = fakeSdk()
    const started = startBrowserErrorReporting(env, async () => sdk)
    const early = new Error('early')
    const global = new Error('global')
    const rejected = new Error('rejected')
    captureBrowserError(early)
    // preventDefault stops jsdom reporting these deliberate errors to vitest.
    const quiet = (event: Event) => event.preventDefault()
    window.addEventListener('error', quiet)
    window.dispatchEvent(new ErrorEvent('error', { error: global, cancelable: true }))
    window.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: rejected }))
    await started
    expect(sdk.captureException.mock.calls.map(([e]) => e)).toEqual([early, global, rejected])

    // The SDK's own global handlers take over after init.
    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('later'), cancelable: true }),
    )
    window.removeEventListener('error', quiet)
    expect(sdk.captureException).toHaveBeenCalledTimes(3)
  })

  it('never breaks the page if the SDK fails to load', async () => {
    await expect(
      startBrowserErrorReporting(env, async () => {
        throw new Error('chunk failed')
      }),
    ).resolves.toBeUndefined()
    expect(() => captureBrowserError(new Error('x'))).not.toThrow()
  })

  it('sends nothing until analytics consent is granted, and stops when it is withdrawn', async () => {
    const sdk = fakeSdk()
    await startBrowserErrorReporting(env, async () => sdk)
    const { beforeSend } = initOptions(sdk)
    expect(beforeSend({ message: 'x' })).toBeNull()
    writeConsent('denied')
    expect(beforeSend({ message: 'x' })).toBeNull()
    writeConsent('granted')
    expect(beforeSend({ message: 'x' })).toMatchObject({ message: 'x' })
    writeConsent('denied')
    expect(beforeSend({ message: 'x' })).toBeNull()
  })

  it('adds only the page path and browser type to the request', async () => {
    const sdk = fakeSdk()
    window.history.pushState({}, '', '/accept-invite?token=secret')
    await startBrowserErrorReporting(env, async () => sdk)
    writeConsent('granted')
    const sent = initOptions(sdk).beforeSend({})
    expect(sent.request).toEqual({
      url: `${window.location.origin}/accept-invite`,
      headers: { 'User-Agent': navigator.userAgent },
    })
    window.history.pushState({}, '', '/')
  })

  it('drops localhost errors when no environment was named', async () => {
    const sdk = fakeSdk()
    await startBrowserErrorReporting({ ...env, environment: undefined }, async () => sdk)
    writeConsent('granted')
    expect(initOptions(sdk).beforeSend({})).toBeNull()
  })
})

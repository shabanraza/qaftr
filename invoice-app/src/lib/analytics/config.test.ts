import { describe, expect, it } from 'vitest'
import {
  buildGtagBootstrap,
  isProductionHost,
  productionHosts,
  shouldLoadAnalytics,
} from './config'

const SITE = 'https://qaftr.com'

describe('isProductionHost', () => {
  it('accepts the site host and its www variant', () => {
    expect(isProductionHost('qaftr.com', SITE)).toBe(true)
    expect(isProductionHost('www.qaftr.com', SITE)).toBe(true)
    expect(isProductionHost('QAFTR.com', SITE)).toBe(true)
  })

  it.each([
    'localhost',
    '127.0.0.1',
    '[::1]',
    'qaftr.localhost',
    'invoice-app.coder.workers.dev',
    'abc123.invoice-app.pages.dev',
    'staging.qaftr.com',
    'qaftr.com.evil.example',
    '',
  ])('rejects %s', (host) => {
    expect(isProductionHost(host, SITE)).toBe(false)
  })

  it('never treats a dev site URL as production', () => {
    expect(isProductionHost('localhost', 'http://localhost:9000')).toBe(false)
    expect(productionHosts('http://localhost:9000')).toEqual([])
    expect(productionHosts('not a url')).toEqual([])
  })
})

describe('shouldLoadAnalytics', () => {
  it('needs a valid measurement id and a production host', () => {
    expect(shouldLoadAnalytics({ measurementId: 'G-ABC123', hostname: 'qaftr.com', siteUrl: SITE })).toBe(true)
    expect(shouldLoadAnalytics({ measurementId: '', hostname: 'qaftr.com', siteUrl: SITE })).toBe(false)
    expect(shouldLoadAnalytics({ measurementId: undefined, hostname: 'qaftr.com', siteUrl: SITE })).toBe(false)
    expect(shouldLoadAnalytics({ measurementId: "G-1');alert(1)//", hostname: 'qaftr.com', siteUrl: SITE })).toBe(false)
    expect(shouldLoadAnalytics({ measurementId: 'G-ABC123', hostname: 'localhost', siteUrl: SITE })).toBe(false)
    expect(shouldLoadAnalytics({ measurementId: 'G-ABC123', hostname: 'x.workers.dev', siteUrl: SITE })).toBe(false)
  })
})

type FakeWindow = {
  location: { hostname: string }
  localStorage: { getItem: (k: string) => string | null }
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  __qaftrAnalytics?: boolean
  __qaftrAnalyticsForce?: boolean
}

function runBootstrap(win: FakeWindow) {
  const appended: Array<{ src: string; async: boolean }> = []
  const doc = {
    createElement: () => ({ src: '', async: false }),
    head: { appendChild: (el: { src: string; async: boolean }) => appended.push(el) },
  }
  const script = buildGtagBootstrap({ measurementId: 'G-ABC123', siteUrl: SITE })
  new Function('window', 'document', script)(win, doc)
  const calls = (win.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>))
  return { calls, appended }
}

const storage = (value: string | null) => ({ getItem: () => value })

describe('buildGtagBootstrap', () => {
  it('does nothing off production hosts', () => {
    const win: FakeWindow = { location: { hostname: 'localhost' }, localStorage: storage(null) }
    const { calls, appended } = runBootstrap(win)
    expect(calls).toEqual([])
    expect(appended).toEqual([])
    expect(win.gtag).toBeUndefined()
    expect(win.__qaftrAnalytics).toBeUndefined()
  })

  it('sets denied consent defaults before config, then loads gtag.js', () => {
    const win: FakeWindow = { location: { hostname: 'qaftr.com' }, localStorage: storage(null) }
    const { calls, appended } = runBootstrap(win)
    expect(calls[0]).toEqual([
      'consent',
      'default',
      {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500,
      },
    ])
    const names = calls.map((c) => c[0])
    expect(names).toEqual(['consent', 'js', 'config'])
    expect(calls[2]).toEqual(['config', 'G-ABC123'])
    expect(appended).toEqual([
      { src: 'https://www.googletagmanager.com/gtag/js?id=G-ABC123', async: true },
    ])
    expect(typeof win.gtag).toBe('function')
    expect(win.__qaftrAnalytics).toBe(true)
  })

  it('re-applies a remembered grant before config', () => {
    const win: FakeWindow = { location: { hostname: 'qaftr.com' }, localStorage: storage('granted') }
    const { calls } = runBootstrap(win)
    expect(calls.map((c) => c.slice(0, 2))).toEqual([
      ['consent', 'default'],
      ['consent', 'update'],
      ['js', calls[2][1]],
      ['config', 'G-ABC123'],
    ])
    expect(calls[1][2]).toEqual({ analytics_storage: 'granted' })
  })

  it('survives blocked storage and honours the test force flag', () => {
    const win: FakeWindow = {
      location: { hostname: 'localhost' },
      localStorage: {
        getItem: () => {
          throw new Error('blocked')
        },
      },
      __qaftrAnalyticsForce: true,
    }
    const { calls } = runBootstrap(win)
    expect(calls.map((c) => c[0])).toEqual(['consent', 'js', 'config'])
  })
})

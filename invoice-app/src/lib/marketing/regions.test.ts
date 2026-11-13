import { describe, expect, it } from 'vitest'
import {
  REGION_COOKIE,
  countryToRegion,
  counterpartPath,
  equivalentPath,
  isBotUserAgent,
  readRegionCookie,
  regionCookieString,
  regionHref,
  resolveGeoCountry,
  suggestRegion,
} from './regions'

describe('equivalentPath', () => {
  const pairs: Array<[string, string]> = [
    ['/', '/ae'],
    ['/tools/vat-calculator', '/ae/tools/vat-calculator'],
    ['/tools/trn-checker', '/ae/tools/trn-checker'],
    ['/tools/fatora', '/ae/tools/invoice-generator'],
    ['/tools/zatca-wave-checker', '/ae/tools/e-invoicing-readiness'],
    ['/guides/zatca-wave-25', '/ae/guides/uae-e-invoicing-2027'],
  ]

  it.each(pairs)('maps %s <-> %s both ways', (sa, ae) => {
    expect(equivalentPath(sa, 'ae')).toBe(ae)
    expect(equivalentPath(ae, 'sa')).toBe(sa)
  })

  it('maps the Saudi tools hub to the UAE home (no UAE hub)', () => {
    expect(equivalentPath('/tools', 'ae')).toBe('/ae')
  })

  it('maps unpaired pages to the other region home', () => {
    expect(equivalentPath('/privacy', 'ae')).toBe('/ae')
    expect(equivalentPath('/zatca-invoice-generator', 'ae')).toBe('/ae')
    expect(equivalentPath('/ae/unknown', 'sa')).toBe('/')
  })

  it('returns the same path when already in the target region', () => {
    expect(equivalentPath('/tools/fatora', 'sa')).toBe('/tools/fatora')
    expect(equivalentPath('/ae/tools/trn-checker', 'ae')).toBe('/ae/tools/trn-checker')
  })

  it('ignores a trailing slash', () => {
    expect(equivalentPath('/tools/vat-calculator/', 'ae')).toBe('/ae/tools/vat-calculator')
    expect(equivalentPath('/ae/', 'sa')).toBe('/')
  })
})

describe('counterpartPath (hreflang pairs only)', () => {
  it('returns the paired page', () => {
    expect(counterpartPath('/')).toBe('/ae')
    expect(counterpartPath('/ae')).toBe('/')
    expect(counterpartPath('/tools/fatora')).toBe('/ae/tools/invoice-generator')
  })

  it('returns null for unpaired pages (the /tools -> /ae fallback is not a pair)', () => {
    expect(counterpartPath('/tools')).toBeNull()
    expect(counterpartPath('/privacy')).toBeNull()
  })
})

describe('regionHref', () => {
  it('keeps ?lang=en', () => {
    expect(regionHref('/tools/fatora', 'ae', 'en')).toBe('/ae/tools/invoice-generator?lang=en')
    expect(regionHref('/ae', 'sa', 'en')).toBe('/?lang=en')
  })

  it('uses the clean URL for Arabic', () => {
    expect(regionHref('/tools/fatora', 'ae', 'ar')).toBe('/ae/tools/invoice-generator')
  })
})

describe('region cookie', () => {
  it('is named qaftr_region', () => {
    expect(REGION_COOKIE).toBe('qaftr_region')
  })

  it('serialises a 1-year, Lax, root-path cookie', () => {
    const value = regionCookieString('ae', false)
    expect(value).toContain('qaftr_region=ae')
    expect(value).toContain('Max-Age=31536000')
    expect(value).toContain('Path=/')
    expect(value).toContain('SameSite=Lax')
    expect(value).not.toContain('Secure')
    expect(regionCookieString('sa', true)).toContain('Secure')
  })

  it('reads the region from a cookie header, ignoring junk', () => {
    expect(readRegionCookie('a=1; qaftr_region=ae; b=2')).toBe('ae')
    expect(readRegionCookie('qaftr_region=sa')).toBe('sa')
    expect(readRegionCookie('qaftr_region=fr')).toBeNull()
    expect(readRegionCookie('xqaftr_region=ae')).toBeNull()
    expect(readRegionCookie('')).toBeNull()
    expect(readRegionCookie(undefined)).toBeNull()
  })
})

describe('countryToRegion', () => {
  it('maps AE and SA, case-insensitively', () => {
    expect(countryToRegion('AE')).toBe('ae')
    expect(countryToRegion('sa')).toBe('sa')
  })

  it('returns null for other GCC and unknown countries', () => {
    for (const c of ['KW', 'QA', 'BH', 'OM', 'US', 'XX', 'T1', '', null, undefined]) {
      expect(countryToRegion(c)).toBeNull()
    }
  })
})

describe('suggestRegion', () => {
  it('suggests the UAE to an AE visitor on a Saudi page', () => {
    expect(suggestRegion({ country: 'AE', pageRegion: 'sa', cookieRegion: null })).toBe('ae')
  })

  it('suggests Saudi to an SA visitor on a UAE page', () => {
    expect(suggestRegion({ country: 'SA', pageRegion: 'ae', cookieRegion: null })).toBe('sa')
  })

  it('does not suggest when the visitor is already in the page region', () => {
    expect(suggestRegion({ country: 'AE', pageRegion: 'ae', cookieRegion: null })).toBeNull()
    expect(suggestRegion({ country: 'SA', pageRegion: 'sa', cookieRegion: null })).toBeNull()
  })

  it('does not suggest for other countries', () => {
    expect(suggestRegion({ country: 'KW', pageRegion: 'sa', cookieRegion: null })).toBeNull()
    expect(suggestRegion({ country: null, pageRegion: 'sa', cookieRegion: null })).toBeNull()
  })

  it('never suggests once a region was chosen (cookie set)', () => {
    expect(suggestRegion({ country: 'AE', pageRegion: 'sa', cookieRegion: 'sa' })).toBeNull()
    expect(suggestRegion({ country: 'AE', pageRegion: 'sa', cookieRegion: 'ae' })).toBeNull()
  })
})

describe('isBotUserAgent', () => {
  it('flags crawlers', () => {
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0)',
      'facebookexternalhit/1.1',
      'Mozilla/5.0 (compatible; YandexBot/3.0)',
      'Baiduspider',
      'Mozilla/5.0 Chrome-Lighthouse',
    ]) {
      expect(isBotUserAgent(ua), ua).toBe(true)
    }
  })

  it('treats browsers (including headless test browsers) and empty UA correctly', () => {
    expect(
      isBotUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      ),
    ).toBe(false)
    expect(
      isBotUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/130.0 Safari/537.36'),
    ).toBe(false)
    expect(isBotUserAgent('')).toBe(true)
    expect(isBotUserAgent(undefined)).toBe(true)
  })
})

describe('resolveGeoCountry', () => {
  it('uses Cloudflare country in production and ignores the override', () => {
    expect(
      resolveGeoCountry({ host: 'qaftr.com', override: 'AE', cfCountry: 'SA', headerCountry: 'KW' }),
    ).toBe('SA')
    expect(resolveGeoCountry({ host: 'qaftr.com', headerCountry: 'ae' })).toBe('AE')
    expect(resolveGeoCountry({ host: 'qaftr.com' })).toBeNull()
  })

  it('on localhost uses only the ?_geo override (never the dev machine location)', () => {
    for (const host of ['localhost:9012', '127.0.0.1:9011', '[::1]:9000', 'localhost']) {
      expect(resolveGeoCountry({ host, override: 'ae', cfCountry: 'SA' }), host).toBe('AE')
      expect(resolveGeoCountry({ host, cfCountry: 'SA', headerCountry: 'SA' }), host).toBeNull()
    }
  })

  it('rejects malformed overrides and unknown Cloudflare codes', () => {
    expect(resolveGeoCountry({ host: 'localhost', override: 'AEX' })).toBeNull()
    expect(resolveGeoCountry({ host: 'localhost', override: '<s>' })).toBeNull()
    expect(resolveGeoCountry({ host: 'qaftr.com', cfCountry: 'XX' })).toBeNull()
    expect(resolveGeoCountry({ host: 'qaftr.com', cfCountry: 'T1' })).toBeNull()
  })

  it('does not treat look-alike hosts as local', () => {
    expect(resolveGeoCountry({ host: 'localhost.evil.com', override: 'AE' })).toBeNull()
  })
})

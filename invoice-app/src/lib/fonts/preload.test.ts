import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fontPreloadLinks } from './preload'

// vitest runs from invoice-app/
const publicDir = resolve(process.cwd(), 'public')

describe('fontPreloadLinks', () => {
  it('preloads the Arabic body + display files for Arabic pages', () => {
    const links = fontPreloadLinks('ar')
    expect(links.map((l) => l.href)).toEqual([
      '/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2',
      '/fonts/noto-kufi-arabic-arabic-wght-normal.woff2',
    ])
  })

  it('preloads the Latin files for English pages', () => {
    expect(fontPreloadLinks('en').map((l) => l.href)).toEqual([
      '/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2',
      '/fonts/noto-kufi-arabic-latin-wght-normal.woff2',
    ])
  })

  it('emits valid font preload attributes (crossorigin is required for fonts)', () => {
    for (const link of [...fontPreloadLinks('ar'), ...fontPreloadLinks('en')]) {
      expect(link).toMatchObject({ rel: 'preload', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })
      expect(existsSync(`${publicDir}${link.href}`), link.href).toBe(true)
    }
  })
})

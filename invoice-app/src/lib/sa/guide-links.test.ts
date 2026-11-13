import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getSeoLandingPage } from '#/lib/marketing/seo-landing-pages'

const GUIDE = '/guides/zatca-wave-25'

describe('Wave 25 guide is linked from Saudi pages', () => {
  for (const slug of ['e-invoicing-saudi-arabia', 'zatca-invoice-generator'] as const) {
    for (const lang of ['ar', 'en'] as const) {
      it(`${slug} (${lang}) lists the guide and the checker as related pages`, () => {
        const hrefs = getSeoLandingPage(slug, lang).related.map((r) => r.href)
        expect(hrefs).toContain(GUIDE)
        expect(hrefs).toContain('/tools/zatca-wave-checker')
      })
    }
  }

  it('links the guide from the fatora FAQ and the tools hub', () => {
    const fatora = readFileSync(resolve(process.cwd(), 'src/lib/tools/fatora-faq.ts'), 'utf-8')
    expect(fatora).toContain(GUIDE)
    const hub = readFileSync(resolve(process.cwd(), 'src/routes/tools/index.tsx'), 'utf-8')
    expect(hub).toContain(GUIDE)
  })
})

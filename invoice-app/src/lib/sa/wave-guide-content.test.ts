import { describe, expect, it } from 'vitest'
import { ZATCA_WAVES } from '@zatca/shared'
import { WAVE_GUIDE_DATE_MODIFIED, getWaveGuide, waveGuideWordCount } from './wave-guide-content'

describe('ZATCA Wave 25 guide content', () => {
  for (const lang of ['ar', 'en'] as const) {
    it(`has at least 1,200 words in ${lang}`, () => {
      expect(waveGuideWordCount(getWaveGuide(lang))).toBeGreaterThanOrEqual(1200)
    })

    it(`covers every required topic in ${lang}`, () => {
      expect(getWaveGuide(lang).sections.map((s) => s.id)).toEqual([
        'timeline',
        'scope',
        'phase2',
        'qr',
        'deadline',
        'freelancers',
        'checklist',
      ])
    })

    it(`has a wave table built from the shared wave data in ${lang}`, () => {
      const rows = getWaveGuide(lang).timeline.rows
      expect(rows.map((r) => r.wave)).toEqual([23, 24, 25])
      expect(rows.map((r) => r.deadline)).toEqual(ZATCA_WAVES.map((w) => w.deadline))
    })

    it(`has an FAQ of at least 6 questions in ${lang}`, () => {
      expect(getWaveGuide(lang).faq.length).toBeGreaterThanOrEqual(6)
    })
  }

  it('names the Phase 2 technical requirements', () => {
    const text = JSON.stringify(getWaveGuide('en'))
    for (const term of ['UBL 2.1', 'cryptographic stamp', 'CSID', '24 hours', 'clearance', 'Phase 1', 'QR']) {
      expect(text, term).toContain(term)
    }
    expect(text).toMatch(/verify with ZATCA/i)
    expect(text).toMatch(/penalt/i)
    expect(text).not.toMatch(/official ZATCA partner|approved by ZATCA/i)
  })

  it('uses Arabic-Indic digits in the Arabic guide prose', () => {
    const g = getWaveGuide('ar')
    const prose = JSON.stringify([g.title, g.intro, g.sections.map((s) => [s.heading, s.blocks]), g.faq])
    expect(prose.replace(/UBL 2\.1|TLV|XML|CSID|EGS|QR|PDF/g, '')).not.toMatch(/[0-9]/)
  })

  it('has a dateModified', () => {
    expect(WAVE_GUIDE_DATE_MODIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

import { describe, expect, it } from 'vitest'
import { getAeGuide, guideWordCount } from './guide-content'

describe('UAE e-invoicing guide content', () => {
  for (const lang of ['ar', 'en'] as const) {
    it(`has at least 1,200 words in ${lang}`, () => {
      expect(guideWordCount(getAeGuide(lang))).toBeGreaterThanOrEqual(1200)
    })

    it(`covers every required topic in ${lang}`, () => {
      const ids = getAeGuide(lang).sections.map((s) => s.id)
      expect(ids).toEqual(
        expect.arrayContaining([
          'timeline',
          'five-corner',
          'pint-ae',
          'scope',
          'b2c',
          'freelancers',
          'asp',
        ]),
      )
    })

    it(`has a timeline table with the pilot and three go-live dates in ${lang}`, () => {
      const rows = getAeGuide(lang).timeline.rows
      expect(rows.map((r) => r.date)).toEqual([
        '2026-07-01',
        '2027-01-01',
        '2027-07-01',
        '2027-10-01',
      ])
    })

    it(`has an FAQ of at least 6 questions in ${lang}`, () => {
      expect(getAeGuide(lang).faq.length).toBeGreaterThanOrEqual(6)
    })
  }

  it('caveats the dates and denies affiliation', () => {
    const text = JSON.stringify(getAeGuide('en'))
    expect(text).toMatch(/per MoF\/FTA guidance/i)
    expect(text).toMatch(/verify/i)
    expect(text).toMatch(/30 Oct 2026/)
    expect(text).toMatch(/31 Jul 2026/)
    expect(text).not.toMatch(/official FTA partner|approved by the FTA/i)
  })

  it('uses the same section ids in both languages', () => {
    expect(getAeGuide('ar').sections.map((s) => s.id)).toEqual(
      getAeGuide('en').sections.map((s) => s.id),
    )
  })
})

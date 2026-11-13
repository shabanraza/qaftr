import { describe, expect, it } from 'vitest'
import {
  buildIcs,
  buildWaveReminder,
  escapeIcsText,
  foldIcsLine,
  googleCalendarUrl,
  whatsappShareUrl,
} from './wave-reminder'
import { getWaveCopy } from './wave-copy'

const NOW = new Date('2026-11-13T09:05:07Z')
const bytes = (s: string) => new TextEncoder().encode(s).length

/** Minimal RFC 5545 reader: unfold, then split into [name;params, value]. */
function parse(ics: string) {
  const unfolded = ics.replace(/\r\n[ \t]/g, '')
  return unfolded
    .split('\r\n')
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      return [line.slice(0, i), line.slice(i + 1)] as const
    })
}
const value = (ics: string, name: string) => parse(ics).find(([k]) => k === name)?.[1]
const unescape = (s: string) =>
  s.replace(/\\(n|N|,|;|\\)/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))

describe('escapeIcsText', () => {
  it('escapes backslashes, commas, semicolons and newlines (RFC 5545 3.3.11)', () => {
    expect(escapeIcsText('a\\b, c; d\ne\r\nf\rg')).toBe('a\\\\b\\, c\\; d\\ne\\nf\\ng')
  })
  it('leaves colons and Arabic text alone', () => {
    expect(escapeIcsText('موعد: ١ فبراير')).toBe('موعد: ١ فبراير')
  })
})

describe('foldIcsLine', () => {
  it('does not touch lines of 75 octets or fewer', () => {
    const line = 'X'.repeat(75)
    expect(foldIcsLine(line)).toBe(line)
  })

  it('folds long ASCII lines at 75 octets with CRLF + space', () => {
    const line = `DESCRIPTION:${'a'.repeat(200)}`
    const folded = foldIcsLine(line)
    const parts = folded.split('\r\n')
    expect(parts.length).toBeGreaterThan(1)
    for (const p of parts) expect(bytes(p)).toBeLessThanOrEqual(75)
    expect(bytes(parts[0])).toBe(75)
    expect(parts.slice(1).every((p) => p.startsWith(' '))).toBe(true)
    expect(folded.replace(/\r\n /g, '')).toBe(line)
  })

  it('never splits a multi-byte UTF-8 character', () => {
    const line = `SUMMARY:${'تذكير موعد الربط '.repeat(10)}`
    const folded = foldIcsLine(line)
    for (const p of folded.split('\r\n')) {
      expect(bytes(p)).toBeLessThanOrEqual(75)
      // a split sequence would decode to U+FFFD
      expect(new TextDecoder().decode(new TextEncoder().encode(p))).not.toContain('�')
    }
    expect(folded.replace(/\r\n /g, '')).toBe(line)
  })
})

describe('buildIcs', () => {
  const ics = buildIcs({
    uid: 'zatca-wave-25-2027-02-01@qaftr.com',
    date: '2027-02-01',
    summary: 'Deadline; Wave 25, ZATCA',
    description: `Line one\nLine two, with a comma; and semicolon. ${'long '.repeat(40)}`,
    url: 'https://qaftr.com/tools/zatca-wave-checker?lang=en',
    alarmDaysBefore: [30, 7],
    alarmDescription: 'Reminder',
    now: NOW,
  })

  it('uses CRLF line endings throughout and ends with CRLF', () => {
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('keeps every physical line within 75 octets', () => {
    for (const line of ics.split('\r\n')) expect(bytes(line)).toBeLessThanOrEqual(75)
  })

  it('wraps one VEVENT in a VCALENDAR with the required properties', () => {
    const names = parse(ics).map(([k]) => k)
    expect(names[0]).toBe('BEGIN')
    expect(value(ics, 'VERSION')).toBe('2.0')
    expect(value(ics, 'PRODID')).toMatch(/Qaftr/)
    expect(value(ics, 'CALSCALE')).toBe('GREGORIAN')
    expect(value(ics, 'METHOD')).toBe('PUBLISH')
    expect(parse(ics).filter(([k, v]) => k === 'BEGIN' && v === 'VEVENT')).toHaveLength(1)
    expect(parse(ics).at(-1)).toEqual(['END', 'VCALENDAR'])
    expect(value(ics, 'UID')).toBe('zatca-wave-25-2027-02-01@qaftr.com')
    expect(value(ics, 'DTSTAMP')).toBe('20261113T090507Z')
  })

  it('is an all-day event on the deadline (DATE values, exclusive DTEND)', () => {
    expect(value(ics, 'DTSTART;VALUE=DATE')).toBe('20270201')
    expect(value(ics, 'DTEND;VALUE=DATE')).toBe('20270202')
  })

  it('rolls DTEND over month and year ends', () => {
    const nye = buildIcs({ uid: 'x@qaftr.com', date: '2026-12-31', summary: 's', description: 'd', now: NOW })
    expect(value(nye, 'DTEND;VALUE=DATE')).toBe('20270101')
  })

  it('escapes SUMMARY and DESCRIPTION so they round-trip', () => {
    expect(value(ics, 'SUMMARY')).toBe('Deadline\\; Wave 25\\, ZATCA')
    expect(unescape(value(ics, 'DESCRIPTION')!)).toMatch(/^Line one\nLine two, with a comma; and semicolon\./)
    expect(value(ics, 'URL')).toBe('https://qaftr.com/tools/zatca-wave-checker?lang=en')
  })

  it('adds one display VALARM per reminder offset', () => {
    const triggers = parse(ics).filter(([k]) => k === 'TRIGGER').map(([, v]) => v)
    expect(triggers).toEqual(['-P30D', '-P7D'])
    expect(parse(ics).filter(([k, v]) => k === 'ACTION' && v === 'DISPLAY')).toHaveLength(2)
    expect(parse(ics).filter(([k, v]) => k === 'BEGIN' && v === 'VALARM')).toHaveLength(2)
  })

  it('rejects an invalid date', () => {
    expect(() =>
      buildIcs({ uid: 'x', date: '2027-02-30', summary: 's', description: 'd', now: NOW }),
    ).toThrow()
  })
})

describe('googleCalendarUrl', () => {
  it('builds an all-day TEMPLATE link', () => {
    const url = new URL(googleCalendarUrl({ title: 'Wave 25, deadline', details: 'a & b', date: '2027-02-01' }))
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('Wave 25, deadline')
    expect(url.searchParams.get('details')).toBe('a & b')
    expect(url.searchParams.get('dates')).toBe('20270201/20270202')
  })
})

describe('whatsappShareUrl', () => {
  it('uses wa.me with the text encoded and no phone number', () => {
    const url = new URL(whatsappShareUrl('موعد الربط: ١ فبراير ٢٠٢٧ & more https://qaftr.com/x?a=1'))
    expect(url.origin + url.pathname).toBe('https://wa.me/')
    expect(url.searchParams.get('text')).toBe('موعد الربط: ١ فبراير ٢٠٢٧ & more https://qaftr.com/x?a=1')
  })
})

describe('buildWaveReminder', () => {
  const base = { wave: 25 as const, deadline: '2027-02-01', daysRemaining: 80, now: NOW }

  it('English: summary, next steps, link back and a stable UID', () => {
    const r = buildWaveReminder({ ...base, lang: 'en' })
    const copy = getWaveCopy('en')
    expect(r.filename).toBe('qaftr-zatca-wave-25-deadline.ics')
    expect(value(r.ics, 'UID')).toBe('zatca-wave-25-2027-02-01@qaftr.com')
    expect(unescape(value(r.ics, 'SUMMARY')!)).toBe('ZATCA Wave 25 integration deadline')
    const description = unescape(value(r.ics, 'DESCRIPTION')!)
    expect(description).toContain('1 Feb 2027')
    for (const step of copy.nextSteps) expect(description).toContain(step)
    expect(description).toContain('https://qaftr.com/tools/zatca-wave-checker?lang=en')
    expect(description).toMatch(/Verify .*ZATCA/)
    expect(value(r.ics, 'URL')).toBe('https://qaftr.com/tools/zatca-wave-checker?lang=en')
    expect(r.ics).not.toMatch(/approved|certified/i)
  })

  it('only schedules alarms that are still in the future', () => {
    const far = buildWaveReminder({ ...base, lang: 'en' })
    expect(parse(far.ics).filter(([k]) => k === 'TRIGGER').map(([, v]) => v)).toEqual(['-P30D', '-P7D', '-P1D'])
    const near = buildWaveReminder({ ...base, daysRemaining: 10, lang: 'en' })
    expect(parse(near.ics).filter(([k]) => k === 'TRIGGER').map(([, v]) => v)).toEqual(['-P7D', '-P1D'])
  })

  it('Arabic: Arabic text with Arabic-Indic digits', () => {
    const r = buildWaveReminder({ ...base, lang: 'ar' })
    const summary = unescape(value(r.ics, 'SUMMARY')!)
    expect(summary).toContain('الموجة ٢٥')
    expect(summary).not.toMatch(/[0-9]/)
    const description = unescape(value(r.ics, 'DESCRIPTION')!)
    expect(description).toContain('١ فبراير ٢٠٢٧')
    expect(description).toContain('https://qaftr.com/tools/zatca-wave-checker')
    expect(description).not.toContain('lang=en')
  })

  it('builds Google Calendar and WhatsApp links with the deadline and page URL', () => {
    const r = buildWaveReminder({ ...base, lang: 'en' })
    const g = new URL(r.googleUrl)
    expect(g.searchParams.get('dates')).toBe('20270201/20270202')
    expect(g.searchParams.get('text')).toBe('ZATCA Wave 25 integration deadline')
    expect(g.searchParams.get('details')).toContain('https://qaftr.com/tools/zatca-wave-checker?lang=en')

    const text = new URL(r.whatsappUrl).searchParams.get('text')!
    expect(text).toContain('Wave 25')
    expect(text).toContain('1 Feb 2027')
    expect(text).toContain('80')
    expect(text).toContain('https://qaftr.com/tools/zatca-wave-checker?lang=en')

    const ar = new URL(buildWaveReminder({ ...base, lang: 'ar' }).whatsappUrl).searchParams.get('text')!
    expect(ar).toContain('١ فبراير ٢٠٢٧')
    expect(ar).toContain('٨٠')
  })
})

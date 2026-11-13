import type { MarketingLang } from '#/lib/marketing/lang'
import { SITE_URL } from '#/lib/marketing/constants'
import { formatSaDate, formatSaNumber, toArabicIndic } from './format'
import { getWaveCopy } from './wave-copy'

/**
 * Deadline reminder for the ZATCA wave checker: an RFC 5545 all-day event
 * (.ics), a Google Calendar template link and a WhatsApp share link. Pure and
 * client-only: nothing is sent to Qaftr, no email or phone is collected.
 */

const CRLF = '\r\n'
const MAX_OCTETS = 75

/** RFC 5545 3.3.11 TEXT escaping. */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

const encoder = new TextEncoder()

/**
 * RFC 5545 3.1 line folding: at most 75 octets per physical line (excluding
 * CRLF); continuation lines start with one space, which counts toward the 75.
 * Folds between code points so UTF-8 sequences are never split.
 */
export function foldIcsLine(line: string): string {
  if (encoder.encode(line).length <= MAX_OCTETS) return line
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const n = encoder.encode(ch).length
    const limit = parts.length === 0 ? MAX_OCTETS : MAX_OCTETS - 1
    if (size + n > limit) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += n
  }
  parts.push(current)
  return parts.join(`${CRLF} `)
}

function parseDate(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Invalid date: ${iso}`)
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  if (d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) {
    throw new Error(`Invalid date: ${iso}`)
  }
  return d
}

/** YYYY-MM-DD → [YYYYMMDD, next day YYYYMMDD] for an all-day event. */
function allDayRange(iso: string): [string, string] {
  const start = parseDate(iso)
  const end = new Date(start.getTime() + 86_400_000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  return [fmt(start), fmt(end)]
}

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export type IcsEvent = {
  uid: string
  /** All-day event date, YYYY-MM-DD. */
  date: string
  summary: string
  description: string
  url?: string
  /** One display alarm per entry, N days before the start. */
  alarmDaysBefore?: number[]
  alarmDescription?: string
  now: Date
}

export function buildIcs(event: IcsEvent): string {
  const [start, end] = allDayRange(event.date)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Qaftr//ZATCA Wave Checker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${utcStamp(event.now)}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    ...(event.url ? [`URL:${event.url}`] : []),
    'TRANSP:TRANSPARENT',
  ]
  for (const days of event.alarmDaysBefore ?? []) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(event.alarmDescription ?? event.summary)}`,
      `TRIGGER:-P${days}D`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.map(foldIcsLine).join(CRLF) + CRLF
}

export function googleCalendarUrl(opts: { title: string; details: string; date: string }): string {
  const [start, end] = allDayRange(opts.date)
  const q = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(opts.title)}`,
    `dates=${start}/${end}`,
    `details=${encodeURIComponent(opts.details)}`,
  ]
  return `https://calendar.google.com/calendar/render?${q.join('&')}`
}

/** wa.me share link without a recipient: the user picks the chat (e.g. their accountant). */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

/** Reminder offsets (days before the deadline); only future ones are scheduled. */
export const WAVE_REMINDER_DAYS = [30, 7, 1] as const

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}

export type WaveReminderInput = {
  lang: MarketingLang
  wave: number
  /** Deadline from the wave data, YYYY-MM-DD. */
  deadline: string
  daysRemaining: number
  now: Date
  siteUrl?: string
}

export type WaveReminder = {
  ics: string
  filename: string
  googleUrl: string
  whatsappUrl: string
}

export function buildWaveReminder(input: WaveReminderInput): WaveReminder {
  const { lang, wave, deadline, daysRemaining } = input
  const copy = getWaveCopy(lang)
  const r = copy.reminder
  const digits = (s: string) => (lang === 'ar' ? toArabicIndic(s) : s)
  const pageUrl = `${input.siteUrl ?? SITE_URL}/tools/zatca-wave-checker${lang === 'en' ? '?lang=en' : ''}`
  const values = {
    wave: digits(String(wave)),
    date: formatSaDate(deadline, lang),
    days: formatSaNumber(daysRemaining, lang),
    url: pageUrl,
  }
  const summary = fill(r.eventSummary, values)
  const description = [
    fill(r.eventIntro, values),
    '',
    r.eventStepsTitle,
    ...copy.nextSteps.map((step, i) => `${digits(String(i + 1))}. ${step}`),
    '',
    r.eventVerify,
    fill(r.eventLink, values),
  ].join('\n')

  const ics = buildIcs({
    uid: `zatca-wave-${wave}-${deadline}@qaftr.com`,
    date: deadline,
    summary,
    description,
    url: pageUrl,
    alarmDaysBefore: WAVE_REMINDER_DAYS.filter((d) => d < daysRemaining),
    alarmDescription: fill(r.alarm, values),
    now: input.now,
  })

  return {
    ics,
    filename: `qaftr-zatca-wave-${wave}-deadline.ics`,
    googleUrl: googleCalendarUrl({ title: summary, details: description, date: deadline }),
    whatsappUrl: whatsappShareUrl(fill(r.whatsappText, values)),
  }
}

import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { READINESS_QUESTIONS } from '#/lib/ae/readiness-quiz'
import { getAeCopy } from '#/lib/ae/copy'
import { UaeReadinessQuiz } from './UaeReadinessQuiz'

type Answers = {
  government?: 'yes' | 'no'
  customers?: 'b2b' | 'mixed' | 'b2c'
  revenue?: string
}

async function run(
  answers: Answers,
  lang: 'ar' | 'en' = 'en',
  today = '2026-11-08',
) {
  renderWithRouter(<UaeReadinessQuiz lang={lang} today={today} />)
  await screen.findByTestId('readiness-form')
  if (answers.government)
    fireEvent.click(screen.getByTestId(`gov-${answers.government}`))
  if (answers.customers)
    fireEvent.click(screen.getByTestId(`customers-${answers.customers}`))
  if (answers.revenue !== undefined)
    fireEvent.change(screen.getByTestId('revenue-input'), {
      target: { value: answers.revenue },
    })
  fireEvent.click(screen.getByTestId('readiness-submit'))
}

const text = () => document.body.textContent

describe('UaeReadinessQuiz', () => {
  it('shows nothing until submitted', async () => {
    renderWithRouter(<UaeReadinessQuiz lang="en" today="2026-11-08" />)
    await screen.findByTestId('readiness-form')
    expect(screen.queryByTestId('readiness-result')).toBeNull()
  })

  it('gives a small B2B business its 1 Jul 2027 deadline and countdown', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '2,000,000' })
    expect(screen.getByTestId('readiness-date').textContent).toBe('1 Jul 2027')
    expect(screen.getByTestId('readiness-days').textContent).toBe('235')
    expect(text()).toMatch(/verify before relying/i)
  })

  it('treats mixed B2B + B2C sellers as in scope', async () => {
    await run({ government: 'no', customers: 'mixed', revenue: '100000' })
    expect(screen.getByTestId('readiness-date').textContent).toBe('1 Jul 2027')
  })

  it('warns large businesses about the reported ASP deadline carefully', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '60000000' })
    expect(screen.getByTestId('readiness-date').textContent).toBe('1 Jan 2027')
    expect(screen.getByTestId('readiness-days').textContent).toBe('54')
    const asp = screen.getByTestId('readiness-asp').textContent
    expect(asp).toMatch(/31 Jul 2026/)
    expect(asp).toMatch(/30 Oct 2026/)
    expect(asp).toMatch(/reported/i)
  })

  it('puts government entities on 1 Oct 2027 without needing revenue', async () => {
    await run({ government: 'yes' })
    expect(screen.getByTestId('readiness-date').textContent).toBe('1 Oct 2027')
  })

  it('tells B2C-only sellers they are not in scope yet', async () => {
    await run({ government: 'no', customers: 'b2c' })
    expect(screen.getByTestId('readiness-status').textContent).toMatch(
      /Not in scope yet/i,
    )
    expect(screen.queryByTestId('readiness-days')).toBeNull()
  })

  it('shows errors for missing or invalid answers', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: 'abc' })
    expect(screen.queryByTestId('readiness-result')).toBeNull()
    expect(screen.getByTestId('revenue-error')).toBeTruthy()
    fireEvent.change(screen.getByTestId('revenue-input'), {
      target: { value: '-5' },
    })
    fireEvent.click(screen.getByTestId('readiness-submit'))
    expect(screen.queryByTestId('readiness-result')).toBeNull()
  })

  it('asks for the unanswered questions', async () => {
    await run({})
    expect(screen.getByTestId('gov-error')).toBeTruthy()
  })

  it('lists the four preparation steps', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '1000000' })
    const steps = screen.getByTestId('readiness-steps').textContent
    expect(steps).toMatch(/ASP/)
    expect(steps).toMatch(/Peppol ID/)
    expect(steps).toMatch(/PINT AE/)
    expect(steps).toMatch(/test/i)
  })

  it('offers reminders via mailto without putting personal data in the URL', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '1000000' })
    const link = screen.getByTestId('reminder-mailto')
    const href = link.getAttribute('href') ?? ''
    expect(href.startsWith('mailto:support@qaftr.com?subject=')).toBe(true)
    expect(decodeURIComponent(href)).toMatch(/1 Jul 2027/)
    expect(href).not.toMatch(/@.*@/)
  })

  it('works in Arabic', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '١٠٠٠٠٠' }, 'ar')
    expect(screen.getByTestId('readiness-date').textContent).toBe(
      '1 يوليو 2027',
    )
  })
  it('says the reported ASP deadline has passed once it has', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '60000000' })
    const asp = screen.getByTestId('readiness-asp').textContent
    expect(asp).toMatch(/has passed/i)
    expect(asp).toMatch(/immediately/i)
  })

  it('shows the ASP deadline as upcoming before it passes', async () => {
    await run(
      { government: 'no', customers: 'b2b', revenue: '60000000' },
      'en',
      '2026-06-01',
    )
    const asp = screen.getByTestId('readiness-asp').textContent
    expect(asp).not.toMatch(/has passed/i)
    expect(asp).toMatch(/31 Jul 2026/)
  })

  it('says the ASP deadline has passed in Arabic too', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '60000000' }, 'ar')
    expect(screen.getByTestId('readiness-asp').textContent).toMatch(/انتهى/)
  })

  it('does not ask B2C-only sellers for revenue', async () => {
    await run({ government: 'no', customers: 'b2c' })
    expect(screen.queryByTestId('revenue-error')).toBeNull()
    expect(screen.queryByTestId('revenue-input')).toBeNull()
    expect(screen.getByTestId('readiness-status').textContent).toMatch(
      /Not in scope yet/i,
    )
  })

  it('uses native radio inputs grouped in fieldsets (keyboard accessible)', async () => {
    renderWithRouter(<UaeReadinessQuiz lang="en" today="2026-11-08" />)
    await screen.findByTestId('readiness-form')
    const gov = [screen.getByTestId('gov-yes'), screen.getByTestId('gov-no')]
    for (const el of gov) {
      expect(el.tagName).toBe('INPUT')
      expect(el.getAttribute('type')).toBe('radio')
    }
    expect(gov[0].getAttribute('name')).toBe(gov[1].getAttribute('name'))
    expect(screen.getAllByRole('group').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('radio', { name: 'No' })).toBe(gov[1])
  })

  it('has as many question groups as the quiz definition, and the hub says so', async () => {
    renderWithRouter(<UaeReadinessQuiz lang="en" today="2026-11-08" />)
    await screen.findByTestId('readiness-form')
    expect(screen.getAllByTestId('readiness-question')).toHaveLength(
      READINESS_QUESTIONS.length,
    )
    for (const lang of ['ar', 'en'] as const) {
      const copy = getAeCopy(lang)
      const n = String(READINESS_QUESTIONS.length)
      expect(copy.hub.cards['e-invoicing-readiness'].description).toContain(n)
      expect(copy.readiness.subtitle).toContain(n)
      expect(copy.hub.cards['e-invoicing-readiness'].description).not.toMatch(
        /\b4\b/,
      )
    }
  })

  it('has clean Arabic step copy', async () => {
    await run({ government: 'no', customers: 'b2b', revenue: '1000000' }, 'ar')
    const steps = screen.getByTestId('readiness-steps').textContent
    expect(steps).not.toMatch(/\(test\)/)
    expect(steps).not.toMatch(/Peppol ID/)
    expect(steps).toMatch(/معرّف Peppol/)
  })
})

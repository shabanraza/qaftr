import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { ZatcaWaveChecker } from './ZatcaWaveChecker'

const TODAY = '2026-11-08'

async function setup(lang: 'ar' | 'en' = 'en') {
  renderWithRouter(<ZatcaWaveChecker lang={lang} today={TODAY} />)
  await screen.findByRole('heading', { name: /Quick questions|أسئلة سريعة/ })
  const pick = (name: string, value: string) =>
    fireEvent.click(
      document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`)!,
    )
  const revenue = (year: number, value: string) =>
    fireEvent.change(document.getElementById(`wave-revenue-${year}`)!, { target: { value } })
  const submit = () =>
    fireEvent.click(screen.getByRole('button', { name: /Check my wave|اعرف موجتك/ }))
  const result = () => screen.getByRole('region', { name: /Your result|النتيجة/ })
  return { pick, revenue, submit, result }
}

describe('ZatcaWaveChecker', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows an empty result placeholder, then a free-invoice CTA right after the result', async () => {
    const { pick, revenue, submit, result } = await setup()
    expect(screen.getByText('Answer the questions to see your wave and deadline.')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Create your first invoice free' })).toBeNull()
    pick('wave-vat', 'yes')
    revenue(2024, '200,000')
    submit()
    const cta = within(result()).getByRole('link', { name: 'Create your first invoice free' })
    expect(cta.getAttribute('href')).toBe('/tools/fatora?lang=en')
    expect(screen.queryByText('Answer the questions to see your wave and deadline.')).toBeNull()
  })

  it('puts revenue above SAR 187,500 into Wave 25 with an 85-day countdown', async () => {
    const { pick, revenue, submit, result } = await setup()
    pick('wave-vat', 'yes')
    revenue(2024, '200,000')
    pick('wave-notified', 'no')
    submit()
    const r = result()
    expect(within(r).getByRole('heading', { level: 3 }).textContent).toBe(
      'You are likely in Wave 25',
    )
    expect(r.textContent).toContain('1 Feb 2027')
    expect(within(r).getByTestId('wave-days').textContent).toBe('85')
    expect(r.textContent).toMatch(/Not being notified is not an exemption/)
    expect(r.textContent).toMatch(/2024/)
    expect(within(r).getAllByRole('listitem')).toHaveLength(4)
    expect(r.textContent).toMatch(/CSID/)
  })

  it('reports Wave 24 as overdue', async () => {
    const { pick, revenue, submit, result } = await setup()
    pick('wave-vat', 'yes')
    revenue(2025, '400000')
    submit()
    expect(result().textContent).toMatch(/likely in Wave 24 — and the deadline has passed/)
    expect(result().textContent).toMatch(/Deadline passed 131 days ago/)
  })

  it('flags a possible earlier wave above SAR 750,000', async () => {
    const { pick, revenue, submit, result } = await setup()
    pick('wave-vat', 'yes')
    revenue(2022, '900000')
    submit()
    expect(result().textContent).toMatch(/Wave 23/)
    expect(result().textContent).toMatch(/earlier wave/)
  })

  it('says below threshold when every year is at or under SAR 187,500', async () => {
    const { pick, revenue, submit, result } = await setup()
    pick('wave-vat', 'yes')
    revenue(2023, '187500')
    submit()
    expect(result().textContent).toMatch(/not in Waves 23–25/)
    expect(screen.queryByTestId('wave-days')).toBeNull()
  })

  it('explains VAT registration when not registered (no revenue needed)', async () => {
    const { pick, submit, result } = await setup()
    pick('wave-vat', 'no')
    submit()
    expect(result().textContent).toMatch(/applies to VAT-registered businesses/)
    expect(result().textContent).toMatch(/375,000/)
  })

  it('validates missing answers and revenue', async () => {
    const { pick, submit } = await setup()
    submit()
    expect(screen.getByText('Choose an answer.')).toBeTruthy()
    pick('wave-vat', 'yes')
    submit()
    expect(screen.getByText(/Enter revenue for at least one year/)).toBeTruthy()
    expect(screen.queryByRole('region', { name: /Your result/ })).toBeNull()
  })

  it('uses native radio inputs with accessible group names', async () => {
    await setup()
    const groups = screen.getAllByRole('radiogroup')
    expect(groups).toHaveLength(2)
    expect(groups[0].getAttribute('aria-labelledby')).toBeTruthy()
    const radios = screen.getAllByRole<HTMLInputElement>('radio')
    expect(radios.every((r) => r.type === 'radio')).toBe(true)
  })

  it('links a privacy-safe mailto (no personal data) and the guide', async () => {
    const { pick, revenue, submit } = await setup()
    pick('wave-vat', 'yes')
    revenue(2024, '200000')
    submit()
    const mail = screen.getByRole('link', { name: 'Get notified when Qaftr Phase 2 launches' })
    const href = mail.getAttribute('href')!
    expect(href.startsWith('mailto:support@qaftr.com?subject=')).toBe(true)
    expect(href).not.toMatch(/200|body=/)
    expect(screen.getByRole('link', { name: 'Read the full Wave 25 guide' }).getAttribute('href')).toBe(
      '/guides/zatca-wave-25?lang=en',
    )
  })

  it('scrolls the result into view on small screens', async () => {
    const spy = vi.fn()
    HTMLElement.prototype.scrollIntoView = spy
    window.matchMedia = (q: string) =>
      ({ matches: q.includes('max-width'), media: q }) as MediaQueryList
    const { pick, submit } = await setup()
    pick('wave-vat', 'no')
    submit()
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    expect(spy).toHaveBeenCalled()
  })

  it('renders Arabic with Arabic-Indic digits and accepts Arabic-Indic input', async () => {
    const { pick, revenue, submit, result } = await setup('ar')
    pick('wave-vat', 'yes')
    revenue(2024, '٢٠٠٬٠٠٠')
    submit()
    expect(within(result()).getByRole('heading', { level: 3 }).textContent).toBe(
      'غالباً أنت ضمن الموجة ٢٥',
    )
    expect(within(result()).getByTestId('wave-days').textContent).toBe('٨٥')
    expect(result().textContent).toContain('١ فبراير ٢٠٢٧')
  })
})

import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { AeHubContent } from './AeHubContent'

describe('AeHubContent', () => {
  it('renders one bold English hero h1 and cards for every UAE tool', async () => {
    renderWithRouter(<AeHubContent lang="en" />)
    const h1s = await screen.findAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0].textContent).toBe(
      'Get ready for UAE e-invoicing in 2027 — Arabic-first invoicing for your business',
    )
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/ae/tools/trn-checker?lang=en',
        '/ae/tools/vat-calculator?lang=en',
        '/ae/tools/invoice-generator?lang=en',
        '/ae/tools/e-invoicing-readiness?lang=en',
        '/ae/guides/uae-e-invoicing-2027?lang=en',
      ]),
    )
  })

  it('renders Arabic by default with clean URLs', async () => {
    renderWithRouter(<AeHubContent lang="ar" />)
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/الإمارات/)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/ae/tools/trn-checker')
    expect(hrefs.some((h) => h?.includes('lang=en'))).toBe(false)
  })

  it('states the go-live dates with a verify caveat and no affiliation', async () => {
    renderWithRouter(<AeHubContent lang="en" />)
    await screen.findByRole('heading', { level: 1 })
    const text = document.body.textContent
    expect(text).toMatch(/per MoF\/FTA guidance/i)
    expect(text).toMatch(/verify before relying/i)
    expect(text).toMatch(
      /not affiliated with the FTA or the Ministry of Finance/i,
    )
  })

  it('lets the card CTAs wrap so cards fit 320px screens', async () => {
    renderWithRouter(<AeHubContent lang="en" />)
    const cta = await screen.findByRole('link', { name: /Open: Tax invoice generator/ })
    expect(cta.className).toContain('whitespace-normal')
    expect(cta.closest('[data-slot="card"]')?.className).toContain('min-w-0')
    expect(cta.closest('.grid')?.className).toContain('grid-cols-1')
  })
})

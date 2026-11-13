import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { DeadlineStrip } from './DeadlineStrip'

afterEach(() => localStorage.clear())

describe('DeadlineStrip', () => {
  it('shows the Saudi Wave 25 deadline with a link to the wave checker (Arabic-Indic digits)', async () => {
    renderWithRouter(<DeadlineStrip lang="ar" region="sa" />, '/tools')
    const strip = await screen.findByRole('region', { name: 'موعد قادم' })
    expect(strip.textContent).toContain('١ فبراير ٢٠٢٧')
    expect(strip.textContent).not.toMatch(/[0-9]/)
    const link = screen.getByRole('link', { name: /هل منشأتك ضمن الموجة/ })
    expect(link.getAttribute('href')).toBe('/tools/zatca-wave-checker')
  })

  it('shows the UAE 2027 deadline with Latin digits and keeps ?lang', async () => {
    renderWithRouter(<DeadlineStrip lang="en" region="ae" />, '/ae/tools/vat-calculator?lang=en')
    const strip = await screen.findByRole('region', { name: 'Upcoming deadline' })
    expect(strip.textContent).toContain('1 January 2027')
    expect(screen.getByRole('link', { name: /Check your date/ }).getAttribute('href')).toBe(
      '/ae/tools/e-invoicing-readiness?lang=en',
    )
  })

  it('can be dismissed and stays dismissed', async () => {
    const first = renderWithRouter(<DeadlineStrip lang="en" region="sa" />, '/?lang=en')
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('region', { name: 'Upcoming deadline' })).toBeNull()
    first.unmount()

    renderWithRouter(<DeadlineStrip lang="en" region="sa" />, '/?lang=en')
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Upcoming deadline' })).toBeNull(),
    )
  })
})

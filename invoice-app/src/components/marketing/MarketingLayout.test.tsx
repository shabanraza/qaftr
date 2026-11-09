import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

vi.mock('#/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
}))
vi.mock('#/components/instant-invoice/AuthGateDialog', () => ({
  AuthGateDialog: ({
    open,
    initialMode,
  }: {
    open: boolean
    initialMode: string
  }) => (open ? <div data-testid="auth-dialog">{initialMode}</div> : null),
}))

vi.mock('#/lib/marketing/region-geo', () => ({
  getVisitorCountry: () => Promise.resolve({ country: null }),
}))

const { MarketingLayout } = await import('./MarketingLayout')

function renderLayout(lang: 'ar' | 'en', path = '/') {
  return renderWithRouter(
    <MarketingLayout lang={lang}>
      <p>body</p>
    </MarketingLayout>,
    path,
  )
}

describe('MarketingLayout header', () => {
  it('no longer shows the misleading "coming soon to stores" badge', async () => {
    renderLayout('en')
    await screen.findByText('body')
    expect(document.body.textContent).not.toMatch(/Coming soon to stores/)
    renderLayout('ar')
    expect(document.body.textContent).not.toMatch(/قريباً على المتاجر/)
  })

  it('has an accessible mobile menu with every destination and account action', async () => {
    renderLayout('en')
    await screen.findByText('body')
    const toggle = screen.getByRole('button', { name: 'Open menu' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    const dialog = await screen.findByRole('dialog', { name: 'Menu' })
    const links = within(within(dialog).getByRole('navigation', { name: 'Main menu' }))
      .getAllByRole('link')
      .map((a) => [a.textContent.trim(), a.getAttribute('href')])
    expect(links).toEqual([
      ['Free tools', '/tools?lang=en'],
      ['UAE', '/ae?lang=en'],
      ['Features', '/?lang=en#features'],
      ['Pricing', '/?lang=en#pricing'],
      ['Support', '/support?lang=en'],
    ])
    expect(within(dialog).getByRole('button', { name: 'Sign in' })).toBeTruthy()
    expect(
      within(dialog).getByRole('button', { name: 'Create account' }),
    ).toBeTruthy()
  })

  it('closes the menu when a link is followed', async () => {
    renderLayout('ar')
    await screen.findByText('body')
    fireEvent.click(screen.getByRole('button', { name: 'فتح القائمة' }))
    const dialog = await screen.findByRole('dialog', { name: 'القائمة' })
    fireEvent.click(within(dialog).getByRole('link', { name: 'الإمارات' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('offers the region choice in the mobile menu, mapped to the equivalent page', async () => {
    renderLayout('en', '/tools/vat-calculator?lang=en')
    await screen.findByText('body')
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog', { name: 'Menu' })
    const region = within(dialog).getByRole('navigation', { name: 'Country' })
    expect(
      within(region).getByRole('link', { name: /UAE · AED/ }).getAttribute('href'),
    ).toBe('/ae/tools/vat-calculator?lang=en')
    fireEvent.click(within(region).getByRole('link', { name: /UAE · AED/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('shows the region picker in the header and region links in the footer', async () => {
    renderLayout('ar', '/tools/fatora')
    await screen.findByText('body')
    expect(screen.getByRole('banner').querySelector('[aria-label="الدولة: السعودية"]')).toBeTruthy()
    const footerRegion = within(screen.getByRole('contentinfo')).getByRole('navigation', {
      name: 'الدولة',
    })
    expect(
      within(footerRegion).getByRole('link', { name: /الإمارات · د.إ/ }).getAttribute('href'),
    ).toBe('/ae/tools/invoice-generator')
  })

  it('scrolls to the in-page section after closing the menu (Features/Pricing)', async () => {
    renderWithRouter(
      <MarketingLayout lang="en">
        <section id="features">features</section>
        <section id="pricing">pricing</section>
      </MarketingLayout>,
      '/?lang=en#pricing',
    )
    await screen.findByText('pricing')
    const scrolled: string[] = []
    const original = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
      scrolled.push(this.id)
    }
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
      const dialog = await screen.findByRole('dialog', { name: 'Menu' })
      fireEvent.click(within(dialog).getByRole('link', { name: 'Features' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      await waitFor(() => expect(scrolled).toContain('features'))
      // focus is not returned to the trigger (that would jump back to the top)
      expect(document.activeElement?.getAttribute('aria-label')).not.toBe('Open menu')
    } finally {
      HTMLElement.prototype.scrollIntoView = original
    }
  })

  it('opens sign-up from the mobile menu and closes the menu', async () => {
    renderLayout('en')
    await screen.findByText('body')
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create account' }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByTestId('auth-dialog').textContent).toBe('signup')
  })
})

describe('MarketingLayout footer tagline', () => {
  it('uses the Saudi tagline on Saudi pages', async () => {
    renderLayout('en', '/tools')
    await screen.findByText('body')
    expect(screen.getByRole('contentinfo').textContent).toMatch(/Saudi/)
  })

  it('uses a UAE tagline on /ae pages', async () => {
    renderLayout('en', '/ae/tools/trn-checker')
    await screen.findByText('body')
    // The region picker legitimately names Saudi Arabia; check the rest.
    const footerEl = screen.getByRole('contentinfo').cloneNode(true) as HTMLElement
    footerEl.querySelector('[data-region-picker]')?.remove()
    const footer = footerEl.textContent
    expect(footer).toMatch(/UAE/)
    expect(footer).not.toMatch(/ZATCA|Saudi/)
  })
  it('uses the Arabic UAE tagline on /ae in Arabic', async () => {
    renderLayout('ar', '/ae')
    await screen.findByText('body')
    expect(screen.getByRole('contentinfo').textContent).toMatch(/الإمارات/)
  })

  it('shows the copyright year in Arabic-Indic digits on Saudi Arabic pages', async () => {
    renderLayout('ar', '/')
    await screen.findByText('body')
    const footer = screen.getByRole('contentinfo').textContent ?? ''
    expect(footer).toMatch(/© [٠-٩]{4}/)
    expect(footer).not.toMatch(/[0-9]/)
  })

  it('keeps Latin digits for the year on UAE Arabic pages', async () => {
    renderLayout('ar', '/ae')
    await screen.findByText('body')
    expect(screen.getByRole('contentinfo').textContent).toMatch(/© \d{4}/)
  })
})

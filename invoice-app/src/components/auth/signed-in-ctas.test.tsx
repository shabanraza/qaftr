import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

/**
 * A signed-in user must never be asked to create an account. Every sign-up
 * CTA outside the header (which has its own test) is checked here with a
 * signed-out and a signed-in session.
 */
const session = vi.hoisted(() => ({ current: null as null | { user: { id: string; email: string } } }))
vi.mock('#/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: session.current }),
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
}))
vi.mock('#/integrations/trpc/react', () => ({
  useTRPC: () => ({ instantInvoice: { save: { mutationOptions: () => ({}) } } }),
}))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync: vi.fn(async () => ({ id: 'inv_1' })), isPending: false }),
}))
vi.mock('#/components/instant-invoice/AuthGateDialog', () => ({
  AuthGateDialog: ({ open }: { open: boolean }) => (open ? <div role="dialog">auth</div> : null),
}))
vi.mock('#/lib/instant-invoice/invoice-pdf', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- vi.mock factory
  const actual = await importOriginal<typeof import('#/lib/instant-invoice/invoice-pdf')>()
  return { ...actual, downloadInvoicePdf: vi.fn(async () => {}) }
})
vi.mock('#/lib/analytics/track', () => ({ track: vi.fn() }))
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const { AccountCta } = await import('#/components/marketing/AccountCta')
const { InstantInvoiceTool } = await import('#/components/instant-invoice/InstantInvoiceTool')
const { ZatcaWaveChecker } = await import('#/components/tools/ZatcaWaveChecker')
const { ReceiptVoucherTool } = await import('#/components/documents/ReceiptVoucherTool')

const SIGNED_IN = { user: { id: 'u1', email: 'owner@example.com' } }
const SIGNUP = /Create (a free )?account|أنشئ حساب|إنشاء حساب/

beforeEach(() => {
  session.current = null
})

describe('AccountCta (home hero and Pro pricing card)', () => {
  it('asks a signed-out visitor to create an account', async () => {
    const onSignUp = vi.fn()
    renderWithRouter(<AccountCta lang="en" label="Create a free account" onSignUp={onSignUp} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create a free account' }))
    expect(onSignUp).toHaveBeenCalledTimes(1)
  })

  it('sends a signed-in user to the Money desk instead', async () => {
    session.current = SIGNED_IN
    renderWithRouter(<AccountCta lang="ar" label="أنشئ حساباً مجانياً" onSignUp={vi.fn()} />)
    const link = await screen.findByRole('link', { name: 'اذهب إلى مكتب المال' })
    expect(link.getAttribute('href')).toBe('/workspace')
    expect(screen.queryByText(SIGNUP)).toBeNull()
  })
})

describe('invoice tool "Invoice downloaded" card', () => {
  it('offers to save the invoice, not to sign up, when signed in', async () => {
    session.current = SIGNED_IN
    renderWithRouter(<InstantInvoiceTool lang="en" />)
    fireEvent.change(await screen.findByLabelText('Trade name'), { target: { value: 'Qaftr Trading' } })
    fireEvent.change(screen.getByLabelText('VAT number'), { target: { value: '300000000000003' } })
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Riyadh, Olaya' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Item 1: Description' }), { target: { value: 'Supply' } })
    fireEvent.change(screen.getByRole('textbox', { name: /^Item 1: Unit price/ }), { target: { value: '100' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Download PDF' })[0]!)
    const result = await screen.findByRole('region', { name: 'Invoice downloaded' })
    expect(within(result).getByRole('button', { name: 'Save to my invoices' })).toBeTruthy()
    expect(within(result).queryByText(SIGNUP)).toBeNull()
  })
})

describe('wave checker reminder box', () => {
  async function checkWave() {
    renderWithRouter(<ZatcaWaveChecker lang="en" today="2026-11-08" />)
    await screen.findByRole('heading', { name: /Quick questions/ })
    fireEvent.click(screen.getAllByRole('radiogroup')[0]!.querySelector('[role="radio"][value="yes"]')!)
    fireEvent.change(document.getElementById('wave-revenue-2024')!, { target: { value: '200,000' } })
    fireEvent.click(screen.getByRole('button', { name: /Check my wave/ }))
    return screen.getByRole('region', { name: 'Remind me about the deadline' })
  }

  it('invites a signed-out visitor to create an account', async () => {
    const box = await checkWave()
    expect(within(box).getByRole('button', { name: 'Create a free account' })).toBeTruthy()
  })

  it('does not invite a signed-in user to create an account', async () => {
    session.current = SIGNED_IN
    const box = await checkWave()
    expect(within(box).queryByText(SIGNUP)).toBeNull()
  })
})

describe('document tools save box', () => {
  it('shows the sign-up box to a signed-out visitor', async () => {
    renderWithRouter(<ReceiptVoucherTool lang="en" />)
    expect(await screen.findByTestId('doc-save')).toBeTruthy()
  })

  it('hides the sign-up box from a signed-in user', async () => {
    session.current = SIGNED_IN
    renderWithRouter(<ReceiptVoucherTool lang="en" />)
    await screen.findAllByRole('button', { name: /Download PDF/ })
    await waitFor(() => expect(screen.queryByTestId('doc-save')).toBeNull())
    expect(screen.queryByText(SIGNUP)).toBeNull()
  })
})

describe('home live-demo copy', () => {
  it('has a signed-in label and hint that do not pitch an account', async () => {
    const { getHomeContent } = await import('#/lib/marketing/home-content')
    for (const lang of ['ar', 'en'] as const) {
      const d = getHomeContent(lang).demo
      expect(`${d.signedInLabel} ${d.signedInHint}`).not.toMatch(/account|sign-up|حساب|تسجيل/i)
    }
  })
})

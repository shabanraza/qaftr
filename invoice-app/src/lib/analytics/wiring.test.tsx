import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

// Call sites → analytics. track() and the debounced hook are spied on here;
// their own behaviour is covered in track.test.ts / use-track-result.test.tsx.
const spies = vi.hoisted(() => ({
  track: vi.fn(),
  useTrackToolResult: vi.fn(),
  signUp: vi.fn(async () => ({ error: null })),
  signIn: vi.fn(async () => ({ error: null })),
}))
vi.mock('#/lib/analytics/track', () => ({ track: spies.track }))
vi.mock('#/lib/analytics/use-track-result', () => ({ useTrackToolResult: spies.useTrackToolResult }))
vi.mock('#/lib/invoice/pdf-render', () => ({
  htmlToPdfBlob: vi.fn(async () => new Blob(['%PDF'])),
  downloadBlob: vi.fn(),
}))
vi.mock('#/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
    signUp: { email: spies.signUp },
    signIn: { email: spies.signIn },
  },
}))

const { VatCalculatorTool } = await import('#/components/tools/VatCalculatorTool')
const { TrnCheckerTool } = await import('#/components/tools/TrnCheckerTool')
const { UaeVatCalculatorTool } = await import('#/components/ae/UaeVatCalculatorTool')
const { UaeTrnCheckerTool } = await import('#/components/ae/UaeTrnCheckerTool')
const { ZatcaWaveChecker } = await import('#/components/tools/ZatcaWaveChecker')
const { UaeReadinessQuiz } = await import('#/components/ae/UaeReadinessQuiz')
const { UaeInvoiceGenerator } = await import('#/components/ae/UaeInvoiceGenerator')
const { AuthGateDialog } = await import('#/components/instant-invoice/AuthGateDialog')

beforeEach(() => {
  spies.track.mockClear()
  spies.useTrackToolResult.mockClear()
  localStorage.clear()
})

const lastHookCall = () => spies.useTrackToolResult.mock.calls.at(-1) as unknown[]
const type = (el: Element, value: string) => fireEvent.change(el, { target: { value } })

describe('live tools report a settled result via useTrackToolResult', () => {
  it.each([
    ['vat_calculator', VatCalculatorTool, '#vat-amount', '100'],
    ['uae_vat_calculator', UaeVatCalculatorTool, 'input[inputmode="decimal"]', '100'],
    ['trn_checker', TrnCheckerTool, '#trn-input', '300000000000003'],
    ['uae_trn_checker', UaeTrnCheckerTool, '#uae-trn-input', '100123456700003'],
  ] as const)('%s', async (tool, Component, selector, value) => {
    renderWithRouter(<Component lang="en" />)
    await waitFor(() => expect(document.querySelector(selector)).toBeTruthy())
    expect(lastHookCall()[0]).toBe(tool)
    expect(lastHookCall()[1]).toBeNull()
    type(document.querySelector(selector)!, value)
    expect(lastHookCall()[0]).toBe(tool)
    expect(typeof lastHookCall()[1]).toBe('string')
    // TRNs are identifiers: neither the key nor the params may carry them.
    if (value.length >= 15) expect(JSON.stringify(lastHookCall())).not.toContain(value.slice(0, 9))
  })
})

describe('submit tools fire tool_used once per result', () => {
  it('ZATCA wave checker', async () => {
    renderWithRouter(<ZatcaWaveChecker lang="en" today="2026-11-08" />)
    await screen.findByRole('heading', { name: /Quick questions/ })
    fireEvent.click(document.querySelector('input[name="wave-vat"][value="yes"]')!)
    type(document.getElementById('wave-revenue-2024')!, '200,000')
    fireEvent.click(document.querySelector('input[name="wave-notified"][value="no"]')!)
    fireEvent.click(screen.getByRole('button', { name: /Check my wave/ }))
    await screen.findByRole('region', { name: /Your result/ })
    expect(spies.track).toHaveBeenCalledTimes(1)
    expect(spies.track).toHaveBeenCalledWith('tool_used', expect.objectContaining({ tool: 'zatca_wave_checker' }))
  })

  it('UAE readiness quiz', async () => {
    renderWithRouter(<UaeReadinessQuiz lang="en" today="2026-11-08" />)
    await screen.findByTestId('readiness-form')
    fireEvent.click(screen.getByTestId('gov-no'))
    fireEvent.click(screen.getByTestId('customers-b2b'))
    type(screen.getByTestId('revenue-input'), '60000000')
    fireEvent.click(screen.getByTestId('readiness-submit'))
    await screen.findByTestId('readiness-result')
    expect(spies.track).toHaveBeenCalledTimes(1)
    expect(spies.track).toHaveBeenCalledWith('tool_used', expect.objectContaining({ tool: 'uae_readiness_quiz' }))
  })
})

describe('UAE invoice generator', () => {
  it('fires invoice_pdf_download with categories only', async () => {
    renderWithRouter(<UaeInvoiceGenerator lang="en" />)
    await screen.findByRole('heading', { name: /Invoice details/ })
    const field = (label: RegExp, scope: HTMLElement) =>
      within(scope).getByLabelText(label, { selector: 'input,textarea,select' })
    const supplier = screen.getByRole('group', { name: /Supplier/ })
    type(field(/^Name/, supplier), 'Noor Design FZ-LLC')
    type(field(/^Address/, supplier), 'Dubai, UAE')
    type(field(/^TRN/, supplier), '100123456700003')
    const customer = screen.getByRole('group', { name: /^Customer/ })
    type(field(/^Name/, customer), 'Gulf Trading LLC')
    type(field(/^Address/, customer), 'Abu Dhabi, UAE')
    const line = screen.getByRole('group', { name: 'Line 1' })
    type(field(/Description/, line), 'Logo design')
    type(field(/Unit price/, line), '1000')
    fireEvent.click(screen.getAllByRole('button', { name: /Download PDF/ })[0]!)
    await waitFor(() =>
      expect(spies.track).toHaveBeenCalledWith('invoice_pdf_download', {
        tool: 'uae_invoice_generator',
        invoice_type: expect.stringMatching(/^(full|simplified)$/),
        line_count: 1,
        currency: 'AED',
      }),
    )
  })
})

describe('AuthGateDialog', () => {
  it('fires sign_up after a successful sign-up only', async () => {
    const onSuccess = vi.fn()
    renderWithRouter(
      <AuthGateDialog lang="en" open onClose={() => {}} onSuccess={onSuccess} initialMode="signup" context="general" />,
    )
    type(await screen.findByLabelText(/email/i), 'a@b.co')
    type(screen.getByLabelText(/password/i), 'password123')
    spies.signUp.mockResolvedValueOnce({ error: { message: 'taken' } } as never)
    fireEvent.submit(document.querySelector('form')!)
    await screen.findByText('taken')
    expect(spies.track).not.toHaveBeenCalled()

    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(spies.track).toHaveBeenCalledWith('sign_up', { method: 'email', source: 'general' })
    expect(JSON.stringify(spies.track.mock.calls)).not.toContain('a@b.co')
  })
})

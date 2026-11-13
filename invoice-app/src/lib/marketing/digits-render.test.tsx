import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { getInstantInvoiceCopy } from '#/lib/instant-invoice/copy'
import { getToolsCopy } from '#/lib/tools/copy'
// Static imports: the invoice tool pulls in jsPDF/QR and is slow to load; a
// dynamic import inside a test counts against the test timeout.
import { InstantInvoiceTool } from '#/components/instant-invoice/InstantInvoiceTool'
import { VatCalculatorTool } from '#/components/tools/VatCalculatorTool'
import { ToolsHubGrid } from '#/components/tools/ToolsHubGrid'
import { AeCrossLinkCard } from '#/components/ae/AeCrossLinkCard'

/**
 * Saudi Arabic UI uses Arabic-Indic digits, including strings that are built
 * in components or by copy functions (e.g. «بند ١»). Complements digits.test.ts,
 * which only scans string literals in copy files.
 */
vi.mock('#/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null }), getSession: vi.fn() },
}))
vi.mock('#/integrations/trpc/react', () => ({
  useTRPC: () => ({ instantInvoice: { save: { mutationOptions: () => ({}) } } }),
}))
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const ARABIC = /[؀-ۿ]/
const LATIN_DIGIT = /[0-9]/
// Typed-input examples (amountPlaceholder) may show Latin digits.
const ALLOWED = /^مثال: [0-9]+$/

/** Visible text and accessible names that mix Arabic letters with Latin digits. */
function mixedStrings(root: HTMLElement): string[] {
  const out: string[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n.textContent ?? '')
  root.querySelectorAll('*').forEach((el) => {
    for (const attr of ['aria-label', 'placeholder', 'title', 'alt']) {
      const v = el.getAttribute(attr)
      if (v) out.push(v)
    }
  })
  return out.filter((s) => ARABIC.test(s) && LATIN_DIGIT.test(s) && !ALLOWED.test(s))
}

function collect(v: unknown, out: string[]): string[] {
  if (typeof v === 'string') out.push(v)
  else if (typeof v === 'function') {
    try {
      const r: unknown = (v as (n: number, m?: string) => unknown)(3, '')
      if (typeof r === 'string') out.push(r)
    } catch {
      /* needs richer arguments: covered by the render checks */
    }
  } else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, out))
  return out
}

describe('Saudi Arabic digits in built strings', () => {
  it('copy functions return Arabic-Indic digits', () => {
    const strings = collect([getInstantInvoiceCopy('ar'), getToolsCopy('ar')], [])
    expect(strings.filter((s) => ARABIC.test(s) && LATIN_DIGIT.test(s) && !ALLOWED.test(s))).toEqual([])
  })

  it('invoice tool (home and /tools/fatora)', async () => {
    const { container } = renderWithRouter(<InstantInvoiceTool lang="ar" />)
    await screen.findAllByRole('radio')
    expect(mixedStrings(container)).toEqual([])
  })

  it('VAT calculator', async () => {
    const { container } = renderWithRouter(<VatCalculatorTool lang="ar" />)
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: '100' } })
    expect(mixedStrings(container)).toEqual([])
  })

  it('/tools hub cards and UAE cross-link', async () => {
    const { container } = renderWithRouter(
      <>
        <ToolsHubGrid lang="ar" />
        <AeCrossLinkCard lang="ar" />
      </>,
    )
    await screen.findAllByRole('link')
    expect(mixedStrings(container)).toEqual([])
  })
})

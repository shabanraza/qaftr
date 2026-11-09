import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTrackToolResult } from './use-track-result'

type W = typeof window & {
  gtag?: (...args: unknown[]) => void
  __qaftrAnalytics?: boolean
}
const w = window as W

beforeEach(() => {
  vi.useFakeTimers()
  w.gtag = vi.fn()
  w.__qaftrAnalytics = true
})
afterEach(() => {
  vi.useRealTimers()
  delete w.gtag
  delete w.__qaftrAnalytics
})

const toolCalls = () =>
  (w.gtag as ReturnType<typeof vi.fn>).mock.calls.filter((c) => c[1] === 'tool_used')

describe('useTrackToolResult', () => {
  it('fires once per settled result, not per keystroke', () => {
    const { rerender } = renderHook(({ k }: { k: string | null }) => useTrackToolResult('vat_calculator', k), {
      initialProps: { k: null as string | null },
    })
    rerender({ k: '1' })
    vi.advanceTimersByTime(300)
    rerender({ k: '10' })
    vi.advanceTimersByTime(300)
    rerender({ k: '100' })
    expect(toolCalls()).toHaveLength(0)
    vi.advanceTimersByTime(1500)
    expect(toolCalls()).toHaveLength(1)
    expect(toolCalls()[0][2]).toMatchObject({ tool: 'vat_calculator' })

    // Same result again: no duplicate.
    rerender({ k: '100' })
    vi.advanceTimersByTime(2000)
    expect(toolCalls()).toHaveLength(1)

    // New settled result: one more.
    rerender({ k: '250' })
    vi.advanceTimersByTime(2000)
    expect(toolCalls()).toHaveLength(2)
  })

  it('does nothing without a result', () => {
    renderHook(() => useTrackToolResult('trn_checker', null))
    vi.advanceTimersByTime(5000)
    expect(toolCalls()).toHaveLength(0)
  })

  it('passes extra params', () => {
    renderHook(() => useTrackToolResult('uae_trn_checker', 'valid', { result: 'valid' }))
    vi.advanceTimersByTime(2000)
    expect(toolCalls()[0][2]).toMatchObject({ tool: 'uae_trn_checker', result: 'valid' })
  })
})

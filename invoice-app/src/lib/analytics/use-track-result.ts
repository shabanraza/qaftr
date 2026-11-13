import { useEffect, useRef } from 'react'
import { track } from './track'
import type { AnalyticsEvents, ToolName } from './track'

export const TOOL_RESULT_SETTLE_MS = 1500

/**
 * Fires `tool_used` once a live tool's result has been stable for a moment
 * (calculators recompute on every keystroke). `resultKey` identifies the
 * result (null = no result); the same key never fires twice in a row.
 */
export function useTrackToolResult(
  tool: ToolName,
  resultKey: string | null,
  extra?: Omit<AnalyticsEvents['tool_used'], 'tool'>,
) {
  const lastKey = useRef<string | null>(null)
  const extraRef = useRef(extra)
  extraRef.current = extra

  useEffect(() => {
    if (resultKey === null || resultKey === lastKey.current) return
    const timer = setTimeout(() => {
      lastKey.current = resultKey
      track('tool_used', { tool, ...extraRef.current })
    }, TOOL_RESULT_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [tool, resultKey])
}

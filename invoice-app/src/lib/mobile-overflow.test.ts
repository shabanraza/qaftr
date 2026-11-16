import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Mobile layout guard. An absolutely positioned child (sr-only labels, hidden
 * file inputs) whose nearest positioned ancestor sits OUTSIDE a horizontal
 * scroll box is not clipped by it. On a phone it then stretches the whole page
 * (seen on the home comparison table and the QR reader at 375px). Every
 * horizontal scroll box therefore has to be `relative`.
 */
const root = join(process.cwd(), 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx$/.test(name) && !/\.test\.tsx$/.test(name) ? [path] : []
  })
}

describe('horizontal scroll boxes on mobile', () => {
  it('every overflow-x-auto element is also relative', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(root)) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(/className="([^"]*\boverflow-x-auto\b[^"]*)"/g)) {
        if (!/\b(relative|absolute|fixed|sticky)\b/.test(match[1])) {
          offenders.push(`${file.slice(root.length + 1)}: ${match[1]}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('the QR reader keeps its hidden file input inside a positioned row', () => {
    const text = readFileSync(join(root, 'components/tools/ZatcaQrDecoder.tsx'), 'utf8')
    const before = text.slice(0, text.indexOf('type="file"'))
    const row = before.slice(before.lastIndexOf('<div className="'))
    expect(row).toMatch(/^<div className="[^"]*\brelative\b/)
  })
})

import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/** The page must not scroll sideways (classic RTL / long-number bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement
    const width = doc.clientWidth
    const offenders: string[] = []
    if (doc.scrollWidth > width + 1) {
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        const r = el.getBoundingClientRect()
        if (r.width === 0) continue
        if (r.right > width + 1 || r.left < -1) {
          const style = getComputedStyle(el)
          if (style.position === 'fixed') continue
          offenders.push(
            `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${String(el.className).slice(0, 60)} [${Math.round(r.left)}..${Math.round(r.right)}]`,
          )
          if (offenders.length >= 5) break
        }
      }
    }
    return { scrollWidth: doc.scrollWidth, width, offenders }
  })
  expect(
    result.scrollWidth,
    `horizontal overflow (viewport ${result.width}px): ${result.offenders.join(' | ')}`,
  ).toBeLessThanOrEqual(result.width + 1)
}

/** Element's content must fit its box and its children must sit on one row. */
export async function expectSingleRowNoOverflow(container: Locator) {
  const info = await container.evaluate((el) => {
    const children = Array.from(el.children).filter(
      (c) => (c as HTMLElement).offsetParent !== null,
    )
    const boxes = children.map((c) => c.getBoundingClientRect())
    // One row = every visible child shares some horizontal band (items are
    // vertically centred, so their tops differ slightly).
    const maxTop = Math.max(...boxes.map((b) => b.top))
    const minBottom = Math.min(...boxes.map((b) => b.bottom))
    // Also catch wrapping *inside* a child (e.g. the action buttons).
    const innerWrap = children.some((c) => {
      const kids = Array.from(c.children).filter((k) => (k as HTMLElement).offsetParent !== null)
      const r = kids.map((k) => k.getBoundingClientRect())
      return r.length > 1 && Math.max(...r.map((b) => b.top)) >= Math.min(...r.map((b) => b.bottom))
    })
    return {
      overflow: el.scrollWidth - el.clientWidth,
      oneRow: maxTop < minBottom && !innerWrap,
      boxes: boxes.map((b) => `${Math.round(b.top)}-${Math.round(b.bottom)}`).join(','),
    }
  })
  expect(info.overflow, 'header content overflows').toBeLessThanOrEqual(1)
  expect(info.oneRow, `header wraps (child boxes ${info.boxes})`).toBe(true)
}

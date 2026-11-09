import { describe, expect, it } from 'vitest'
import { ctaFromElement, switchEvents } from './listeners'

describe('switchEvents', () => {
  it('reports a language switch', () => {
    expect(
      switchEvents({ pathname: '/tools/fatora', search: '' }, { pathname: '/tools/fatora', search: '?lang=en' }),
    ).toEqual([{ name: 'language_switch', params: { from: 'ar', to: 'en' } }])
  })

  it('reports a region switch', () => {
    expect(
      switchEvents({ pathname: '/', search: '?lang=en' }, { pathname: '/ae', search: '?lang=en' }),
    ).toEqual([{ name: 'region_switch', params: { from: 'sa', to: 'ae' } }])
  })

  it('reports both, and nothing for same-region navigation', () => {
    expect(switchEvents({ pathname: '/ae', search: '' }, { pathname: '/', search: '?lang=en' })).toHaveLength(2)
    expect(switchEvents({ pathname: '/', search: '' }, { pathname: '/tools/fatora', search: '' })).toEqual([])
  })
})

function el(html: string) {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)
  return host
}

describe('ctaFromElement', () => {
  it('uses data-cta when present, with a page section', () => {
    const host = el('<header><a data-cta="header_signup" href="/x"><span>Go</span></a></header>')
    expect(ctaFromElement(host.querySelector('span')!)).toEqual({ cta: 'header_signup', cta_location: 'header' })
  })

  it('treats .qaftr-btn-primary as a primary CTA, named by its link target', () => {
    const host = el('<main><a class="qaftr-btn-primary" href="/ae/tools/invoice-generator?lang=en">Start</a></main>')
    expect(ctaFromElement(host.querySelector('a')!)).toEqual({
      cta: '/ae/tools/invoice-generator',
      cta_location: 'main',
    })
    const hash = el('<main><a class="qaftr-btn-primary" href="#invoice-tool">Start</a></main>')
    expect(ctaFromElement(hash.querySelector('a')!)?.cta).toBe('#invoice-tool')
  })

  it('ignores ordinary links and buttons', () => {
    const host = el('<main><a href="/privacy">Privacy</a><button>ok</button></main>')
    expect(ctaFromElement(host.querySelector('a')!)).toBeNull()
    expect(ctaFromElement(host.querySelector('button')!)).toBeNull()
  })
})

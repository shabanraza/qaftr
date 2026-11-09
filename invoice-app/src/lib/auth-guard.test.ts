import { describe, expect, it } from 'vitest'
import { buildSignedOutRedirect } from './auth-guard'

describe('buildSignedOutRedirect', () => {
  it('sends signed-out visitors to the home invoice tool, keeping English', () => {
    expect(buildSignedOutRedirect({ lang: 'en' })).toEqual({
      to: '/',
      hash: 'invoice-tool',
      search: { lang: 'en' },
    })
  })

  it('uses the clean Arabic URL otherwise', () => {
    expect(buildSignedOutRedirect({})).toEqual({
      to: '/',
      hash: 'invoice-tool',
      search: {},
    })
    expect(buildSignedOutRedirect(undefined)).toEqual({
      to: '/',
      hash: 'invoice-tool',
      search: {},
    })
  })
})

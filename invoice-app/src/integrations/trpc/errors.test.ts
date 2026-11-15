// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { sanitizeClientMessage } from './errors'

describe('sanitizeClientMessage', () => {
  it('passes allow-listed codes and hides everything else', () => {
    expect(sanitizeClientMessage('CLIENT_NOT_FOUND')).toBe('CLIENT_NOT_FOUND')
    expect(sanitizeClientMessage('Failed query: select * from "user"')).toBe('INTERNAL_ERROR')
    expect(sanitizeClientMessage('something odd happened')).toBe('INTERNAL_ERROR')
  })

  it('lets the accountant seat screens tell the user what went wrong', () => {
    for (const code of ['NO_ACCESS', 'TOO_MANY_ACCOUNTANTS', 'SEAT_NOT_FOUND', 'INVITE_NOT_FOUND', 'INVITE_EXPIRED', 'INVITE_REVOKED', 'INVITE_ALREADY_USED', 'INVITE_OWN_BUSINESS']) {
      expect(sanitizeClientMessage(code)).toBe(code)
    }
  })

  it('passes structured profile field errors so forms can highlight fields', () => {
    expect(sanitizeClientMessage('INVALID_PROFILE:crNumber:INVALID_CR,postalCode:INVALID_POSTAL')).toBe(
      'INVALID_PROFILE:crNumber:INVALID_CR,postalCode:INVALID_POSTAL',
    )
  })

  it('does not let free text ride along a profile error', () => {
    expect(sanitizeClientMessage('INVALID_PROFILE:crNumber:INVALID_CR, password=hunter2')).toBe('INTERNAL_ERROR')
    expect(sanitizeClientMessage('INVALID_PROFILE:')).toBe('INTERNAL_ERROR')
    expect(sanitizeClientMessage('INVALID_PROFILE:email:whatever')).toBe('INTERNAL_ERROR')
  })
})

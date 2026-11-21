import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PartyFields } from './PartyFields'
import { getPartyCopy } from '#/lib/zatca/party-copy'

describe.each([
  ['en', 'No ID selected'],
  ['ar', 'لم تُختر هوية'],
] as const)('PartyFields ID type picker (%s)', (lang, emptyLabel) => {
  it('labels the empty option instead of showing a bare dash', () => {
    render(
      <PartyFields
        idPrefix="t"
        keys={['idScheme']}
        values={{}}
        onChange={vi.fn()}
        issues={[]}
        copy={getPartyCopy(lang)}
      />,
    )
    const select = screen.getByLabelText(lang === 'en' ? 'ID type' : 'نوع الهوية') as HTMLSelectElement
    expect(select.options[0]!.text).toBe(emptyLabel)
    expect(select.options[0]!.text).not.toBe('—')
  })
})

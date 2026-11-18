import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

vi.mock('#/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'u1', email: 'owner@example.com' } },
    }),
  },
}))

const { ProCardCta } = await import('./ProCardCta')
const { PRO_CHECKOUT_OPEN } = await import('#/lib/billing/launch')

describe('ProCardCta (home Pro pricing card)', () => {
  it('shows a disabled "Coming soon" button while Pro checkout is closed', async () => {
    renderWithRouter(<ProCardCta lang="en" onSignUp={vi.fn()} open={false} />)
    const button = await screen.findByRole('button', { name: 'Coming soon' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).toBeNull()
  })

  it('says "Coming soon" in Arabic', async () => {
    renderWithRouter(<ProCardCta lang="ar" onSignUp={vi.fn()} open={false} />)
    expect(
      (
        (await screen.findByRole('button', {
          name: 'قريباً',
        })) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })

  it('links a signed-in user to Plan & billing once checkout is open', async () => {
    renderWithRouter(<ProCardCta lang="en" onSignUp={vi.fn()} open />)
    expect(
      (
        await screen.findByRole('link', { name: 'Upgrade to Pro' })
      ).getAttribute('href'),
    ).toBe('/workspace/billing?lang=en')
  })

  it('stays closed until Polar account review is done', () => {
    expect(PRO_CHECKOUT_OPEN).toBe(false)
  })
})

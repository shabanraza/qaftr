import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

const session = vi.hoisted(() => ({
  value: { data: null as null | { user: { id: string } }, isPending: false },
}))
vi.mock('#/lib/auth-client', () => ({
  authClient: { useSession: () => session.value },
}))

const { ClientAuthGuard } = await import('./ClientAuthGuard')

describe('ClientAuthGuard', () => {
  beforeEach(() => {
    session.value = { data: null, isPending: false }
  })

  it('redirects signed-out visitors home to the invoice tool, keeping ?lang=en', async () => {
    const { router } = renderWithRouter(
      <ClientAuthGuard>
        <p>private shell</p>
      </ClientAuthGuard>,
      '/workspace?lang=en',
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(router.state.location.hash).toBe('invoice-tool')
    expect(router.state.location.search).toEqual({ lang: 'en' })
    expect(screen.queryByText('private shell')).toBeNull()
  })

  it('shows a loading state, not the private shell, while the session is pending', async () => {
    session.value = { data: null, isPending: true }
    const { router } = renderWithRouter(
      <ClientAuthGuard>
        <p>private shell</p>
      </ClientAuthGuard>,
      '/workspace',
    )
    await screen.findByRole('status')
    expect(screen.queryByText('private shell')).toBeNull()
    expect(router.state.location.pathname).toBe('/workspace')
  })

  it('renders the workspace for signed-in users', async () => {
    session.value = { data: { user: { id: 'u1' } }, isPending: false }
    renderWithRouter(
      <ClientAuthGuard>
        <p>private shell</p>
      </ClientAuthGuard>,
      '/workspace',
    )
    expect(await screen.findByText('private shell')).toBeTruthy()
  })
})

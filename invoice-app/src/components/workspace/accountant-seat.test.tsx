import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'
import { AccountantAccessCard } from './AccountantAccessCard'
import { AcceptInviteCard } from './AcceptInviteCard'
import { FirmClientsList } from './FirmClientsList'
import { getWorkspaceNav, workspaceSectionForPath } from './workspace-nav'
import { isPrivatePath } from '#/lib/marketing/seo'

const D = new Date('2026-11-16T10:00:00Z')
const member = (over: Record<string, unknown> = {}) => ({
  id: 'm1',
  email: 'acc@firm.sa',
  state: 'pending' as const,
  accountantName: null,
  accountantEmail: null,
  expiresAt: new Date('2026-11-30T10:00:00Z'),
  createdAt: D,
  acceptedAt: null,
  ...over,
})

describe('AccountantAccessCard (business owner)', () => {
  const base = { lang: 'en' as const, members: [], inviteLink: null, creating: false, error: null, onInvite: vi.fn(), onRevoke: vi.fn(), onDismissLink: vi.fn() }

  it('explains that an accountant gets read-only access', async () => {
    renderWithRouter(<AccountantAccessCard {...base} />)
    expect(await screen.findByText(/read-only/i)).toBeTruthy()
    expect(screen.getByText(/cannot change/i)).toBeTruthy()
  })

  it('creates an invite with the optional email', async () => {
    const onInvite = vi.fn()
    renderWithRouter(<AccountantAccessCard {...base} onInvite={onInvite} />)
    fireEvent.change(await screen.findByLabelText(/Accountant email/i), { target: { value: 'acc@firm.sa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create invite link' }))
    expect(onInvite).toHaveBeenCalledWith('acc@firm.sa')
  })

  it('creates an invite without an email', async () => {
    const onInvite = vi.fn()
    renderWithRouter(<AccountantAccessCard {...base} onInvite={onInvite} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Create invite link' }))
    expect(onInvite).toHaveBeenCalledWith(undefined)
  })

  it('shows the link once with copy and WhatsApp share', async () => {
    renderWithRouter(<AccountantAccessCard {...base} inviteLink="https://qaftr.com/accept-invite?token=abc" />)
    const field = await screen.findByLabelText<HTMLInputElement>('Invite link')
    expect(field.value).toBe('https://qaftr.com/accept-invite?token=abc')
    expect(field.readOnly).toBe(true)
    const wa = screen.getByRole('link', { name: /WhatsApp/ })
    expect(new URL(wa.getAttribute('href')!).searchParams.get('text')).toContain('https://qaftr.com/accept-invite?token=abc')
    expect(screen.getByText(/shown once/i)).toBeTruthy()
  })

  it('lists accountants with their state and lets the owner revoke', async () => {
    const onRevoke = vi.fn()
    renderWithRouter(
      <AccountantAccessCard
        {...base}
        onRevoke={onRevoke}
        members={[
          member(),
          member({ id: 'm2', state: 'active', accountantName: 'Sara', accountantEmail: 'sara@firm.sa', email: null }),
          member({ id: 'm3', state: 'expired', email: 'old@firm.sa' }),
        ]}
      />,
    )
    const list = await screen.findByRole('list', { name: 'Accountants' })
    expect(within(list).getByText('Pending')).toBeTruthy()
    expect(within(list).getByText('Active')).toBeTruthy()
    expect(within(list).getByText('Expired')).toBeTruthy()
    expect(within(list).getByText('Sara')).toBeTruthy()
    fireEvent.click(within(list).getAllByRole('button', { name: /Remove access/ })[1]!)
    expect(onRevoke).toHaveBeenCalledWith('m2')
  })

  it('shows a readable error and never the raw code', async () => {
    renderWithRouter(<AccountantAccessCard {...base} error="TOO_MANY_ACCOUNTANTS" />)
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).not.toContain('TOO_MANY')
  })

  it('is in Arabic with Arabic-Indic digits', async () => {
    renderWithRouter(<AccountantAccessCard {...base} lang="ar" inviteLink="https://qaftr.com/accept-invite?token=abc" />)
    expect(await screen.findByText(/صلاحية القراءة فقط/)).toBeTruthy()
    expect(screen.getByText(/١٤ يوماً/)).toBeTruthy()
  })
})

describe('AcceptInviteCard (accountant)', () => {
  const base = { lang: 'en' as const, signedIn: true, status: 'idle' as const, errorCode: null, businessName: null, onAccept: vi.fn(), onSignIn: vi.fn() }

  it('asks a signed-out visitor to sign in first', async () => {
    const onSignIn = vi.fn()
    renderWithRouter(<AcceptInviteCard {...base} signedIn={false} onSignIn={onSignIn} />)
    fireEvent.click(await screen.findByRole('button', { name: /Sign in or create account/ }))
    expect(onSignIn).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Accept access' })).toBeNull()
  })

  it('needs an explicit click to accept, never accepts by itself', async () => {
    const onAccept = vi.fn()
    renderWithRouter(<AcceptInviteCard {...base} onAccept={onAccept} />)
    expect(onAccept).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Accept access' }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('links to the client books after accepting', async () => {
    renderWithRouter(<AcceptInviteCard {...base} status="done" businessName="Horizon Co." />)
    expect(await screen.findByText(/Horizon Co\./)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Open client books' }).getAttribute('href')).toBe('/workspace/firm?lang=en')
  })

  it.each([
    ['INVITE_EXPIRED', /expired/i],
    ['INVITE_REVOKED', /withdrawn|removed/i],
    ['INVITE_ALREADY_USED', /already been used/i],
    ['INVITE_NOT_FOUND', /not valid/i],
    ['INVITE_OWN_BUSINESS', /your own business/i],
  ])('explains %s', async (code, text) => {
    renderWithRouter(<AcceptInviteCard {...base} status="error" errorCode={code} />)
    expect((await screen.findByRole('alert')).textContent).toMatch(text)
  })
})

describe('FirmClientsList (accountant)', () => {
  const client = (over: Record<string, unknown> = {}) => ({
    membershipId: 'm1',
    businessId: 'b1',
    nameAr: 'مؤسسة الأفق',
    nameEn: 'Horizon Est.',
    vatNumber: '300000000000003',
    since: D,
    invoiceCount: 12,
    lastIssued: '2026-11-10',
    phase2: 'started' as const,
    ...over,
  })

  it('shows each client with its invoice count, VAT number and Phase 2 progress', async () => {
    renderWithRouter(
      <FirmClientsList
        lang="en"
        isLoading={false}
        clients={[client(), client({ membershipId: 'm2', businessId: 'b2', nameEn: 'Dune Trading', nameAr: 'الكثيب', phase2: 'none', invoiceCount: 0, lastIssued: null })]}
        onLeave={vi.fn()}
      />,
    )
    expect(await screen.findByText('Horizon Est.')).toBeTruthy()
    expect(screen.getAllByText('300000000000003').length).toBe(2)
    expect(screen.getByText('Phase 2 started')).toBeTruthy()
    expect(screen.getByText('Phase 2 not started')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Horizon Est\./ }).getAttribute('href')).toBe('/workspace/firm/b1?lang=en')
  })

  it('never calls Phase 2 active a compliance claim', async () => {
    renderWithRouter(<FirmClientsList lang="en" isLoading={false} clients={[client({ phase2: 'active' })]} onLeave={vi.fn()} />)
    expect(await screen.findByText('Phase 2 onboarded')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/compliant|approved|certified/i)
  })

  it('explains how to get access when there are no clients', async () => {
    renderWithRouter(<FirmClientsList lang="en" isLoading={false} clients={[]} onLeave={vi.fn()} />)
    expect(await screen.findByText(/No client businesses yet/)).toBeTruthy()
    expect(screen.getByText(/invite link/i)).toBeTruthy()
  })

  it('lets the accountant stop access to a client', async () => {
    const onLeave = vi.fn()
    renderWithRouter(<FirmClientsList lang="en" isLoading={false} clients={[client()]} onLeave={onLeave} />)
    fireEvent.click(await screen.findByRole('button', { name: /Stop access/ }))
    expect(onLeave).toHaveBeenCalledWith('m1')
  })

  it('shows the Arabic name in Arabic', async () => {
    renderWithRouter(<FirmClientsList lang="ar" isLoading={false} clients={[client()]} onLeave={vi.fn()} />)
    expect(await screen.findByText('مؤسسة الأفق')).toBeTruthy()
  })
})

describe('workspace nav and privacy', () => {
  it('adds the client books item only for accountants with clients', () => {
    expect(getWorkspaceNav('en').some((i) => i.to === '/workspace/firm')).toBe(false)
    const item = getWorkspaceNav('en', { firm: true }).find((i) => i.to === '/workspace/firm')
    expect(item?.label).toBe('Client books')
    expect(getWorkspaceNav('ar', { firm: true }).find((i) => i.id === 'firm')?.label).toBe('دفاتر العملاء')
  })

  it('maps client book pages to the firm section', () => {
    expect(workspaceSectionForPath('/workspace/firm')).toBe('firm')
    expect(workspaceSectionForPath('/workspace/firm/b1')).toBe('firm')
  })

  it('keeps the invite page out of search engines', () => {
    expect(isPrivatePath('/accept-invite')).toBe(true)
  })
})

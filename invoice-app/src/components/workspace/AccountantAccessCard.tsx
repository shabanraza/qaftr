import { useState } from 'react'
import { Check, Copy, MessageCircle, UserRoundPlus, X } from 'lucide-react'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { getSeatCopy } from '#/lib/accountant/copy'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'
import { formatSaDate } from '#/lib/sa/format'

export type SeatMember = {
  id: string
  email: string | null
  state: 'pending' | 'active' | 'expired' | 'revoked'
  accountantName: string | null
  accountantEmail: string | null
  expiresAt: Date
  createdAt: Date
  acceptedAt: Date | null
}

type Props = {
  lang: MarketingLang
  members: SeatMember[]
  /** The raw invite link, available only right after it was created. */
  inviteLink: string | null
  creating: boolean
  error: string | null
  onInvite: (email: string | undefined) => void
  onRevoke: (id: string) => void
  onDismissLink: () => void
}

/** Business owner: invite an accountant (read-only) and manage who has access. */
export function AccountantAccessCard({ lang, members, inviteLink, creating, error, onInvite, onRevoke, onDismissLink }: Props) {
  const c = getSeatCopy(lang).owner
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const date = (d: Date) => formatSaDate(d.toISOString().slice(0, 10), lang)

  async function copyLink() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
    } catch {
      // The field is selectable, so the user can still copy by hand.
    }
  }

  return (
    <Card dir={langDir(lang)} lang={lang} className="max-w-3xl border-border/60 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRoundPlus className="size-5 text-primary" aria-hidden />
          {c.title}
        </CardTitle>
        <CardDescription className="leading-relaxed">{c.intro}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{c.errors[error] ?? c.errors.DEFAULT}</AlertDescription>
          </Alert>
        ) : null}

        {inviteLink ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--qaftr-gold)]/50 bg-[var(--qaftr-gold)]/10 p-4">
            <Label htmlFor="seat-invite-link">{c.linkLabel}</Label>
            <Input id="seat-invite-link" readOnly value={inviteLink} dir="ltr" onFocus={(e) => e.currentTarget.select()} />
            <p className="text-xs text-muted-foreground">{c.linkNote}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={copyLink}>
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? c.copied : c.copy}
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(c.whatsappText(inviteLink))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  {c.whatsapp}
                </a>
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onDismissLink}>
                {c.done}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              onInvite(email.trim() || undefined)
              setEmail('')
              setCopied(false)
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seat-email">{c.emailLabel}</Label>
              <Input
                id="seat-email"
                type="email"
                dir="ltr"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby="seat-email-hint"
              />
              <p id="seat-email-hint" className="text-xs text-muted-foreground">
                {c.emailHint}
              </p>
            </div>
            <div>
              <Button type="submit" disabled={creating}>
                {creating ? c.creating : c.create}
              </Button>
            </div>
          </form>
        )}

        <div>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c.empty}</p>
          ) : (
            <ul aria-label={c.listLabel} className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {members.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {m.accountantName ?? m.email ?? '—'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {m.accountantEmail ?? m.email ?? ''}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.state === 'active' && m.acceptedAt
                        ? `${c.since} ${date(m.acceptedAt)}`
                        : `${c.expires} ${date(m.expiresAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.state === 'active' ? 'secondary' : 'outline'}>{c.state[m.state] ?? m.state}</Badge>
                    <Button type="button" size="xs" variant="ghost" onClick={() => onRevoke(m.id)}>
                      <X className="size-3.5" aria-hidden />
                      {c.remove}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

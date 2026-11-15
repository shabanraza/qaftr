import { Link } from '@tanstack/react-router'
import { CircleCheck, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { getSeatCopy } from '#/lib/accountant/copy'
import { langDir } from '#/lib/marketing/lang'
import type { MarketingLang } from '#/lib/marketing/lang'

type Props = {
  lang: MarketingLang
  signedIn: boolean
  status: 'idle' | 'accepting' | 'done' | 'error'
  errorCode: string | null
  businessName: string | null
  onAccept: () => void
  onSignIn: () => void
}

/** Accountant: accept a business invitation. Accepting always needs an explicit click. */
export function AcceptInviteCard({ lang, signedIn, status, errorCode, businessName, onAccept, onSignIn }: Props) {
  const c = getSeatCopy(lang).accept
  const search = lang === 'en' ? { lang: 'en' as const } : {}

  if (status === 'done') {
    return (
      <Card dir={langDir(lang)} lang={lang} className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleCheck className="size-5 text-primary" aria-hidden />
            {c.doneTitle}
          </CardTitle>
          <CardDescription>{c.doneBody(businessName ?? '')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="qaftr-btn-primary">
            <Link to="/workspace/firm" search={search} className="no-underline">
              {c.open}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card dir={langDir(lang)} lang={lang} className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          {c.title}
        </CardTitle>
        <CardDescription className="leading-relaxed">{c.intro}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status === 'error' ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{(errorCode && c.errors[errorCode]) || c.errors.DEFAULT}</AlertDescription>
          </Alert>
        ) : null}
        {signedIn ? (
          <div>
            <Button type="button" disabled={status === 'accepting'} onClick={onAccept}>
              {status === 'accepting' ? c.accepting : c.accept}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{c.signInHint}</p>
            <div>
              <Button type="button" onClick={onSignIn}>
                {c.signIn}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

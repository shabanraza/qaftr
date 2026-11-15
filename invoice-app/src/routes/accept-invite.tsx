import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useTRPC } from '#/integrations/trpc/react'
import { authClient } from '#/lib/auth-client'
import { AuthGateDialog } from '#/components/instant-invoice/AuthGateDialog'
import { MarketingLayout } from '#/components/marketing/MarketingLayout'
import { AcceptInviteCard } from '#/components/workspace/AcceptInviteCard'
import { getSeatCopy } from '#/lib/accountant/copy'
import { marketingSearchSchema, resolveLang } from '#/lib/marketing/lang'
import { buildMarketingHead } from '#/lib/marketing/seo'

const searchSchema = marketingSearchSchema.extend({
  token: z.string().max(200).optional().catch(undefined),
})

export const Route = createFileRoute('/accept-invite')({
  validateSearch: searchSchema,
  head: ({ match }) => {
    const lang = resolveLang(match.search)
    // /accept-invite is a private path: buildMarketingHead marks it noindex.
    return buildMarketingHead({
      title: getSeatCopy(lang).accept.title,
      description: getSeatCopy(lang).accept.intro,
      path: '/accept-invite',
      lang,
    })
  },
  component: AcceptInvitePage,
})

function AcceptInvitePage() {
  const { lang: searchLang, token } = Route.useSearch()
  const lang = resolveLang({ lang: searchLang })
  const trpc = useTRPC()
  const { data: session, isPending } = authClient.useSession()
  const [authOpen, setAuthOpen] = useState(false)
  const accept = useMutation(trpc.seat.accept.mutationOptions())

  const status = accept.isPending ? 'accepting' : accept.isSuccess ? 'done' : accept.isError || !token ? 'error' : 'idle'
  const errorCode = !token ? 'INVITE_NOT_FOUND' : (accept.error?.message ?? null)

  return (
    <MarketingLayout lang={lang}>
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <AcceptInviteCard
          lang={lang}
          signedIn={!isPending && Boolean(session?.user)}
          status={status}
          errorCode={errorCode}
          businessName={accept.data ? (lang === 'ar' ? accept.data.nameAr : accept.data.nameEn || accept.data.nameAr) : null}
          onAccept={() => token && accept.mutate({ token })}
          onSignIn={() => setAuthOpen(true)}
        />
      </section>
      <AuthGateDialog
        lang={lang}
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false)
          void authClient.getSession()
        }}
        initialMode="signin"
        context="general"
      />
    </MarketingLayout>
  )
}

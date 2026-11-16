import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import type { ComponentProps } from 'react'
import { authClient } from '#/lib/auth-client'
import type { MarketingLang } from '#/lib/marketing/lang'

type ButtonProps = ComponentProps<typeof Button>

type AccountCtaProps = {
  lang: MarketingLang
  /** Label for signed-out visitors, e.g. "Create a free account". */
  label: string
  onSignUp: () => void
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  className?: string
  'data-cta'?: string
  /** Where a signed-in user goes instead (default: the Money desk). */
  signedIn?: { to: '/workspace' | '/workspace/billing'; label: { ar: string; en: string } }
}

/**
 * Sign-up button for marketing pages. A signed-in user gets a link to the
 * Money desk instead, so nobody who already has an account is asked to make one.
 */
export function AccountCta({ lang, label, onSignUp, variant, size, className, 'data-cta': dataCta, signedIn }: AccountCtaProps) {
  const { data: session } = authClient.useSession()
  if (session?.user) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <Link
          to={signedIn?.to ?? '/workspace'}
          search={lang === 'en' ? { lang: 'en' as const } : {}}
          className="no-underline"
          data-cta={dataCta ? `${dataCta}_${signedIn ? 'billing' : 'workspace'}` : undefined}
        >
          {signedIn ? signedIn.label[lang] : lang === 'ar' ? 'اذهب إلى مكتب المال' : 'Go to Money desk'}
        </Link>
      </Button>
    )
  }
  return (
    <Button type="button" variant={variant} size={size} className={className} data-cta={dataCta} onClick={onSignUp}>
      {label}
    </Button>
  )
}

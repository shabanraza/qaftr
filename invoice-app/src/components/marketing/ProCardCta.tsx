import { Button } from '#/components/ui/button'
import { PRO_CHECKOUT_OPEN } from '#/lib/billing/launch'
import type { MarketingLang } from '#/lib/marketing/lang'
import { AccountCta } from './AccountCta'

type Props = {
  lang: MarketingLang
  onSignUp: () => void
  /** Defaults to the PRO_CHECKOUT_OPEN switch. */
  open?: boolean
}

/** Button on the home Pro pricing card: disabled "Coming soon" until web checkout opens. */
export function ProCardCta({
  lang,
  onSignUp,
  open = PRO_CHECKOUT_OPEN,
}: Props) {
  if (!open) {
    return (
      <Button
        type="button"
        size="lg"
        variant="secondary"
        className="w-full text-primary"
        disabled
        data-cta="pricing_pro_soon"
      >
        {lang === 'ar' ? 'قريباً' : 'Coming soon'}
      </Button>
    )
  }
  return (
    <AccountCta
      lang={lang}
      label={lang === 'ar' ? 'إنشاء حساب' : 'Create account'}
      onSignUp={onSignUp}
      size="lg"
      variant="secondary"
      className="w-full text-primary"
      data-cta="pricing_pro"
      signedIn={{
        to: '/workspace/billing',
        label: { ar: 'رقِّ إلى برو', en: 'Upgrade to Pro' },
      }}
    />
  )
}

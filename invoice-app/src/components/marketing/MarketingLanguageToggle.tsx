import { useNavigate, useRouterState } from '@tanstack/react-router'
import type { MarketingLang } from '#/lib/marketing/lang'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

type MarketingLanguageToggleProps = {
  lang: MarketingLang
}

export function MarketingLanguageToggle({ lang }: MarketingLanguageToggleProps) {
  const { pathname, hash } = useRouterState().location
  const navigate = useNavigate()

  return (
    <ToggleGroup
      type="single"
      value={lang}
      onValueChange={(next) => {
        if (!next || next === lang) return
        const homeAnchors = new Set(['features', 'pricing', 'invoice-tool'])
        const keepHash = pathname === '/' && hash && homeAnchors.has(hash)
        void navigate({
          to: pathname,
          search: next === 'en' ? { lang: 'en' } : {},
          hash: keepHash ? hash : undefined,
        })
      }}
      variant="outline"
      size="sm"
      className="rounded-full border border-border bg-card p-0.5 shadow-sm"
      aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <ToggleGroupItem value="ar" className="px-2.5">
        AR
      </ToggleGroupItem>
      <ToggleGroupItem value="en" className="px-2.5">
        EN
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

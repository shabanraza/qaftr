// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale
import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <div className="flex items-center gap-2 text-inherit" aria-label={m.language_label()}>
      <span className="text-sm opacity-85">{m.current_locale({ locale: currentLocale })}</span>
      <ToggleGroup
        type="single"
        value={currentLocale}
        onValueChange={(value) => {
          if (value) setLocale(value as (typeof locales)[number])
        }}
        variant="outline"
        size="sm"
        className="rounded-full bg-card p-0.5 shadow-sm"
      >
        {locales.map((locale) => (
          <ToggleGroupItem key={locale} value={locale} className="px-2.5">
            {locale.toUpperCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

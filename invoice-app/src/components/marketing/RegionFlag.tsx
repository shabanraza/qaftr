import type { MarketingRegion } from '#/lib/marketing/lang'
import { cn } from '#/lib/utils'

/**
 * Small inline SVG flags. Emoji flags render as the letters "SA"/"AE" on
 * Windows, so the picker draws its own. Always decorative: the text label
 * next to the flag names the country. Flags are never mirrored in RTL.
 */
export function RegionFlag({
  region,
  className,
}: {
  region: MarketingRegion
  className?: string
}) {
  const common = {
    'aria-hidden': true as const,
    focusable: 'false' as const,
    'data-flag': region,
    viewBox: '0 0 24 16',
    className: cn(
      'inline-block h-3 w-[18px] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10',
      className,
    ),
    style: { direction: 'ltr' as const },
  }

  if (region === 'ae') {
    return (
      <svg {...common}>
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="5.34" fill="#00732F" />
        <rect y="10.66" width="24" height="5.34" fill="#000" />
        <rect width="6" height="16" fill="#FF0000" />
      </svg>
    )
  }

  // Saudi Arabia: green field, stylised script line and sword in white.
  return (
    <svg {...common}>
      <rect width="24" height="16" fill="#006C35" />
      <path
        d="M6 6.2c1-.9 1.6.6 2.6-.3s1.4.6 2.4-.3 1.5.6 2.5-.3 1.5.6 2.5-.3 1.4.6 2-.1"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path d="M6.5 10.4h10.2l1.3-.6v1.3H6.5z" fill="#fff" />
    </svg>
  )
}

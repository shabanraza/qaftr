/**
 * @font-face rules for invoice/document HTML rendered in srcdoc iframes.
 * Uses the same self-hosted files as the site (public/fonts) so previews share
 * the page's font cache instead of fetching from Google. srcdoc documents
 * resolve root-relative URLs against the embedding page.
 */
const ARABIC_RANGE =
  'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC'
const LATIN_RANGE =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'

export function documentFontFaceCss(weights: ReadonlyArray<400 | 500 | 600 | 700>): string {
  return weights
    .flatMap((w) =>
      (
        [
          ['arabic', ARABIC_RANGE],
          ['latin', LATIN_RANGE],
        ] as const
      ).map(
        ([subset, range]) =>
          `@font-face{font-family:'IBM Plex Sans Arabic';font-style:normal;font-weight:${w};font-display: swap;src:url('/fonts/ibm-plex-sans-arabic-${subset}-${w}-normal.woff2') format('woff2');unicode-range:${range};}`,
      ),
    )
    .join('')
}

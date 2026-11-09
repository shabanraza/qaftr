import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import {
  MarketingError,
  MarketingNotFound,
} from '#/components/marketing/MarketingStatusPages'
import {
  htmlLangAttr,
  langDir,
  regionFromPath,
  resolveLang,
} from '#/lib/marketing/lang'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import type { TRPCRouter } from '#/integrations/trpc/router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import {
  BING_SITE_VERIFICATION,
  GOOGLE_ANALYTICS_ID,
  GOOGLE_SITE_VERIFICATION,
  SITE_URL,
} from '#/lib/marketing/constants'
import {
  buildJsonLdScript,
  buildOrganizationSchema,
  buildWebApplicationSchema,
  buildWebsiteSchema,
} from '#/lib/marketing/seo'
import { rootHeadMeta } from '#/lib/marketing/status'
import { buildGtagBootstrap } from '#/lib/analytics/config'
import { fontPreloadLinks } from '#/lib/fonts/preload'
import { ConsentBanner } from '#/components/analytics/ConsentBanner'
import { AnalyticsListeners } from '#/components/analytics/AnalyticsListeners'

// Consent Mode v2 defaults + GA config, run only on the production host
// (see lib/analytics/config.ts). Empty when no valid measurement ID is set.
const GTAG_BOOTSTRAP = buildGtagBootstrap({
  measurementId: GOOGLE_ANALYTICS_ID,
  siteUrl: SITE_URL,
})

interface MyRouterContext {
  queryClient: QueryClient

  trpc: TRPCOptionsProxy<TRPCRouter>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: ({ match }) => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...rootHeadMeta(match),
      {
        name: 'theme-color',
        content: '#0A3D2E',
      },
      ...(GOOGLE_SITE_VERIFICATION
        ? [
            {
              name: 'google-site-verification',
              content: GOOGLE_SITE_VERIFICATION,
            },
          ]
        : []),
      ...(BING_SITE_VERIFICATION
        ? [
            {
              name: 'msvalidate.01',
              content: BING_SITE_VERIFICATION,
            },
          ]
        : []),
    ],
    links: [
      // Self-hosted fonts: preload the two first-paint files for this
      // language before the stylesheet discovers them.
      ...fontPreloadLinks(
        (match.search as { lang?: unknown } | undefined)?.lang === 'en' ? 'en' : 'ar',
      ),
      {
        rel: 'stylesheet',
        href: appCss,
      },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      {
        rel: 'icon',
        href: '/favicon-32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
    ],
    scripts: [
      buildJsonLdScript([
        buildOrganizationSchema(),
        buildWebsiteSchema(),
        buildWebApplicationSchema(),
      ]),
      ...(GTAG_BOOTSTRAP ? [{ children: GTAG_BOOTSTRAP }] : []),
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: MarketingNotFound,
  errorComponent: MarketingError,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // Language comes from the `?lang=` search param used across the site
  // (Arabic by default), so the document-level lang/dir match the content.
  const location = useRouterState({ select: (state) => state.location })
  const searchLang = (location.search as { lang?: unknown } | undefined)?.lang
  const lang = resolveLang({ lang: searchLang === 'en' ? 'en' : undefined })
  // /ae pages are the UAE site (ar-AE / en-AE); everything else is Saudi.
  const region = regionFromPath(location.pathname)

  return (
    <html lang={htmlLangAttr(lang, region)} dir={langDir(lang)}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <ConsentBanner lang={lang} />
        <AnalyticsListeners />
        <Scripts />
      </body>
    </html>
  )
}

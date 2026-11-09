import { createServerFn } from '@tanstack/react-start'
import {
  getRequest,
  getRequestHeader,
  setResponseHeader,
} from '@tanstack/react-start/server'
import { isBotUserAgent, resolveGeoCountry } from './regions'

/**
 * Visitor country for the region suggestion banner.
 *
 * Called from the browser after hydration (never during SSR), so the page
 * HTML is identical for every country and safe to cache; this tiny GET
 * response is per-visitor and marked uncacheable. Bots get `null`.
 * `geo` is a testing override honoured only on localhost (see resolveGeoCountry).
 */
export const getVisitorCountry = createServerFn({ method: 'GET' })
  .validator((input: { geo?: string } | undefined) => ({
    geo: typeof input?.geo === 'string' ? input.geo.slice(0, 8) : undefined,
  }))
  .handler(({ data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    if (isBotUserAgent(getRequestHeader('user-agent'))) return { country: null }
    const request = getRequest() as Request & { cf?: { country?: unknown } }
    const cfCountry = request.cf?.country
    return {
      country: resolveGeoCountry({
        host: new URL(request.url).host,
        override: data.geo,
        cfCountry: typeof cfCountry === 'string' ? cfCountry : null,
        headerCountry: getRequestHeader('cf-ipcountry'),
      }),
    }
  })

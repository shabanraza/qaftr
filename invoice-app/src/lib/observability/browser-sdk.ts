// Loaded on demand by browser.ts. Named imports keep replay, tracing and
// feedback out of the bundle.
import {
  browserApiErrorsIntegration,
  dedupeIntegration,
  eventFiltersIntegration,
  functionToStringIntegration,
  globalHandlersIntegration,
  linkedErrorsIntegration,
} from '@sentry/browser'

export { captureException, init } from '@sentry/browser'

// No breadcrumbs, session, console, HTTP context or culture context.
export function integrations() {
  return [
    eventFiltersIntegration(),
    functionToStringIntegration(),
    browserApiErrorsIntegration(),
    globalHandlersIntegration(),
    linkedErrorsIntegration(),
    dedupeIntegration(),
  ]
}

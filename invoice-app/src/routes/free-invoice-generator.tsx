import { createFileRoute } from '@tanstack/react-router'
import { legacyLandingRedirect } from '#/lib/marketing/legacy-redirects'
import { marketingSearchSchema } from '#/lib/marketing/lang'

// Merged into /tools/fatora; see legacy-redirects.ts.
export const Route = createFileRoute('/free-invoice-generator')({
  validateSearch: marketingSearchSchema,
  beforeLoad: ({ search }) => legacyLandingRedirect(search),
})

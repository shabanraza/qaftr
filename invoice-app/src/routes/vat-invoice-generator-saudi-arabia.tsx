import { createFileRoute } from '@tanstack/react-router'
import { legacyLandingRedirect } from '#/lib/marketing/legacy-redirects'
import { marketingSearchSchema } from '#/lib/marketing/lang'

// Merged into /tools/fatora; see legacy-redirects.ts.
export const Route = createFileRoute('/vat-invoice-generator-saudi-arabia')({
  validateSearch: marketingSearchSchema,
  beforeLoad: ({ search }) => legacyLandingRedirect(search),
})

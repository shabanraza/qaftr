import { createFileRoute, redirect } from '@tanstack/react-router'
import { marketingSearchSchema } from '#/lib/marketing/lang'

// WhatsApp reminders now live on Home ("Follow up today") and on each invoice.
// Old links land on Home.
export const Route = createFileRoute('/workspace/whatsapp')({
  validateSearch: marketingSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/workspace', search: search.lang === 'en' ? { lang: 'en' } : {}, replace: true })
  },
})

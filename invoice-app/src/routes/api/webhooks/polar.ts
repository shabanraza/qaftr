import { createFileRoute } from '@tanstack/react-router'
import { resolvePolarEntitlement, verifyPolarWebhook } from '#/lib/billing/polar'
import { applyPolarEntitlement } from '#/lib/billing/polar-server'

/** Polar.sh subscription webhooks → entitlements. Signed with Standard Webhooks. */
export const Route = createFileRoute('/api/webhooks/polar')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.POLAR_WEBHOOK_SECRET
        if (!secret) return new Response('Webhook secret not configured', { status: 500 })

        const body = await request.text()
        if (!(await verifyPolarWebhook(body, request.headers, secret))) {
          return new Response('Invalid signature', { status: 403 })
        }

        let event: { type?: string; data?: Record<string, unknown> }
        try {
          event = JSON.parse(body)
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }

        const change = resolvePolarEntitlement(event)
        const applied = change ? await applyPolarEntitlement(change) : false
        return Response.json({ ok: true, applied })
      },
    },
  },
})

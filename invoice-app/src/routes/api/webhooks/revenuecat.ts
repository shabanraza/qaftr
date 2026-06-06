import { createFileRoute } from '@tanstack/react-router'
import { applyRevenueCatEvent } from '#/lib/revenuecat-webhook'

export const Route = createFileRoute('/api/webhooks/revenuecat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.REVENUECAT_WEBHOOK_SECRET
        if (!secret) {
          return new Response('Webhook secret not configured', { status: 500 })
        }

        const auth = request.headers.get('authorization') ?? ''
        const token = auth.replace(/^Bearer\s+/i, '').trim()
        if (token !== secret) {
          return new Response('Unauthorized', { status: 401 })
        }

        let body: { event?: { type?: string; app_user_id?: string; product_id?: string; period_type?: string; expiration_at_ms?: number } }
        try {
          body = await request.json()
        } catch {
          return new Response('Invalid JSON', { status: 400 })
        }

        const event = body.event
        if (!event?.type || !event?.app_user_id) {
          return new Response('Missing event fields', { status: 400 })
        }

        const applied = await applyRevenueCatEvent({
          type: event.type,
          app_user_id: event.app_user_id,
          product_id: event.product_id,
          period_type: event.period_type,
          expiration_at_ms: event.expiration_at_ms,
        })

        return new Response(JSON.stringify({ ok: true, applied }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})

# Qaftr Money Desk Build Plan

## Summary
Build Qaftr as the Saudi freelancer and micro-business money desk, not just an invoice generator. Free web tools capture Arabic search demand; the paid product helps users remember clients, track money, follow up on WhatsApp, and prepare monthly accountant-ready exports.

Product thesis: Qaftr is the money desk for Saudi freelancers who run their business through WhatsApp.

## Key Changes
- Reframe Qaftr around one paid workflow: invoice and quote creation -> WhatsApp send -> paid and unpaid tracking -> VAT and income summary -> accountant export.
- Keep free tools for acquisition: invoice generator, quote generator, VAT calculator, TRN checker, QR reader and validator, due-date helper, and invoice templates.
- Build the non-AI money desk first: invoice database, client database, PDF and WhatsApp sharing, status tracking, due-date reminders, VAT summary, accountant export.
- Add AI in V1.5 only after reliable workflow data exists: Arabic reminder writer, quote-from-text or voice, invoice summary, follow-up recommendations, and accountant packet preparation.
- Maintain Arabic-first UX, English fallback, Saudi VAT and ZATCA disclaimers, and avoid wording that implies official ZATCA affiliation.

## Implementation Changes
- Data model: add `quotes`, `quote_line_items`, and `invoice_events`; extend invoice and client fields for status dates, WhatsApp phone, reminder timestamps, and accountant export metadata.
- Backend APIs: add quote CRUD and quote-to-invoice conversion; extend invoices with duplicate, mark-sent, mark-paid, mark-unpaid, reminder-log, and monthly VAT and income summary endpoints.
- Web app: add money desk dashboard, quotes flow, invoice status workflow, WhatsApp reminder actions, VAT and income summary, accountant export, and SEO tool pages.
- Mobile app: expose the same core workflow: quick invoice and quote creation, client reuse, WhatsApp send and reminder, status updates, overdue list, and monthly summary.
- Shared package: add pure helpers for quote totals, due-date calculation, WhatsApp reminder copy, VAT summary aggregation, QR validation, and export formatting.

## Build Phases
1. V1 Money Desk Foundation: saved clients, saved business profile, invoice duplicate and edit, paid and unpaid and overdue tracking, due dates, and free or pro gating.
2. V1 WhatsApp Workflow: one-tap invoice send, Arabic payment reminder text, reminder event logging, and "follow up today" list based on due dates and status.
3. V1 Quotes and Conversion: free quote generator, saved quotes for Pro, quote PDF and share, quote-to-invoice conversion.
4. V1 Accountant Packet: monthly VAT and income summary, unpaid totals, client totals, CSV and PDF export.
5. V1 SEO Tools: QR reader, QR validator, template gallery, due-date helper, all funneled into invoice and quote creation.
6. V1.5 AI Layer: Arabic payment reminder writer, quote-from-text or voice, invoice summary, "what should I follow up today?", and "prepare my monthly accountant packet".

## Test Plan
- Shared tests: quote totals, VAT summary totals, due-date helper, QR validation, WhatsApp copy, accountant export data shaping.
- Backend tests: owner authorization, free or pro limits, quote conversion, invoice status transitions, reminder event logging, monthly summaries.
- Web tests: build, route generation, Arabic copy, tool CTAs, dashboard status states, accountant export flow.
- Mobile checks: invoice and quote creation, client reuse, WhatsApp share, status updates, free-limit paywall, summary screen.
- Manual QA: create free invoice, save after signup, hit free limit, create quote, convert to invoice, send WhatsApp reminder, mark paid, export monthly accountant packet.

## Assumptions
- Scope is Qaftr core only, not separate Saudi micro-SaaS products.
- V1 does not use WhatsApp Business API; it uses user-triggered WhatsApp share links and event logging.
- V1 does not include ZATCA Phase 2 portal integration; it remains freelancer and micro-business workflow plus education.
- AI is V1.5 because it needs real invoice, client, and status data to be useful.

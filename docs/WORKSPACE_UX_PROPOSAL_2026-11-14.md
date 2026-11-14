# Workspace UX/UI and speed: audit and proposal (2026-11-14)

Status: **approved 2026-11-14 and implemented** (see section 6 for measured results).

## 1. Audit: what is confusing today

Walked through `/workspace` on the local dev server and a local production build (`vite build` + `vite preview`), signed in as a seeded test account (business profile, 2 clients, 3 invoices).

### New invoice (`/workspace/new-invoice`)
The workspace reuses the **public marketing tool** (`InstantInvoiceTool variant="workspace"`). That is the root of the confusion:

| Problem | What the user sees |
|---|---|
| First question is ZATCA jargon | Two big radio cards: "Simplified tax invoice (B2C)" vs "Tax invoice (B2B)". This is a regulatory classification, not something an SME owner should choose before anything else. This is the "industry-specific" feel. |
| Seller typed by hand every time | "Trade name / VAT number / Address" are empty even though the business profile is saved. |
| No customer picker | Buyer is a free-text name + VAT. Saved clients (and their B2B address fields) are ignored. |
| Validation checklist talks about the seller | "Complete these fields: Trade name, Valid VAT number (starts and ends with 3), Seller address" before the user has typed an item. |
| Card per line item | Each item is a separate card with "Item 1" header; slow for 5+ items. |
| Two different editors | Quotes (`/workspace/quotes/new`) already uses the business profile and a client dropdown; invoices do not. |
| Saves through `instantInvoice.save` | Creates a new client row from free text on each save instead of linking an existing `clientId`. |

### Navigation and layout
- 7 flat sidebar items with equal weight: Overview, Invoices, Quotes, Clients, Business profile, WhatsApp, Accountant packet. WhatsApp reminders and the accountant packet are actions, not places.
- No credit notes / ZATCA status entry point except inside an invoice.
- `WorkspaceShell` is rendered inside **each page**, so the header + sidebar unmount and remount on every navigation.
- Empty-state CTA on Overview sends signed-in users to the marketing home page (`/#invoice-tool`).

## 2. Competitors: how they do invoice creation

| Product | Invoice type (B2C/B2B) | Customer | Line items | Seller details |
|---|---|---|---|---|
| **Wafeq** (KSA) | Not chosen. Title becomes "Tax Invoice" when a B2B customer with valid ID + address is selected, otherwise "Simplified Tax Invoice". | Pick saved contact or add new inline, first field | Table | From organisation settings |
| **Qoyod** (KSA) | Not chosen. B2B → clearance, B2C → reporting, automatically from customer type. Warns if the customer's structured address is incomplete. | Pick from customer DB or create once | Table | From settings |
| **Daftra** (KSA/EG) | Title switches automatically by client type (Individual → simplified, Business → tax invoice), configured once in print templates. | Client picker | Table | From settings |
| **Zoho Invoice** | n/a; one "Standard" template, change look in settings | Customer picker first; can also start from the customer page ("New transaction → Invoice") | Item table, pick saved items or add new | From org profile |
| **FreshBooks / Wave** | n/a | Customer dropdown at top of a document-like editor | Table rows, "Add a line" | From business settings |

**Common pattern:** one generic invoice form; the customer is picked first; the tax-invoice type is *derived* from the customer, never asked up front; seller details come from settings; items are a table; document templates/branding live in settings, not in the create flow.

## 3. Why workspace routes are slow (measured)

Click on a sidebar link → time until the new page is rendered (no loading bar / skeleton):

| | Dev server | Production build (local preview) |
|---|---|---|
| First visit to a page | 1.3 – 2.4 s | 0.5 – 1.7 s |
| Revisit, data already cached | ~0.5 – 1.0 s | 0.5 – 0.9 s |

Root causes, in order of impact:

1. **`/workspace` `beforeLoad` calls `authClient.getSession()` on every navigation** (and on every link hover, because `defaultPreload: 'intent'` runs `beforeLoad` too). Each call is a network request + DB session lookup: 410 – 930 ms measured. It blocks rendering even when page data is cached. This alone is most of every click.
2. **Loaders `await ensureQueryData`** → the page waits for tRPC data before rendering instead of showing the page with a skeleton.
3. **Every tRPC request looks up the session in the DB again** (`auth.api.getSession`, no Better Auth `cookieCache`), then runs its queries. Neon is in `eu-central-1`, so each query is a full round trip.
4. **`invoices.list` runs an `UPDATE … SET status='overdue'` before every read** → an extra serial write on Overview, Invoices, WhatsApp and Accountant pages.
5. Shell remounts per page; `useRouterState()` without a selector re-renders the shell on every router state change.
6. Hard loads: SSR skips data, then `ClientAuthGuard` spinner → session → queries (3-step waterfall; spinner visible 2–5 s in dev).
7. Main client chunk is 752 kB (minified, before gzip); smaller issue, not the cause of slow clicks.

## 4. Proposal

### A. Speed fixes (no DB schema change)
1. Cache the session in the router context: read it once (and on sign-in/out), `beforeLoad` uses the cached value instead of a request per click. **Touches auth-guard code → needs your OK.**
2. Loaders prefetch without blocking (`prefetchQuery`, not `await ensureQueryData`) + skeletons per page; keep `defaultPreload: 'intent'` but give preloads a `staleTime` so hover does not refetch.
3. Move `WorkspaceShell` into the `/workspace` layout route so sidebar/header stay mounted; pages render only their header + body.
4. Move the "mark overdue" `UPDATE` out of `invoices.list` (compute `overdue` at read time in the query, or run it in the existing retry sweeper cron).
5. Optional, **auth change → needs your OK**: enable Better Auth `session.cookieCache` (e.g. 5 min) so tRPC requests stop hitting the DB for the session.

Target: sidebar clicks render in < 150 ms when data is cached, and show the page skeleton immediately when it is not.

### B. Information architecture
Sidebar (Arabic labels in brackets):
- **Home** (الرئيسية) — overview + "needs follow-up" list (WhatsApp reminder buttons live here and on the invoice)
- **Invoices** (الفواتير) — invoices, credit and debit notes in one list with type filter
- **Quotes** (عروض الأسعار)
- **Customers** (العملاء)
- **Reports** (التقارير) — the accountant packet export
- **Settings** (الإعدادات) — business profile, ZATCA connection, invoice branding

Header: one **"+ New"** button (Invoice / Quote / Customer). The separate WhatsApp page goes away (its reminder action moves to Home and the invoice page).

### C. New invoice flow (replaces the marketing tool inside the workspace)
One page, document-like, same layout in AR (RTL) and EN:
1. **Customer** first: searchable picker of saved customers + "Cash customer" + "Add new customer" (inline sheet with the B2B fields already built in `ClientB2bDetails`).
2. **Invoice type derived automatically**, shown as a small badge: customer with VAT number → "Tax invoice"; otherwise "Simplified tax invoice". If a B2B customer is missing the structured address, show an inline "complete customer address" link (like Qoyod).
3. **Seller from the business profile**, shown read-only in the preview with "Edit in Settings". If the profile is incomplete, one banner: "Complete your business profile to issue invoices".
4. **Items table**: Description · Qty · Unit price · Line total; Enter adds a row; on mobile rows become compact cards.
5. Issue date + number automatic; **More options** collapsed: due date, supply date, notes.
6. Sticky summary (totals) + actions: **Save draft**, **Save & issue** (sends to ZATCA when connected, using the existing `ZatcaInvoicePanel` logic), PDF, WhatsApp. Live preview as a toggle/side panel.
7. Saves through the existing `invoices.create` (links `clientId`, uses `businessId`), so no DB schema change. Quote → invoice conversion and CN-/DN- numbering stay as they are.

The public marketing tool on the home page is unchanged.

### C2. Live PDF preview panel (form + preview side by side)
The user asked to see the PDF itself while creating an invoice, not only edit fields line by line.

**How it works**
- The preview panel shows the **real invoice document**: it renders `buildInvoiceHtml()` from `src/lib/instant-invoice/invoice-pdf.ts`, the same HTML that `exportInvoicePdfBlob()` turns into the PDF. So what you see is what downloads (QR, Arabic/English labels, CN-/DN- titles included).
- The editor builds an `InvoiceForPdf` from what is on screen: business profile → `business`, picked customer → `client`, item rows → `lineItems`, totals from `computeDraftTotals`. That object already exists as a type, so no new format is needed.
- Re-render is debounced (~250 ms after typing stops) into a sandboxed `iframe srcDoc`, drawn at A4 width (794 px) and scaled down to fit the panel. The existing `InvoiceHtmlPreview` already does iframe + debounce for the marketing tool; it gets a generic `invoice: InvoiceForPdf` prop and a "full page" mode instead of the compact card.
- Clicking a section in the preview (customer, items, notes) scrolls to and focuses that field in the form. Editing stays in the form; the document is never edited directly, so validation and RTL text input stay reliable.

**Layouts**
- **Desktop (≥ 1024 px):** form on the start side (~45%), sticky preview on the end side (~55%) with zoom (fit / 100%) and a "Download PDF" button. In Arabic the whole split mirrors: form on the right, preview on the left.
- **Tablet / mobile:** one column with a two-tab switch at the top, **Edit | Preview** (تعديل | معاينة), and a sticky bottom bar with the total and "Save". Preview tab shows the scaled A4 page, pinch/zoom allowed.
- The preview language follows the invoice language (Arabic, English, or bilingual as today), independent of the UI language.

**Compared with competitors**
| Product | Preview while creating |
|---|---|
| FreshBooks | Edits on a page that looks like the invoice (document-style editor). |
| Wave | Form first; separate "Preview" screen before sending (desktop / tablet / mobile views). |
| Zoho Invoice / Books | Form; preview after saving. Users report the on-screen preview can differ from the generated PDF with custom templates. |
| Wafeq / Qoyod / Daftra | Form; print/PDF view after saving. |
| **Qaftr (proposed)** | Form + live preview side by side, and the preview *is* the PDF source, so no mismatch. Mobile gets Edit/Preview tabs. |

Recommendation: form + live preview (not FreshBooks-style editing on the document). Editing inside the rendered document breaks easily with mixed Arabic/English text and numbers, and makes ZATCA field validation (VAT number, address parts) harder to show.

### D. Implementation order (each step: tests first, then code, typecheck, browser check AR + EN, commit + push)
1. Speed: layout-level shell, non-blocking loaders + skeletons, overdue update out of `list`. Re-measure.
2. Speed (after your OK): cached session in `beforeLoad`; optional cookie cache.
3. New invoice editor (customer picker, derived type, items table, profile-based seller).
4. Sidebar/IA regroup, "+ New" menu, Reports and Settings pages, remove WhatsApp page.
5. Final before/after timings in dev and production build.

## 5. Questions for approval
1. Approve the redesign direction (B + C)?
2. OK to change the auth guard (A1, client side only) and optionally enable Better Auth `cookieCache` (A5, server config)?
3. OK to remove the standalone WhatsApp page (reminders move to Home + invoice page)?

## 6. Results (implemented 2026-11-14)

Sidebar click → page rendered, same seeded account, Neon dev branch (eu-central-1):

| | Before | After |
|---|---|---|
| Production build, first visit | 0.5 – 1.7 s | 50 – 66 ms (page with skeleton); data follows |
| Production build, revisit | 0.5 – 0.9 s | 19 – 33 ms |
| Dev server, first visit | 1.3 – 2.4 s | 110 – 510 ms (includes dev compile) |
| Dev server, revisit | 0.5 – 1.0 s | 41 – 62 ms |
| `GET /api/auth/get-session` | ~430 ms | ~20 ms |
| `invoices.list` | 0.9 – 1.2 s | ~230 ms |
| `clients.list` | 0.6 – 0.96 s | ~225 ms |

`zatca.status` (Settings, invoice page, new invoice): 630 – 820 ms → 230 – 310 ms (dev server). Its three serial queries (business, plan, active EGS unit) now run as one `db.batch` round trip.

Shipped: persistent `WorkspaceLayout` in the `/workspace` route, cached client session for guards, Better Auth `cookieCache` (5 min), non-blocking loaders, overdue derived on read, new sidebar (Home, Invoices, Quotes, Customers, Reports, Settings) + "New" menu, `/workspace/whatsapp` redirects to Home, new invoice editor with live PDF preview (`WorkspaceInvoiceEditor`, `InvoicePagePreview`), `invoices.create` accepts `supplyDate` and `status: draft`.

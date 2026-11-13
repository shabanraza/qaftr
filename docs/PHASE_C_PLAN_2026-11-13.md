# Phase C: ZATCA Phase 2 e-invoicing, Saudi Arabia only (2026-11-13)

Builds on `docs/PHASE2_DATA_MODEL_PROPOSAL.md` (data model, signing, queue, certificate lifecycle) and the existing
`packages/shared/src/zatca-phase2/` code (UBL builder, hash, XAdES signature, QR, CSR, API client).

## 1. Decision summary

**Scope: Saudi Arabia only.** Qaftr builds ZATCA Phase 2 (integration) in-house. ZATCA licenses no solution providers, each taxpayer
onboards its own EGS units with a Fatoora OTP, and the signing stack already exists in `packages/shared`.

**UAE: no e-invoicing service.** Providing UAE e-invoicing requires Ministry of Finance accreditation (see the appendix), which
needs a UAE entity, 2 years' experience, Peppol certification, ISO 27001/22301 and AED 12.5M of insurance. We will not pursue it.
The `/ae` section stays as free tools that need no official certification: the PDF tax-invoice generator, TRN format checker,
5% VAT calculator, readiness quiz and the 2027 guide. They say plainly that Qaftr is not an ASP, and they promise no UAE account features.

## 2. Saudi Arabia: no licence needed (verified)

- ZATCA: "Taxpayers may choose any e-invoicing solution provider as long as it is compliant with the e-invoicing requirements." ZATCA
  also says it considers the taxpayer compliant "even if the solution provider is not listed on the indicative list".
  Source: <https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx>
- **Optional.** There is a voluntary **Solution Providers Directory** for providers that pass ZATCA's qualification. It is "not considered as an
  approval by ZATCA" and is "non-legally binding". Listing is optional, but it helps marketing; apply after the first production customers.
  Source: <https://zatca.gov.sa/en/E-Invoicing/SolutionProviders/Pages/SolutionProvidersDirectory.aspx>
- Taxpayer flow: OTP from Fatoora → CSR → compliance CSID → compliance checks → production CSID (see the proposal, §7).

## 3. Build order

1. **Done in this branch:** the database schema and migration `0002_zatca_phase2` (EGS units, encrypted credentials, submission log,
   ZATCA invoice columns, structured seller and buyer addresses, and line VAT categories). Tested on a local Postgres, both
   fresh and db:push-style.
2. Envelope encryption helper (WebCrypto AES-256-GCM plus a KEK secret), test-first.
3. Business and client forms that capture CR number, structured address and buyer ID (shared validation).
4. EGS onboarding flow (OTP → CSR → CCSID → compliance docs → PCSID) against the **sandbox**, behind a `zatca_phase2` Pro flag.
5. Signing in a Durable Object per EGS unit, R2 storage for signed XML, synchronous clearance for standard invoices.
6. Cloudflare Queue for 24-hour reporting, plus a cron sweeper and certificate-expiry reminders.
7. Simulation, with a beta customer's OTP, then production.
8. Apply to ZATCA's voluntary Solution Providers Directory once the first production customers are live.

## 4. Notes and risks

- **Deleting a user account** now fails once the user has an EGS unit or submitted invoices. The `restrict` foreign keys do this on
  purpose so tax records are kept. Before Phase 2 ships, the account-deletion flow needs a soft delete or a retention path. That is
  auth work and needs sign-off.
- The `0000` snapshot predates `quotes`, `quote_line_items` and `invoice_events`, which were created with `db:push`. `0002` therefore
  creates them only if missing. Apply `0002` to a Neon branch of production before production itself. The production endpoint is
  not in the Neon org connected to this session.

## Appendix: UAE Accredited Service Provider requirements (for reference, not pursued)

The source is **Ministerial Decision No. 64 of 2025**, which I read in full from the MoF PDF:
<https://mof.gov.ae/wp-content/uploads/2025/03/Ministerial_Decision_Eligibility_and_Accreditation_procedure_for_SPs_EN.pdf>.
The MoF ASP list page now cites **Ministerial Decision No. 168 of 2026**, which appears to replace it and drop the separate pre-approval
stage. I could not read 168's text. The MoF service page (<https://mof.gov.ae/en/services/accreditation-of-einvoicing-service-providers/>)
lists the same criteria and documents, so treat the list below as current, but **re-check it against Decision 168 before applying**.

**Who may provide e-invoicing in the UAE.** Art. 3: only an accredited provider. A business cannot plug straight into the FTA. It must
send invoices through an ASP over Peppol.

### Eligibility (Art. 5–11)

| # | Requirement | Qaftr today | Effort |
|---|---|---|---|
| 1 | **Active Peppol-certified Service Provider**, passed the OpenPeppol conformance tests | No | OpenPeppol membership as an Access Point. Sign-up EUR 1,050–2,950, then EUR 1,850–5,500 a year, plus a one-off EUR 1,500 certification fee (<https://peppol.org/join/fees/>). Sign the Service Provider Agreement and pass the testbed. |
| 2 | **At least 2 years operating and managing an e-invoicing system**, with documents | No | Time. The Saudi ZATCA Phase 2 production history may count; confirm with the MoF. |
| 3 | A **UAE-incorporated company**, or a foreign company licensed to do business in the UAE | Check | UAE trade licence (mainland or free zone). |
| 4 | **Paid-up capital of AED 50,000 or more** | Check | Shown on the licence. |
| 5 | **Audited financial statements** for the last financial year (or within 6 months of year end) | Check | Auditor. |
| 6 | **ISO 22301** (business continuity); may follow within 3 months of year end | No | Certification body, typically 3–6 months. |
| 7 | **ISO/IEC 27001** for the product | No | Typically 6–12 months; Vanta/Drata-style tooling helps. |
| 8 | MFA, encryption in transit and at rest, regular security monitoring | Partly | MFA on accounts, KMS-style key management, logging and alerts. |
| 9 | Meet customers' **hosting, data residency** and national cloud policy rules | Check | May require a UAE region for some customers. |
| 10 | **Corporate Tax registration** (plus VAT where mandatory) | Check | EmaraTax. |
| 11 | **Insurance** from a UAE insurer: professional indemnity AED 2.5M, crime AED 5M, cyber fraud AED 5M | No | Broker quote. |
| 12 | **Self-declaration**, including **100 free e-invoice exchanges a year per customer** | — | Pricing must allow for this. |

### Process (Art. 12–16)

1. Apply on the MoF portal: Services → "Accreditation of E-Invoicing Service Providers", sign in with **UAE Pass**, upload the 15 listed
   documents. There is **no fee**. The MoF decides within **90 business days**, or asks for more information and then decides within 30.
2. Testing: OpenPeppol interoperability (PINT AE send and receive) and **end-user verification** against the FTA.
3. Production readiness: a **production Peppol PKI certificate** from OpenPeppol, the **EmaraTax end-user verification API** from the FTA,
   and trial runs that onboard end users and exchange invoices on production.
4. Final tests: tax data reporting to the FTA, the OpenPeppol test services, and a production trial run with the FTA. If those pass,
   accreditation is granted and the provider is published on the MoF list.
5. **Valid 2 years** (Art. 16.3). Apply to renew **at least 70 business days before expiry**, with current insurance and ISO 27001.

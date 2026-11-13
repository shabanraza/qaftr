# ZATCA Developer Portal: research, integration path and opportunities (2026-11-09)

Scope: a full walkthrough of the ZATCA e-invoicing Developer Portal (sandbox.zatca.gov.sa), the direct Phase 2 (Integration
Phase) path for Qaftr without a middleware partner, the tools Qaftr can build on top of it, and a working sandbox proof of concept
(`spikes/zatca-sandbox/`).

Method: the portal was browsed read-only in the user's Chrome. The browser was **not signed in** to the developer portal (the
sidebar shows "Login"), and nothing needed sign-in: every tool page, swagger file and spec link is public. No forms were submitted, no
terms were accepted and nothing was downloaded. Download links are listed below. The POC used only the public sandbox API, keys
generated on the spot and ZATCA's documented sandbox values.

Status labels used below: **[verified]** = seen on the portal or proven by the POC on 2026-11-09. **[doc]** = from ZATCA
specs or other cited sources. **[belief]** = well-known community practice that has not been re-checked here.

---

## 1. Portal map

Home: `https://sandbox.zatca.gov.sa/` ("Developer Portal" under E-invoicing). It has six sections, shown as cards and in the sidebar: [verified]

| Section | URL | What it offers |
|---|---|---|
| Developer Portal FAQs | `/DeveloperPortalSupport` | FAQ tabs: General, SDK, API Integration Sandbox, Web Validator. Answers intended users, requirements and where the manuals are. |
| Developer Community | (button that opens the ZATCA Discourse forum) | `zatca1.discourse.group`: public Q&A, where most of the undocumented behaviour is discussed (for example signed-properties hashing). |
| Compliance & Enablement Toolbox and SDK | `/downloadSDK` | Tabs: Download SDK / SDK Support / E-invoice Specifications / Version History. Downloads require ticking "I accept the terms" (**not done**). |
| Web Based Validator for Non-Technical Users | `/Compliance` | Upload-an-XML validator for standard/simplified documents (needs portal login to use). |
| API Integration Sandbox | `/IntegrationSandbox` | Overview, release notes, API table and six inline Swagger (OAS 3.0) pages with "Try it out". |
| QR Code Validation using ZATCA Mobile App | `/qr` | How to scan Phase 1/2 QR codes in the ZATCA app (Services tab). Non-TLV QR gives "QR code information has been transmitted to ZATCA". |

### SDK page details [verified]
* The SDK is a Java JAR plus a CLI (`fatoora`). It validates XML invoices, credit and debit notes against XSD, EN16931 and KSA rules, and validates QR codes. It runs on
  **JDK >= 11 and < 15** "to comply with secp256k1". A **Java 21 SDK (Beta)** is also offered, plus a **.NET SDK**.
* Latest version: **SDK 3.4.8 / Simulation SDK 3.4.8**, "bug fixes for the validation rule (BR-KSA-81)". The history goes back to 3.4.4 and earlier.
* Download links (not downloaded; all are SharePoint links, sizes not shown before download):
  * User manual: `https://sandbox.zatca.gov.sa/User_Manual_Developer_Portal_Manual_Version_3.pdf`
  * SDK Java 11 (3.4.8): `https://sadzit.sharepoint.com/:u:/s/EXTERNALZATCA/IQCVzjXNpLTOTZbrYhs_w7aIAb7pPg1wfwl6wACeu1xCPAQ`
  * SDK .NET (3.4.8): `https://sadzit.sharepoint.com/:u:/s/EXTERNALZATCA/IQBFo0TI2yTdRrHw5orrYghGAZUSOoqra29zpIRcCgrqRHI`
  * Java 21 SDK (Beta): `https://sadzit.sharepoint.com/:u:/g/EfoJso7rhCZJmER2rXT7VSQBD-HP7VEGVf8HoRD3Xt-5AA`
* Specifications (E-invoice Specifications tab):
  * Security Features Implementation Standards: `https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20220624_ZATCA_Electronic_Invoice_Security_Features_Implementation_Standards.pdf`
  * XML Implementation Standard: `https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/20220624_ZATCA_Electronic_Invoice_XML_Implementation_Standard_vF.pdf`
  * Data Dictionary (xlsx): `https://zatca.gov.sa/ar/E-Invoicing/SystemsDevelopers/Documents/EInvoice_Data_Dictionary.xlsx`
* License: the terms say that passing SDK validation **does not mean ZATCA approval** and does not shift liability. There is no open-source license. Treat the SDK as a
  free tool you may run, not code you may redistribute.

### API Integration Sandbox [verified]
* Latest release: **Sandbox 2.1.1**. Fixes to QR generation/validation/clearance, CSR validation and decimal rounding. **QR limit raised from 500 to 700 chars**.
  More specific error messages and security/auth hardening.
* Sandbox docs say the reporting API validates **XSD, EN16931 subset, KSA rules (which override EN rules), QR, and cryptographic stamp**.
  Clearance validates the same and then returns the XML with ZATCA's stamp and QR added. Seller-address problems produce warnings (accepted). Other errors reject the document.
* Clearance can be switched off by ZATCA. Clearance then returns **HTTP 303**, and standard documents go to Reporting instead. Code must handle this.
* Swagger pages (`/IntegrationSandbox/complianceCert-api` etc.): Reporting, Clearance, Compliance CSID, Compliance Invoice,
  Production CSID (Onboarding), Production CSID (Renewal). Server: `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal`.

### Environments
| Environment | Base URL | OTP source | CSR template name (OID 1.3.6.1.4.1.311.20.2) |
|---|---|---|---|
| Developer portal sandbox | `https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal` [verified] | Fixed test OTP `123345` [verified] | `TSTZATCA-Code-Signing` [verified accepted]. The swagger sample uses `ZATCA-Code-Signing`. |
| Simulation | `https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation` [doc] | Taxpayer generates it in the **Fatoora simulation portal** (fatoora.zatca.gov.sa → simulation) | `PREZATCA-Code-Signing` |
| Production (core) | `https://gw-fatoora.zatca.gov.sa/e-invoicing/core` [doc] | Taxpayer generates it in the **Fatoora portal** → "Onboard new solution unit/device" (short-lived, roughly 1 h) | `ZATCA-Code-Signing` |

All three use the same paths. Only the base URL changes.

---

## 2. Direct integration flow for Qaftr

### 2.1 Onboarding one EGS unit (one per customer business/branch/device)
1. **Generate a secp256k1 key pair** for the EGS unit. [verified]
2. **Build a CSR** (PKCS#10, ecdsa-with-SHA256). [verified field layout, from decoding ZATCA's swagger sample]
   * Subject: `C=SA` (PrintableString), `OU` = branch name (or the 10-digit TIN for VAT groups), `O` = legal name, `CN` = unit common name.
   * Extension `1.3.6.1.4.1.311.20.2` (template name, UTF8String). See the table above.
   * SAN `directoryName` with:
     * `SN` = EGS serial `1-<solution>|2-<model/version>|3-<serial or UUID>`, for example `1-Qaftr|2-1.0|3-<uuid>`
     * `UID` = 15-digit VAT number
     * `title` = invoice-type flags (4 digits, TSCZ: `1000` standard only, `0100` simplified only, `1100` both)
     * `registeredAddress` = branch address / national short address
     * `businessCategory` = industry
   * The POC builds this CSR in ~60 lines of pure TypeScript (`spikes/zatca-sandbox/src/csr.ts`, `der.ts`).
3. **The taxpayer gets an OTP** from their Fatoora portal. This is the only step that needs the customer, and it cannot be automated. Qaftr's UX is
   "paste your 6-digit OTP".
4. **Compliance CSID**: `POST /compliance`, headers `OTP: <otp>` and `Accept-Version: V2`, body `{"csr": base64(PEM)}`. The response
   has `requestID`, `binarySecurityToken` (= base64 of the base64-DER certificate), `secret` and `dispositionMessage: ISSUED`. [verified]
5. **Compliance checks**: `POST /compliance/invoices` with Basic auth `base64(binarySecurityToken + ":" + secret)` and body
   `{invoiceHash, uuid, invoice: base64(xml)}`. Submit one document per type the CSR declares. For `1100` that is 6 documents: standard and simplified ×
   invoice (388), credit (381) and debit (383). [verified: all 6 PASS]
6. **Production CSID**: `POST /production/csids` with CCSID auth and body `{"compliance_request_id": "<requestID>"}`. You get the PCSID token and secret
   used for all live submissions. [verified]
7. **Renewal** before expiry: `PATCH /production/csids` with a new CSR and a new OTP, then repeat the compliance checks. [doc; not tested in the POC] Read `notAfter` from
   the certificate and alert the customer ahead of time. The sandbox CCSID was valid for 5 years. Production validity may differ.

### 2.2 Per-document requirements
* **UBL 2.1 XML** per the XML Implementation Standard. Key fields:
  * `ProfileID=reporting:1.0`
  * `InvoiceTypeCode` with `name="0100000"` (standard) or `"0200000"` (simplified). The positions after the first two flag third-party, nominal, export,
    summary and self-billed.
  * `UUID`
  * `IssueDate` / `IssueTime`
  * `AdditionalDocumentReference` ICV, PIH and QR
  * `cac:Signature`
  * supplier with CRN, address (building number 4 digits, postal 5 digits) and VAT
  * buyer: required for standard documents (VAT + address), optional for simplified
  * `BillingReference` + reason (`InstructionNote`) for credit/debit notes
  * two `TaxTotal` blocks (one with subtotals)
  * `LegalMonetaryTotal`
  * per-line `TaxTotal` with `RoundingAmount` [verified]
* **ICV** (invoice counter value): a strictly increasing integer per EGS. **PIH**: the previous document's invoice hash. The first PIH is
  `base64(hex(sha256("0")))` = `NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==`. [verified]
  Credit and debit notes are part of the same chain.
* **Invoice hash**: remove `ext:UBLExtensions`, `cac:Signature` and the `AdditionalDocumentReference[ID='QR']`, then **C14N 1.1**, SHA-256, base64.
  [verified independently with the JDK's built-in C14N 1.1, `spikes/zatca-sandbox/verify/HashCheck.java`]
* **XAdES-B-B enveloped signature** inside `UBLExtensions`:
  * ECDSA-SHA256 `SignatureValue`
  * cert digest = `base64(hex(sha256(base64Cert)))`
  * `SignedProperties` holding SigningTime, CertDigest and IssuerSerial (issuer DN in reverse RDN order, serial in decimal)
  * signed-properties digest = `base64(hex(sha256(serialized SignedProperties)))`
  * **Gotcha [verified]:** ZATCA serializes SignedProperties with `xmlns:xades` on the element, `xmlns:ds` on each `ds:*` child, and
    **self-closing `<ds:DigestMethod/>`**. Strict C14N (`></ds:DigestMethod>`) was rejected with `signed-properties-hashing`.
* **QR (simplified documents must print it; standard documents get it back from clearance)**: TLV, base64. Fields:
  * 1 seller name
  * 2 VAT number
  * 3 timestamp
  * 4 total with VAT
  * 5 VAT
  * 6 invoice hash
  * 7 ECDSA signature
  * 8 public key (SPKI DER)
  * 9 ZATCA CA's signature on the stamp certificate (simplified only)

  The limit is now 700 chars. [verified]
* **Reporting** (simplified B2C): `POST /invoices/reporting/single`, header `Clearance-Status: 0`, PCSID auth. Report **within 24 hours** of issuing
  [doc]. You can hand the invoice to the customer immediately. [verified REPORTED]
* **Clearance** (standard B2B): `POST /invoices/clearance/single`, header `Clearance-Status: 1`. You must clear the invoice **before** sharing it. Share the
  returned `clearedInvoice` (ZATCA-stamped XML), not your own. [verified CLEARED]
* **Headers**: `Accept-Version: V2` (a missing or wrong value gives `406 "This Version is not supported or not provided in the header"`) [verified],
  `Accept-Language: en|ar` (message language), `Content-Type: application/json`.
* **Responses** come as `validationResults{infoMessages, warningMessages, errorMessages, status}` plus `reportingStatus` / `clearanceStatus`.
  * HTTP 200 accepted
  * 202 accepted with warnings [doc]
  * 400 rejected (for example `invoiceHash_QRCODE_INVALID`, `QRCODE_INVALID`, `signed-properties-hashing`, `Missing-OTP`, `Invalid-OTP`) [verified]
  * 401 bad auth
  * 303 clearance disabled
  * 406 version
  * 409 duplicate [belief]
  * 500 `Invalid-Request`

  Each message carries a `code` (often a business-rule ID such as `BR-KSA-xx`, `BR-xx`) and a `category`.

### 2.3 Multi-tenant considerations
* **One EGS unit = one key + CCSID + PCSID + ICV/PIH chain.** For Qaftr: one unit per customer business at minimum, and one per branch
  if they want separate counters. Never share a unit across taxpayers. The certificate is bound to one VAT number.
* The ICV/PIH chain must be **serialized** per unit. Two invoices signed at the same time with the same PIH break the chain. Use a row lock or a Durable Object per EGS.
* Private keys and PCSID secrets are high-value. Encrypt them at rest with a key kept outside Postgres, and never send them to the client.
* Track certificate expiry, and handle revocation and re-onboarding (new OTP).
* Support the 303 "clearance disabled" fallback, and offline/queued reporting.

---

## 3. Official SDK and open-source libraries

**ZATCA SDK** (Java 11–14, Java 21 beta, .NET). CLI `fatoora` with `-validate`, `-sign`, `-generateHash`, `-qr`, `-csr`, `-invoiceRequest` [doc/belief: flag
names from the manual]. It cannot run in Workers. Use it as a **CI oracle**: validate golden XMLs from our TS signer on every change. The machine already has
JDK 17, so we need JDK 11 or the Java 21 beta.

**Cloudflare Workers constraint:** WebCrypto has no secp256k1, and Workers' `node:crypto` is BoringSSL-based, which also lacks it. `@noble/curves`
(audited, zero-dependency, pure JS) handles keys and ECDSA fine. The POC proves the whole flow without OpenSSL. **No separate signing service is
needed.** Signing costs about 1–3 ms of CPU.

npm and GitHub landscape (checked 2026-11-09):

| Package / repo | Lang | Stars / last push | License | Notes |
|---|---|---|---|---|
| `zatca-xml-js` (wes4m) | TS/Node | 92 / 2024-03 | MIT | The original reference. Uses Node `crypto` and OpenSSL for CSR. Unmaintained. Uses whitespace-sensitive templates. |
| `SallaApp/ZATCA` | PHP | 168 / 2026-11 | MIT | Mainly a QR (Phase 1/2) library. Well maintained. |
| `Saleh7/php-zatca-xml` | PHP | 62 / 2026-04 | MIT | Full Phase 2 in PHP. Good cross-reference. |
| `@talha7k/zatca` | TS | 3 / 2026-11 | **AGPL-3.0** | Active, but AGPL is unsuitable for SaaS embedding. |
| `zatca-sdk` (aashahin), `@jaicome/zatca-core`, `@dokhna-tech/zatca`, `zatca-lite`, `@khaledhajsalem/zatca-node`, `@pioneersoft/zatca-einvoice` | TS | 0–4 stars, 2026 | MIT / mixed | Many new, low-adoption packages. Unknown quality. Use them as reading material only, not as dependencies. |
| `fatoority` | WASM | 2026-10 | ? | WASM bindings. Interesting for Workers, but unverified. |

**Recommendation:** own the roughly 600 lines of core (DER/CSR, canonical UBL builder, hash, XAdES, QR, API client) in `packages/shared`, built on `@noble/*`.
Pin the behaviour with golden-file tests checked by the official SDK. Note: a `packages/shared/src/zatca-phase2/` work-in-progress (asn1, csr, hash,
ubl-builder, validate, with `@noble` 2.4.0) already appeared in the working tree during this session. It is not from this agent. The POC findings in §2.2
(SignedProperties serialization, PCSID key mismatch, lenient sandbox) apply directly to it.

---

## 4. Effort, risks and solution-provider requirements

### Do we need certification?
* **No mandatory certification for solution providers.** ZATCA keeps a **Solution Providers Directory**. Getting listed needs a qualification program:
  an application, a demo to ZATCA, and signing a Memo of Cooperation. ZATCA says the list is **guidance only, not approval or certification**, and that a taxpayer
  is compliant whenever its e-invoices meet the requirements, even if the provider is not listed
  ([directory](https://zatca.gov.sa/en/E-Invoicing/SolutionProviders/Pages/SolutionProvidersDirectory.aspx),
  [FAQ_039](https://zatca.gov.sa/en/E-Invoicing/Introduction/FAQ/Pages/FAQ_039.aspx),
  [FAQ_037](https://zatca.gov.sa/en/E-Invoicing/Introduction/FAQ/Pages/FAQ_037.aspx)).
* Being listed is a strong **trust and marketing asset**. Competitors advertise it (for example Qoyod). Plan to apply after go-live.
* Every EGS unit passes ZATCA's compliance checks during onboarding. That is the real technical gate.

### Market timing
* **Wave 25** covers VAT-taxable revenue > **SAR 187,500** in any of 2022–2025, with a deadline of **1 Feb 2027**. That is half the Wave 24 threshold (SAR 375k, deadline
  30 Jun 2026). This sweeps in a large group of small SMEs, which is exactly Qaftr's segment.
  Sources: [ZATCA Wave 25](https://zatca.gov.sa/en/MediaCenter/News/Pages/Wave25-E-invoicing.aspx), [KPMG](https://kpmg.com/us/en/taxnewsflash/news/2026/07/saudi-arabia-e-invoicing-mandatory-for-taxpayers-with-revenue-above-sar-187500.html),
  [EY](https://www.ey.com/en_gl/technical/tax-alerts/saudi-arabia-announces-25th-wave-of-phase-2-e-invoicing-integration).
* Roughly 12 weeks remain. Direct integration is feasible in that window only if work starts now.

### Solo-developer estimate (focused weeks)
| Phase | Scope | Est. |
|---|---|---|
| 0 | Harden the POC core in `packages/shared`, add golden tests, run the SDK in CI | 1 wk |
| 1 | **Simplified reporting**: EGS onboarding UX (OTP paste), 6 compliance docs auto-generated, PCSID storage, ICV/PIH chain, QR on PDF, queue + retry, submission log | 2–3 wk |
| 2 | **Simulation** end-to-end with a real taxpayer (beta customer) OTP, then production with one pilot customer | 1 wk (calendar time depends on the customer) |
| 3 | **Standard clearance (B2B)**: buyer data validation, synchronous clear before PDF/share, store and render the cleared XML/QR, 303 fallback | 1–2 wk |
| 4 | Credit/debit notes UI, exemptions (Z/E/O reason codes), discounts, renewal, alerting, Arabic error explainer | 2 wk |

Total is about **7–9 weeks** to cover the common SME cases.

### Risks
* **Sandbox leniency [verified]:** the developer-portal sandbox accepted a tampered XML and a signature from an unrelated key. A sandbox PASS proves only
  the schema, business rules and QR/hash agreement. Mitigation: SDK validation in CI, then simulation.
* **Serialization quirks** (SignedProperties, rounding rules BR-KSA-xx, 2-decimal amounts), and the SDK changes often (3.4.x).
* **Operational:** the 24h reporting SLA needs a reliable queue. Clearance outages block B2B invoicing, so the UI must show "pending clearance".
* **Key custody:** a leaked key lets someone issue invoices as the customer. Encrypt keys and keep audit logs.
* **Support load:** customers need help generating OTPs and with branch/VAT-group edge cases.
* **Liability:** non-compliant invoices lead to taxpayer penalties. Use clear terms and disclaimers, and never imply government affiliation.

---

## 5. Opportunities, ranked by traffic and revenue against effort

| # | Opportunity | Value | Effort | Notes |
|---|---|---|---|---|
| 1 | **"Qaftr Phase 2" product for SMEs (Wave 25)** | ★★★★★ revenue | L (core of §4) | 187.5k threshold + Feb 2027 deadline = urgent demand. Price against middleware-based competitors. Gated Pro feature. |
| 2 | **ZATCA error/warning code explainer** (AR/EN, searchable, one page per `BR-KSA-xx` / API code) | ★★★★ long-tail SEO | S–M | Every integrator searches these codes. Source the rules from the XML standard + SDK rule set + Discourse. Each page funnels to tools and the product. |
| 3 | **QR decoder/validator for tags 1–9** (paste a string or scan, client-side) | ★★★★ traffic | S | Already #1–2 in TOOLS_ROADMAP. Extends `zatca-qr.ts`. Add Phase 2 tag parsing, signature/public-key display, 700-char check and an Arabic explanation. |
| 4 | **Phase 2 readiness checker + wave checker** ("هل أنا ملزم بالربط؟") | ★★★★ conversion | S | Extends the existing `/tools/zatca-wave-checker` with a checklist (CR, branch address, OTP, device list). Captures leads for #1. |
| 5 | **Client-side XML invoice validator** (XSD-lite + KSA rules + hash recompute + QR cross-check) | ★★★ dev + accountant traffic | M | ZATCA's web validator needs a login. Ours works without one, in the browser, with Arabic messages. Reuse `packages/shared` validate. |
| 6 | **Invoice hash / PIH calculator** for developers | ★★ niche dev SEO | S | Byproduct of the core. "zatca invoice hash calculator" queries. |
| 7 | **CSR generator (keys never leave the browser)** | ★★ dev SEO + trust | S | The POC CSR code runs as-is in the browser. Offer OpenSSL config export too. Must state clearly that the private key stays local. |
| 8 | **Accountant multi-client onboarding** | ★★★★ revenue (B2B2C) | M (after #1) | One accountant onboards 20 clients' EGS units with each client's OTP. Bulk status dashboard, cert-expiry alerts. |
| 9 | **Developer API / SDK for small apps (B2B2B)**: "sign + report as a service" | ★★★ revenue | L | Turns Qaftr into a lightweight middleware for POS and e-commerce makers. Do it later, once #1 is stable. Competes with existing middleware. |
| 10 | **Sample XML library** (all 6 doc types + exemptions, annotated AR/EN) | ★★ SEO / link magnet | S | Generated by our builder and validated by the SDK. Pairs well with #2 and #5. |
| 11 | **Sandbox playground** (run the developer-portal flow from the browser with throwaway keys) | ★★ dev | M | Needs a tiny proxy because of CORS. Nice demo, low priority. |
| 12 | **Certificate inspector** (paste a binarySecurityToken and show expiry, VAT, EGS serial, type flags) | ★ dev | XS | Byproduct of `cert.ts`. |

Order to build: **#3, #4, #2 (SEO, quick) in parallel with #1 (revenue)**, then #8, then #5, #6, #7 and #10 as byproducts, and #9 last.

---

## 6. Recommended architecture (proposal only; no app code or schema changed)

### Data model additions (Drizzle)
* `egs_units`:
  * `id`, `business_id`, `branch_name`, `env` (developer|simulation|production), `egs_serial` (`1-Qaftr|2-x|3-uuid`), `invoice_type_flags`
  * `status` (pending_otp, compliance, active, expiring, revoked)
  * `icv_last` (int), `pih_last` (text), `cert_not_after`, `created_at`
* `egs_credentials`:
  * `egs_unit_id`, `kind` (ccsid|pcsid)
  * `cert_b64`, `secret_enc`, `private_key_enc`, `key_version`, `request_id`, `issued_at`, `not_after`
  * Encrypted fields use envelope encryption (AES-GCM with a data key wrapped by a Worker secret / KMS).
* `invoices` gains:
  * `zatca_doc_type` (388/381/383), `zatca_subtype` (0100000/0200000), `uuid`
  * `icv`, `pih`, `invoice_hash`, `qr_payload`, `signed_xml_r2_key`, `cleared_xml_r2_key`
  * `zatca_status` (draft, signed, queued, reported, cleared, rejected, warning)
  * `billing_reference_invoice_id`, `adjustment_reason`, `egs_unit_id`
* `zatca_submissions` (append-only): `id`, `invoice_id`, `egs_unit_id`, `endpoint`, `attempt`, `http_status`, `status`, `warnings jsonb`, `errors jsonb`, `requested_at`, `responded_at`.
* Store XML in **R2**, not Postgres. Keep hashes in Postgres.

### Where signing happens
* **In the Worker**, with `@noble/curves` (proven by the POC). Not on the client, because keys must never reach browsers or mobile.
* Signing plus the ICV/PIH bump must be **atomic per EGS**. Use a Postgres transaction with `SELECT ... FOR UPDATE` on `egs_units`, or (better on Workers) one
  **Durable Object per EGS unit** that owns the counter, signs and enqueues. That also gives natural serialization.

### Reporting and clearance pipeline
* Simplified: sign, then persist (status `queued`), then **Cloudflare Queue** with retries and exponential backoff, then reporting API, then status update.
  Run a cron sweeper for anything not reported after 12h, and alert at 20h (the SLA is 24h). The PDF and QR are available immediately.
* Standard: sign, then **synchronous** clearance in the request with a timeout. On success, store `clearedInvoice` and render the PDF from the cleared QR. On 303, fall back
  to reporting. On outage, set status `pending_clearance` and block sharing.
* tRPC procedures: `zatca.onboard.start` (create EGS + CSR), `zatca.onboard.submitOtp` (CCSID → 6 compliance docs → PCSID, all server-side), `zatca.status`,
  `invoices.issue` (signs and dispatches).

### Secrets
* Worker secret `ZATCA_KEK` (or Cloudflare Secrets Store) wraps per-EGS data keys. Rotate it with `key_version`.
* Never log tokens. Redact like `spikes/zatca-sandbox/src/api.ts:redact`.

---

## 7. Proof of concept (`spikes/zatca-sandbox/`): results

| Step | Result |
|---|---|
| Pure-TS secp256k1 key + CSR | ✅ `openssl req -verify` OK |
| Compliance CSID (OTP 123345) | ✅ 200 ISSUED. Certificate bound to our key (issuer `CN=eInvoicing`). |
| 6 compliance checks (simplified + standard × 388/381/383, ICV/PIH chained) | ✅ all PASS, 0 warnings |
| Production CSID | ✅ 200 ISSUED. Fixed sandbox certificate (issuer `CN=PRZEINVOICESCA4-CA, DC=extgazt, DC=gov, DC=local`), **not bound to our key**. |
| Reporting (simplified) | ❌ first run `signed-properties-hashing`. ✅ REPORTED after the self-closing `DigestMethod` fix. |
| Clearance (standard) | ✅ CLEARED, stamped XML returned |
| Negative tests | Wrong hash → `invoiceHash_QRCODE_INVALID`. Broken QR → `QRCODE_INVALID`. **Tampered body and wrong-key signature were still REPORTED** (lenient sandbox). |
| Independent hash check (JDK C14N 1.1) | ✅ MATCH |
| Signature scheme verified by the official SDK | ✅ done 2026-11-13: SDK 3.4.8 on JDK 11 passes XSD, EN, KSA, QR, SIGNATURE and PIH for freshly built simplified + standard invoices (`bun run zatca:sdk-check` in packages/shared). Gotchas: JDK 11–14 only (secp256k1); force `-Dfile.encoding=UTF-8` on Windows; never run the SDK `install.bat` (it runs `SETX PATH ""`); the SDK compares issuer/serial with its configured `certPath`. |

Not attempted, by design: the simulation and production environments, which need a real taxpayer's Fatoora OTP.

## Next steps
1. User approves downloading the ZATCA SDK 3.4.8 (Java 11 or Java 21 beta). Run `fatoora -validate` on the `spikes/zatca-sandbox/out/*.xml` files signed with the
   CCSID certificate, to confirm the signature scheme and catch rule gaps.
2. Merge the POC lessons into the `packages/shared/src/zatca-phase2/` work in progress and add golden tests.
3. Ship quick SEO tools (QR decoder tags 1–9, readiness checker, error-code explainer) while building Phase 1 (simplified reporting).
4. Recruit 1–2 Wave 25 beta customers to get simulation OTPs.
5. After go-live, apply to the ZATCA Solution Providers Directory.

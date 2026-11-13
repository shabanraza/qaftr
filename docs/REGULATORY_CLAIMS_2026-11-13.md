# Regulatory claims register — 2026-11-13

Every tax/legal statement shown to users on the Saudi and UAE tool pages, the page it appears on,
and the official source it was checked against. Sources were downloaded from zatca.gov.sa and
tax.gov.ae on 2026-11-13 and read in full text (not summaries). English versions of ZATCA guidance
state the Arabic version prevails; the FTA consolidated regulation is an unofficial translation.

| # | Claim (as worded on site) | Page(s) | Source | Status |
|---|---|---|---|---|
| 1 | VAT registration is mandatory when taxable supplies exceed SAR 375,000 in 12 months | `/tools/non-tax-invoice` FAQ | ZATCA *Guideline for Tax Invoicing and Records under VAT Provisions*, v3 May 2026, §3.2 | ✅ Verified |
| 2 | Voluntary registration is possible above SAR 187,500 | `/tools/non-tax-invoice` FAQ | Same guideline, §3.3 ("taxable supplies or taxable expenses exceed SAR 187,500") | ✅ Verified |
| 3 | A non-registered business must not issue a tax invoice or any document showing a VAT amount, or collect VAT; fine up to SAR 100,000 | `/tools/non-tax-invoice` FAQ + notice | Same guideline, §2 (any document showing the tax amount is treated as a tax invoice) and §4.1.3; ZATCA penalties table | ✅ Verified — **corrected**: earlier copy said "show a VAT number", which is not how the rule is written |
| 4 | E-invoicing and the QR code apply to tax invoices issued by VAT taxpayers; a non-registered business issues a regular invoice without VAT or QR | `/tools/non-tax-invoice` FAQ | Follows from #3 (non-registered persons may not issue tax invoices) and ZATCA e-invoicing guidance (scope: resident taxable persons; QR mandatory on simplified tax invoices) | ✅ Verified by inference — **reworded** to avoid implying an exemption list. The E-invoicing Regulation PDF URL on zatca.gov.sa currently returns "page not found" |
| 5 | Credit note may be issued only for an adjustment to a prior supply: cancellation/suspension, substantial change, change in agreed value (incl. later discount), accepted return, error in supplier/customer information | `/tools/credit-note` | ZATCA invoicing guideline §7.1 (Art. 40(1) Implementing Regulations) | ✅ Verified |
| 6 | Credit note must be issued no later than 15 days of the month following the event | `/tools/credit-note` | Same guideline §7.2 | ✅ Verified |
| 7 | Credit note must state its type and the serial number of the tax invoice it amends | `/tools/credit-note` | Same guideline §7 intro (Art. 57 Unified VAT Agreement, Art. 54 IR) | ✅ Verified |
| 8 | UAE simplified tax invoice allowed when the recipient is not registered, or is registered and the consideration is ≤ AED 10,000 | `/ae/tools/invoice-generator` rule + FAQ | UAE VAT Executive Regulation (consolidated 18-09-2025), Art. 59(5) | ✅ Verified |
| 9 | The AED 10,000 is VAT-inclusive | `/ae/tools/invoice-generator` | FTA guide *VAT11 Tax invoices*: "the consideration (VAT inclusive price) for the supply is AED 10 000 or less" | ✅ Verified |
| 10 | Once tax invoices are issued as e-invoices (mandatory or voluntary), the simplified invoice rules no longer apply | `/ae/tools/invoice-generator` rule + FAQ | Executive Regulation Art. 59(16), amended by Cabinet Decision No. 100 of 2025 (Clauses 2, 3, 5, 7, 8, 15 do not apply) | ✅ Verified — **reworded** to cite the clause and drop the "verify with the FTA" hedge |

## Sources

- ZATCA — [Guideline for Tax Invoicing and Records under VAT Provisions (v3, May 2026)](https://zatca.gov.sa/en/HelpCenter/guidelines/Documents/Guideline-for-Tax-Invoicing-and-Records-under-VAT-Provisions.pdf)
- ZATCA — [Taxation violation fines](https://zatca.gov.sa/en/RulesRegulations/VAT/Pages/Penalties.aspx)
- ZATCA — [E-invoicing detailed guideline](https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-Invoicing_Detailed__Guideline.pdf)
- FTA — [Executive Regulation of Federal Decree-Law No. 8 of 2017, consolidated 18-09-2025](https://tax.gov.ae/Datafolder/Files/Legislation/Executive-Regulation-of-Federal-Decree-Law-No-08-of-2017-Publish-18-09-2025.pdf)
- FTA — [VAT11 Tax invoices guide](https://tax.gov.ae/Datafolder/Files/Pdf/2023/Knowledge%20Center%20Page/VAT11%20-%20Tax%20invoices%20En.pdf)

Re-check this register when ZATCA or the FTA publishes a new guideline version.

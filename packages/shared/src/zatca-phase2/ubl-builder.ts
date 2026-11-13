/**
 * UBL 2.1 XML builder for ZATCA Phase 2 (simplified/standard tax invoices,
 * credit notes 381 and debit notes 383).
 *
 * Output is compact (no inter-element whitespace) and canonical by
 * construction: attributes are emitted in C14N order and empty elements are
 * never self-closed, so `canonicalize(xml)` equals the body after the XML
 * declaration. Compact output also avoids the whitespace-sensitivity issues
 * that pretty-printed XML has with the ZATCA hash and SignedProperties digest.
 *
 * The unsigned document contains cac:Signature (excluded from the hash) and
 * no UBLExtensions / QR reference; `signInvoice` inserts those.
 */

import { NS } from "./namespaces";
import {
  DOCUMENT_TYPE_CODES,
  EXEMPTION_REASONS,
  type ZatcaAddress,
  type ZatcaInvoiceInput,
  type ZatcaInvoiceSubtype,
  type ZatcaLineInput,
  type ZatcaTransactionFlags,
  type ZatcaVatCategory,
} from "./invoice-model";
import { validateZatcaInvoice, type ValidateOptions, type ZatcaValidationIssue } from "./validate";
import { escapeAttr, escapeText } from "./xml";

export class ZatcaInvoiceValidationError extends Error {
  readonly issues: ZatcaValidationIssue[];
  constructor(issues: ZatcaValidationIssue[]) {
    super(`ZATCA invoice validation failed: ${issues.map((i) => i.code).join(", ")}`);
    this.name = "ZatcaInvoiceValidationError";
    this.issues = issues;
  }
}

// ---------------------------------------------------------------- numbers

/** Half-up rounding to 2 dp, robust to binary float noise (1.005 -> 1.01). */
export function round2(x: number): number {
  return Math.round(Number((x * 100).toPrecision(15))) / 100;
}

const amount = (n: number) => round2(n).toFixed(2);

function decimal(n: number, maxDp = 6): string {
  return String(Number(n.toFixed(maxDp)));
}

function price(n: number): string {
  const r = Number(n.toFixed(6));
  return Number.isInteger(Number((r * 100).toPrecision(15))) ? r.toFixed(2) : String(r);
}

// ---------------------------------------------------------------- totals

export interface ZatcaLineTotals {
  netUnitPrice: number;
  net: number;
  vat: number;
  gross: number;
}

export interface ZatcaTaxSubtotal {
  category: ZatcaVatCategory;
  rate: number;
  taxable: number;
  vat: number;
  exemptionReasonCode?: string;
  exemptionReason?: string;
}

export interface ZatcaTotals {
  lines: ZatcaLineTotals[];
  subtotals: ZatcaTaxSubtotal[];
  lineExtension: number;
  taxExclusive: number;
  vatTotal: number;
  taxInclusive: number;
  payable: number;
}

function exemptionText(line: ZatcaLineInput): string | undefined {
  if (!line.exemptionReasonCode || line.vatCategory === "S") return undefined;
  return line.exemptionReason ?? EXEMPTION_REASONS[line.vatCategory][line.exemptionReasonCode];
}

export function computeZatcaTotals(lines: readonly ZatcaLineInput[]): ZatcaTotals {
  const lineTotals = lines.map((l): ZatcaLineTotals => {
    const netUnitPrice = l.unitPrice - (l.discountPerUnit ?? 0);
    const net = round2(l.quantity * netUnitPrice);
    const vat = round2((net * l.vatRate) / 100);
    return { netUnitPrice, net, vat, gross: round2(net + vat) };
  });

  const groups = new Map<string, ZatcaTaxSubtotal>();
  lines.forEach((l, i) => {
    const key = `${l.vatCategory}|${l.vatRate}|${l.exemptionReasonCode ?? ""}`;
    let g = groups.get(key);
    if (!g) {
      g = { category: l.vatCategory, rate: l.vatRate, taxable: 0, vat: 0 };
      const text = exemptionText(l);
      if (l.exemptionReasonCode && l.vatCategory !== "S") g.exemptionReasonCode = l.exemptionReasonCode;
      if (text) g.exemptionReason = text;
      groups.set(key, g);
    }
    g.taxable = round2(g.taxable + (lineTotals[i] as ZatcaLineTotals).net);
  });
  const subtotals = [...groups.values()].map((g) => ({ ...g, vat: round2((g.taxable * g.rate) / 100) }));

  const lineExtension = round2(lineTotals.reduce((s, l) => s + l.net, 0));
  const vatTotal = round2(subtotals.reduce((s, g) => s + g.vat, 0));
  const taxInclusive = round2(lineExtension + vatTotal);
  return {
    lines: lineTotals,
    subtotals,
    lineExtension,
    taxExclusive: lineExtension,
    vatTotal,
    taxInclusive,
    payable: taxInclusive,
  };
}

// ---------------------------------------------------------------- XML helpers

type Attrs = ReadonlyArray<readonly [string, string]>;

/** Element with escaped text; attrs must already be in C14N order. */
function t(name: string, text: string, attrs: Attrs = []): string {
  const a = attrs.map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join("");
  return `<${name}${a}>${escapeText(text)}</${name}>`;
}

/** Element wrapping pre-built child XML. */
function e(name: string, ...children: Array<string | false | undefined>): string {
  return `<${name}>${children.filter(Boolean).join("")}</${name}>`;
}

const SAR: Attrs = [["currencyID", "SAR"]];
const money = (name: string, n: number) => t(name, amount(n), SAR);

export function invoiceTypeName(subtype: ZatcaInvoiceSubtype, flags: ZatcaTransactionFlags = {}): string {
  const bit = (b?: boolean) => (b ? "1" : "0");
  return (
    (subtype === "standard" ? "01" : "02") +
    bit(flags.thirdParty) +
    bit(flags.nominal) +
    bit(flags.exports) +
    bit(flags.summary) +
    bit(flags.selfBilled)
  );
}

function address(a: Partial<ZatcaAddress>): string {
  return e(
    "cac:PostalAddress",
    a.street && t("cbc:StreetName", a.street),
    a.additionalStreet && t("cbc:AdditionalStreetName", a.additionalStreet),
    a.buildingNumber && t("cbc:BuildingNumber", a.buildingNumber),
    a.plotIdentification && t("cbc:PlotIdentification", a.plotIdentification),
    a.district && t("cbc:CitySubdivisionName", a.district),
    a.city && t("cbc:CityName", a.city),
    a.postalCode && t("cbc:PostalZone", a.postalCode),
    a.countrySubentity && t("cbc:CountrySubentity", a.countrySubentity),
    a.country && e("cac:Country", t("cbc:IdentificationCode", a.country)),
  );
}

const VAT_SCHEME = e("cac:TaxScheme", t("cbc:ID", "VAT"));

function party(p: {
  registrationName?: string;
  vatNumber?: string;
  otherId?: { scheme: string; value: string };
  address?: Partial<ZatcaAddress>;
}): string {
  return e(
    "cac:Party",
    p.otherId &&
      p.otherId.value &&
      e("cac:PartyIdentification", t("cbc:ID", p.otherId.value, [["schemeID", p.otherId.scheme]])),
    p.address && address(p.address),
    p.vatNumber && e("cac:PartyTaxScheme", t("cbc:CompanyID", p.vatNumber), VAT_SCHEME),
    p.registrationName && e("cac:PartyLegalEntity", t("cbc:RegistrationName", p.registrationName)),
  );
}

function taxCategory(tag: string, category: ZatcaVatCategory, rate: number, code?: string, reason?: string): string {
  return e(
    tag,
    t("cbc:ID", category, [
      ["schemeAgencyID", "6"],
      ["schemeID", "UN/ECE 5305"],
    ]),
    t("cbc:Percent", rate.toFixed(2)),
    code && t("cbc:TaxExemptionReasonCode", code),
    reason && t("cbc:TaxExemptionReason", reason),
    e(
      "cac:TaxScheme",
      t("cbc:ID", "VAT", [
        ["schemeAgencyID", "6"],
        ["schemeID", "UN/ECE 5153"],
      ]),
    ),
  );
}

// ---------------------------------------------------------------- builder

export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
export const SIGNATURE_PLACEHOLDER_ELEMENT =
  "<cac:Signature><cbc:ID>urn:oasis:names:specification:ubl:signature:Invoice</cbc:ID>" +
  "<cbc:SignatureMethod>urn:oasis:names:specification:ubl:dsig:enveloped:xades</cbc:SignatureMethod></cac:Signature>";

export interface BuildOptions extends ValidateOptions {
  /** Skip validation (only for tests reproducing third-party samples). */
  skipValidation?: boolean;
}

export function buildInvoiceXml(input: ZatcaInvoiceInput, options: BuildOptions = {}): string {
  if (!options.skipValidation) {
    const result = validateZatcaInvoice(input, options);
    if (!result.ok) throw new ZatcaInvoiceValidationError(result.issues);
  }
  const totals = computeZatcaTotals(input.lines);
  const isNote = input.kind !== "invoice";

  const rootOpen =
    `<Invoice xmlns="${NS.invoice}" xmlns:cac="${NS.cac}" xmlns:cbc="${NS.cbc}" xmlns:ext="${NS.ext}">`;

  const lines = input.lines.map((l, i) => {
    const lt = totals.lines[i] as ZatcaLineTotals;
    return e(
      "cac:InvoiceLine",
      t("cbc:ID", String(i + 1)),
      t("cbc:InvoicedQuantity", decimal(l.quantity), [["unitCode", l.unitCode ?? "PCE"]]),
      money("cbc:LineExtensionAmount", lt.net),
      e("cac:TaxTotal", money("cbc:TaxAmount", lt.vat), money("cbc:RoundingAmount", lt.gross)),
      e(
        "cac:Item",
        t("cbc:Name", l.name),
        e(
          "cac:ClassifiedTaxCategory",
          t("cbc:ID", l.vatCategory),
          t("cbc:Percent", l.vatRate.toFixed(2)),
          VAT_SCHEME,
        ),
      ),
      e(
        "cac:Price",
        t("cbc:PriceAmount", price(lt.netUnitPrice), SAR),
        l.discountPerUnit
          ? e(
              "cac:AllowanceCharge",
              t("cbc:ChargeIndicator", "false"),
              t("cbc:AllowanceChargeReason", "discount"),
              t("cbc:Amount", price(l.discountPerUnit), SAR),
              t("cbc:BaseAmount", price(l.unitPrice), SAR),
            )
          : undefined,
      ),
    );
  });

  const body = [
    t("cbc:ProfileID", "reporting:1.0"),
    t("cbc:ID", input.id),
    t("cbc:UUID", input.uuid),
    t("cbc:IssueDate", input.issueDate),
    t("cbc:IssueTime", input.issueTime),
    t("cbc:InvoiceTypeCode", DOCUMENT_TYPE_CODES[input.kind], [
      ["name", invoiceTypeName(input.subtype, input.flags)],
    ]),
    input.note && t("cbc:Note", input.note),
    t("cbc:DocumentCurrencyCode", "SAR"),
    t("cbc:TaxCurrencyCode", "SAR"),
    isNote &&
      input.billingReference &&
      e("cac:BillingReference", e("cac:InvoiceDocumentReference", t("cbc:ID", input.billingReference.invoiceId))),
    e("cac:AdditionalDocumentReference", t("cbc:ID", "ICV"), t("cbc:UUID", String(input.icv))),
    e(
      "cac:AdditionalDocumentReference",
      t("cbc:ID", "PIH"),
      e("cac:Attachment", t("cbc:EmbeddedDocumentBinaryObject", input.pih, [["mimeCode", "text/plain"]])),
    ),
    SIGNATURE_PLACEHOLDER_ELEMENT,
    e("cac:AccountingSupplierParty", party(input.seller)),
    input.buyer ? e("cac:AccountingCustomerParty", party(input.buyer)) : e("cac:AccountingCustomerParty"),
    input.supplyDate &&
      e(
        "cac:Delivery",
        t("cbc:ActualDeliveryDate", input.supplyDate),
        input.supplyEndDate && t("cbc:LatestDeliveryDate", input.supplyEndDate),
      ),
    (input.paymentMeansCode || (isNote && input.noteReason)) &&
      e(
        "cac:PaymentMeans",
        t("cbc:PaymentMeansCode", input.paymentMeansCode ?? "10"),
        isNote && input.noteReason && t("cbc:InstructionNote", input.noteReason),
      ),
    e("cac:TaxTotal", money("cbc:TaxAmount", totals.vatTotal)),
    e(
      "cac:TaxTotal",
      money("cbc:TaxAmount", totals.vatTotal),
      ...totals.subtotals.map((s) =>
        e(
          "cac:TaxSubtotal",
          money("cbc:TaxableAmount", s.taxable),
          money("cbc:TaxAmount", s.vat),
          taxCategory("cac:TaxCategory", s.category, s.rate, s.exemptionReasonCode, s.exemptionReason),
        ),
      ),
    ),
    e(
      "cac:LegalMonetaryTotal",
      money("cbc:LineExtensionAmount", totals.lineExtension),
      money("cbc:TaxExclusiveAmount", totals.taxExclusive),
      money("cbc:TaxInclusiveAmount", totals.taxInclusive),
      money("cbc:AllowanceTotalAmount", 0),
      money("cbc:PrepaidAmount", 0),
      money("cbc:PayableAmount", totals.payable),
    ),
    ...lines,
  ]
    .filter(Boolean)
    .join("");

  return `${XML_DECLARATION}\n${rootOpen}${body}</Invoice>`;
}

/**
 * Inspects a ZATCA UBL 2.1 invoice XML (as received or produced by another
 * solution) and reports what can be checked locally, without ZATCA state:
 *  - mandatory elements present (XML Implementation Standard v1.2)
 *  - the shared BR-KSA / EN16931 rules (validateZatcaInvoice) on the parsed values
 *  - totals consistency (BR-CO-10/13/14/15/16, line nets, VAT per subtotal)
 *  - QR (TLV decode + agreement with the document, invoice hash and signature)
 *  - cryptographic stamp (verifySignedInvoice: hashes and ECDSA signature
 *    against the certificate embedded in the file; it does NOT check that
 *    ZATCA issued that certificate or received the invoice)
 * Pure TS, runs in the browser. Element names are matched literally, so the
 * conventional cac/cbc prefixes are required (as in ZATCA's samples).
 */

import { type DecodedZatcaQr, type ZatcaQrDecodeError, type ZatcaQrIssue, decodeZatcaQrPayload } from "../zatca-qr-decode";
import { computeInvoiceHash } from "./hash";
import type {
  BuyerIdScheme,
  PaymentMeansCode,
  SellerIdScheme,
  ZatcaAddress,
  ZatcaBuyer,
  ZatcaDocumentKind,
  ZatcaInvoiceInput,
  ZatcaLineInput,
  ZatcaVatCategory,
} from "./invoice-model";
import { NS } from "./namespaces";
import { type SignatureVerification, verifySignedInvoice } from "./signature";
import { round2 } from "./ubl-builder";
import { type ValidateOptions, type ZatcaIssueCode, validateZatcaInvoice } from "./validate";
import { type XmlElement, findAll, findDescendant, findFirst, parseXml, textAt } from "./xml";

// ---------------------------------------------------------------- types

export type ZatcaXmlInputError = "EMPTY" | "NOT_XML" | "NOT_INVOICE" | "PREFIXES_UNSUPPORTED";

export type ZatcaXmlField =
  | "PROFILE_ID"
  | "INVOICE_NUMBER"
  | "UUID"
  | "ISSUE_DATE"
  | "ISSUE_TIME"
  | "INVOICE_TYPE"
  | "CURRENCY"
  | "TAX_CURRENCY"
  | "ICV"
  | "PIH"
  | "SELLER_NAME"
  | "SELLER_VAT"
  | "SELLER_ID"
  | "SELLER_STREET"
  | "SELLER_BUILDING_NUMBER"
  | "SELLER_DISTRICT"
  | "SELLER_CITY"
  | "SELLER_POSTAL_CODE"
  | "SELLER_COUNTRY"
  | "VAT_TOTAL"
  | "LINE_EXTENSION_TOTAL"
  | "TAX_EXCLUSIVE_TOTAL"
  | "TAX_INCLUSIVE_TOTAL"
  | "PAYABLE_TOTAL"
  | "LINES";

export type ZatcaXmlRuleCode = ZatcaIssueCode | "INVOICE_TYPE_INVALID";

export interface ZatcaXmlRuleIssue {
  code: ZatcaXmlRuleCode;
  rule: string;
  path: string;
}

export type ZatcaTotalsCheckCode =
  | "LINE_NET"
  | "LINE_EXTENSION_SUM"
  | "TAX_EXCLUSIVE"
  | "SUBTOTAL_VAT"
  | "VAT_SUM"
  | "TAX_INCLUSIVE"
  | "PAYABLE";

export interface ZatcaTotalsCheck {
  check: ZatcaTotalsCheckCode;
  ok: boolean;
  expected: string;
  actual: string;
  rule?: string;
  /** 1-based line or subtotal position, for per-line / per-subtotal checks. */
  line?: number;
}

export type ZatcaQrMismatchField =
  | "SELLER_NAME"
  | "VAT_NUMBER"
  | "TIMESTAMP"
  | "TOTAL"
  | "VAT_TOTAL"
  | "INVOICE_HASH"
  | "SIGNATURE";

export interface ZatcaQrMismatch {
  field: ZatcaQrMismatchField;
  qr: string;
  document: string;
}

export type ZatcaSeverity = "error" | "warning" | "info";

export interface ZatcaQrReport {
  status: "missing" | "invalid" | "decoded";
  /** For missing: error on simplified, info on standard (ZATCA adds it at clearance). */
  severity?: ZatcaSeverity;
  error?: ZatcaQrDecodeError;
  phase?: 1 | 2;
  decoded?: DecodedZatcaQr;
  issues: ZatcaQrIssue[];
  mismatches: ZatcaQrMismatch[];
}

export interface ZatcaSignatureReport {
  status: "missing" | "verified" | "failed" | "error";
  severity?: ZatcaSeverity;
  checks?: Omit<SignatureVerification, "valid">;
}

export interface ZatcaXmlSummary {
  kind: ZatcaDocumentKind;
  subtype: "standard" | "simplified" | "unknown";
  typeCode: string;
  typeName: string;
  profileId: string;
  id: string;
  uuid: string;
  issueDate: string;
  issueTime: string;
  icv: string;
  currency: string;
  sellerName: string;
  sellerVat: string;
  buyerName: string;
  lineCount: number;
  total: string;
  vatTotal: string;
}

export interface ZatcaXmlReport {
  summary: ZatcaXmlSummary;
  missing: { field: ZatcaXmlField; path: string }[];
  rules: ZatcaXmlRuleIssue[];
  totals: ZatcaTotalsCheck[];
  qr: ZatcaQrReport;
  signature: ZatcaSignatureReport;
  /** Computed invoice hash (base64 SHA-256 of the C14N body), when computable. */
  invoiceHash?: string;
  errorCount: number;
  warningCount: number;
}

export type ZatcaXmlInspection = { ok: true; report: ZatcaXmlReport } | { ok: false; error: ZatcaXmlInputError };

// ---------------------------------------------------------------- helpers

const SUPPLIER = "cac:AccountingSupplierParty/cac:Party";
const CUSTOMER = "cac:AccountingCustomerParty/cac:Party";
const LMT = "cac:LegalMonetaryTotal";

const text = (el: XmlElement, path: string): string | undefined => {
  const v = textAt(el, path)?.trim();
  return v ? v : undefined;
};
const attr = (el: XmlElement | undefined, name: string) =>
  el?.attributes.find((a) => a.name === name)?.value;
const num = (v: string | undefined): number => (v === undefined || v.trim() === "" ? Number.NaN : Number(v));
const fmt = (n: number) => (Number.isFinite(n) ? round2(n).toFixed(2) : "—");
const sameMoney = (a: number, b: number) => Math.abs(round2(a) - round2(b)) < 0.001;

function docReference(root: XmlElement, id: string): XmlElement | undefined {
  return findAll(root, "cac:AdditionalDocumentReference").find((r) => textAt(r, "cbc:ID")?.trim() === id);
}

/** The cac:TaxTotal that carries the subtotals (KSA documents have two TaxTotals). */
function mainTaxTotal(root: XmlElement): XmlElement | undefined {
  const all = findAll(root, "cac:TaxTotal");
  return all.find((t) => findFirst(t, "cac:TaxSubtotal")) ?? all[0];
}

function parseAddress(party: XmlElement | undefined): Partial<ZatcaAddress> | undefined {
  const a = party && findFirst(party, "cac:PostalAddress");
  if (!a) return undefined;
  const out: Partial<ZatcaAddress> = {};
  const set = (key: keyof ZatcaAddress, path: string) => {
    const v = text(a, path);
    if (v !== undefined) out[key] = v;
  };
  set("street", "cbc:StreetName");
  set("additionalStreet", "cbc:AdditionalStreetName");
  set("buildingNumber", "cbc:BuildingNumber");
  set("plotIdentification", "cbc:PlotIdentification");
  set("district", "cbc:CitySubdivisionName");
  set("city", "cbc:CityName");
  set("postalCode", "cbc:PostalZone");
  set("countrySubentity", "cbc:CountrySubentity");
  set("country", "cac:Country/cbc:IdentificationCode");
  return out;
}

function partyId(party: XmlElement | undefined): { scheme: string; value: string } | undefined {
  const el = party && findFirst(party, "cac:PartyIdentification/cbc:ID");
  return el ? { scheme: attr(el, "schemeID") ?? "", value: textOf(el) } : undefined;
}

function textOf(el: XmlElement): string {
  return el.children.map((c) => (c.type === "text" ? c.value : c.type === "element" ? textOf(c) : "")).join("").trim();
}

// ---------------------------------------------------------------- parse

/** Best-effort mapping of a UBL invoice element tree onto the validator's input model. */
export function parseZatcaInvoiceXml(root: XmlElement): ZatcaInvoiceInput {
  const typeEl = findFirst(root, "cbc:InvoiceTypeCode");
  const typeCode = typeEl ? textOf(typeEl) : "";
  const typeName = attr(typeEl, "name") ?? "";
  const kind: ZatcaDocumentKind = typeCode === "381" ? "credit-note" : typeCode === "383" ? "debit-note" : "invoice";
  const bit = (i: number) => typeName[i] === "1";

  const supplier = findFirst(root, SUPPLIER);
  const customer = findFirst(root, CUSTOMER);
  const sellerId = partyId(supplier);

  let buyer: ZatcaBuyer | undefined;
  if (customer && customer.children.some((c) => c.type === "element")) {
    buyer = {};
    const name = text(customer, "cac:PartyLegalEntity/cbc:RegistrationName");
    const vat = text(customer, "cac:PartyTaxScheme/cbc:CompanyID");
    const id = partyId(customer);
    const address = parseAddress(customer);
    if (name) buyer.registrationName = name;
    if (vat) buyer.vatNumber = vat;
    if (id) buyer.otherId = { scheme: id.scheme as BuyerIdScheme, value: id.value };
    if (address) buyer.address = address;
  }

  const taxTotal = mainTaxTotal(root);
  const subtotals = taxTotal ? findAll(taxTotal, "cac:TaxSubtotal") : [];
  const exemptionFor = (category: string, rate: number) => {
    for (const s of subtotals) {
      const cat = findFirst(s, "cac:TaxCategory");
      if (cat && text(cat, "cbc:ID") === category && num(text(cat, "cbc:Percent")) === rate) {
        return text(cat, "cbc:TaxExemptionReasonCode");
      }
    }
    return undefined;
  };

  const lines: ZatcaLineInput[] = findAll(root, "cac:InvoiceLine").map((l) => {
    const qtyEl = findFirst(l, "cbc:InvoicedQuantity");
    const tax = findFirst(l, "cac:Item/cac:ClassifiedTaxCategory");
    const vatCategory = (tax && text(tax, "cbc:ID")) as ZatcaVatCategory;
    const vatRate = num(tax && text(tax, "cbc:Percent"));
    const netPrice = num(text(l, "cac:Price/cbc:PriceAmount"));
    const allowance = findAll(l, "cac:Price/cac:AllowanceCharge").find((a) => text(a, "cbc:ChargeIndicator") === "false");
    const discount = allowance ? num(text(allowance, "cbc:Amount")) : undefined;
    const line: ZatcaLineInput = {
      name: text(l, "cac:Item/cbc:Name") ?? "",
      quantity: num(qtyEl && textOf(qtyEl)),
      unitPrice: discount !== undefined ? Number((netPrice + discount).toFixed(6)) : netPrice,
      vatCategory,
      vatRate,
    };
    if (discount !== undefined) line.discountPerUnit = discount;
    const unitCode = attr(qtyEl, "unitCode");
    if (unitCode) line.unitCode = unitCode;
    const exemption = (tax && text(tax, "cbc:TaxExemptionReasonCode")) ?? (vatCategory !== "S" ? exemptionFor(vatCategory, vatRate) : undefined);
    if (exemption) line.exemptionReasonCode = exemption;
    return line;
  });

  const icvRef = docReference(root, "ICV");
  const icvValue = icvRef ? text(icvRef, "cbc:UUID") : undefined;
  const pihRef = docReference(root, "PIH");

  const input: ZatcaInvoiceInput = {
    kind,
    subtype: typeName.startsWith("01") ? "standard" : "simplified",
    flags: { thirdParty: bit(2), nominal: bit(3), exports: bit(4), summary: bit(5), selfBilled: bit(6) },
    id: text(root, "cbc:ID") ?? "",
    uuid: text(root, "cbc:UUID") ?? "",
    issueDate: text(root, "cbc:IssueDate") ?? "",
    issueTime: text(root, "cbc:IssueTime") ?? "",
    icv: icvValue && /^\d+$/.test(icvValue) ? Number(icvValue) : Number.NaN,
    pih: (pihRef && text(pihRef, "cac:Attachment/cbc:EmbeddedDocumentBinaryObject")) ?? "",
    seller: {
      registrationName: (supplier && text(supplier, "cac:PartyLegalEntity/cbc:RegistrationName")) ?? "",
      vatNumber: (supplier && text(supplier, "cac:PartyTaxScheme/cbc:CompanyID")) ?? "",
      otherId: (sellerId
        ? { scheme: sellerId.scheme as SellerIdScheme, value: sellerId.value }
        : undefined) as ZatcaInvoiceInput["seller"]["otherId"],
      address: (parseAddress(supplier) ?? {}) as ZatcaAddress,
    },
    lines,
  };
  if (buyer) input.buyer = buyer;
  const supplyDate = text(root, "cac:Delivery/cbc:ActualDeliveryDate");
  const supplyEndDate = text(root, "cac:Delivery/cbc:LatestDeliveryDate");
  if (supplyDate) input.supplyDate = supplyDate;
  if (supplyEndDate) input.supplyEndDate = supplyEndDate;
  const paymentMeans = text(root, "cac:PaymentMeans/cbc:PaymentMeansCode");
  if (paymentMeans) input.paymentMeansCode = paymentMeans as PaymentMeansCode;
  const billing = text(root, "cac:BillingReference/cac:InvoiceDocumentReference/cbc:ID");
  if (billing) input.billingReference = { invoiceId: billing };
  const reason = text(root, "cac:PaymentMeans/cbc:InstructionNote");
  if (reason) input.noteReason = reason;
  const note = text(root, "cbc:Note");
  if (note) input.note = note;
  return input;
}

// ---------------------------------------------------------------- mandatory elements

interface FieldSpec {
  field: ZatcaXmlField;
  path: string;
  /** Validator issue paths that would only repeat this finding. */
  covers: string[];
  present?: (root: XmlElement) => boolean;
}

const addressField = (field: ZatcaXmlField, el: string, key: keyof ZatcaAddress): FieldSpec => ({
  field,
  path: `${SUPPLIER}/cac:PostalAddress/${el}`,
  covers: [`seller.address.${key}`],
});

const FIELDS: FieldSpec[] = [
  { field: "PROFILE_ID", path: "cbc:ProfileID", covers: [] },
  { field: "INVOICE_NUMBER", path: "cbc:ID", covers: ["id"] },
  { field: "UUID", path: "cbc:UUID", covers: ["uuid"] },
  { field: "ISSUE_DATE", path: "cbc:IssueDate", covers: ["issueDate"] },
  { field: "ISSUE_TIME", path: "cbc:IssueTime", covers: ["issueTime"] },
  { field: "INVOICE_TYPE", path: "cbc:InvoiceTypeCode", covers: [] },
  { field: "CURRENCY", path: "cbc:DocumentCurrencyCode", covers: [] },
  { field: "TAX_CURRENCY", path: "cbc:TaxCurrencyCode", covers: [] },
  {
    field: "ICV",
    path: "cac:AdditionalDocumentReference[cbc:ID='ICV']/cbc:UUID",
    covers: ["icv"],
    present: (root) => !!docReference(root, "ICV") && !!text(docReference(root, "ICV")!, "cbc:UUID"),
  },
  {
    field: "PIH",
    path: "cac:AdditionalDocumentReference[cbc:ID='PIH']/cac:Attachment/cbc:EmbeddedDocumentBinaryObject",
    covers: ["pih"],
    present: (root) =>
      !!docReference(root, "PIH") && !!text(docReference(root, "PIH")!, "cac:Attachment/cbc:EmbeddedDocumentBinaryObject"),
  },
  { field: "SELLER_NAME", path: `${SUPPLIER}/cac:PartyLegalEntity/cbc:RegistrationName`, covers: ["seller.registrationName"] },
  { field: "SELLER_VAT", path: `${SUPPLIER}/cac:PartyTaxScheme/cbc:CompanyID`, covers: ["seller.vatNumber"] },
  {
    field: "SELLER_ID",
    path: `${SUPPLIER}/cac:PartyIdentification/cbc:ID`,
    covers: ["seller.otherId.value", "seller.otherId.scheme"],
  },
  addressField("SELLER_STREET", "cbc:StreetName", "street"),
  addressField("SELLER_BUILDING_NUMBER", "cbc:BuildingNumber", "buildingNumber"),
  addressField("SELLER_DISTRICT", "cbc:CitySubdivisionName", "district"),
  addressField("SELLER_CITY", "cbc:CityName", "city"),
  addressField("SELLER_POSTAL_CODE", "cbc:PostalZone", "postalCode"),
  addressField("SELLER_COUNTRY", "cac:Country/cbc:IdentificationCode", "country"),
  { field: "VAT_TOTAL", path: "cac:TaxTotal/cbc:TaxAmount", covers: [] },
  { field: "LINE_EXTENSION_TOTAL", path: `${LMT}/cbc:LineExtensionAmount`, covers: [] },
  { field: "TAX_EXCLUSIVE_TOTAL", path: `${LMT}/cbc:TaxExclusiveAmount`, covers: [] },
  { field: "TAX_INCLUSIVE_TOTAL", path: `${LMT}/cbc:TaxInclusiveAmount`, covers: [] },
  { field: "PAYABLE_TOTAL", path: `${LMT}/cbc:PayableAmount`, covers: [] },
  { field: "LINES", path: "cac:InvoiceLine", covers: ["lines"], present: (root) => !!findFirst(root, "cac:InvoiceLine") },
];

// ---------------------------------------------------------------- totals

function checkTotals(root: XmlElement): ZatcaTotalsCheck[] {
  const out: ZatcaTotalsCheck[] = [];
  const add = (check: ZatcaTotalsCheckCode, expected: number, actual: number, extra: Partial<ZatcaTotalsCheck> = {}) => {
    if (!Number.isFinite(expected) || !Number.isFinite(actual)) return;
    out.push({ check, ok: sameMoney(expected, actual), expected: fmt(expected), actual: fmt(actual), ...extra });
  };
  const lmt = (el: string) => num(text(root, `${LMT}/${el}`));
  const zeroIfMissing = (el: string) => (text(root, `${LMT}/${el}`) === undefined ? 0 : lmt(el));

  const lines = findAll(root, "cac:InvoiceLine");
  let lineSum = 0;
  lines.forEach((l, i) => {
    const qty = num(text(l, "cbc:InvoicedQuantity"));
    const price = num(text(l, "cac:Price/cbc:PriceAmount"));
    const baseQty = text(l, "cac:Price/cbc:BaseQuantity");
    const perUnit = baseQty ? price / num(baseQty) : price;
    let adjust = 0;
    for (const ac of findAll(l, "cac:AllowanceCharge")) {
      const amount = num(text(ac, "cbc:Amount"));
      adjust += text(ac, "cbc:ChargeIndicator") === "true" ? amount : -amount;
    }
    const net = num(text(l, "cbc:LineExtensionAmount"));
    lineSum += net;
    add("LINE_NET", round2(qty * perUnit) + adjust, net, { line: i + 1 });
  });
  if (lines.length) add("LINE_EXTENSION_SUM", lineSum, lmt("cbc:LineExtensionAmount"), { rule: "BR-CO-10" });

  add(
    "TAX_EXCLUSIVE",
    lmt("cbc:LineExtensionAmount") - zeroIfMissing("cbc:AllowanceTotalAmount") + zeroIfMissing("cbc:ChargeTotalAmount"),
    lmt("cbc:TaxExclusiveAmount"),
    { rule: "BR-CO-13" },
  );

  const taxTotal = mainTaxTotal(root);
  const vatTotal = num(taxTotal && text(taxTotal, "cbc:TaxAmount"));
  const subtotals = taxTotal ? findAll(taxTotal, "cac:TaxSubtotal") : [];
  let subtotalSum = 0;
  subtotals.forEach((s, i) => {
    const taxable = num(text(s, "cbc:TaxableAmount"));
    const vat = num(text(s, "cbc:TaxAmount"));
    const rate = num(text(s, "cac:TaxCategory/cbc:Percent"));
    subtotalSum += vat;
    add("SUBTOTAL_VAT", round2((taxable * rate) / 100), vat, { line: i + 1 });
  });
  if (subtotals.length) add("VAT_SUM", subtotalSum, vatTotal, { rule: "BR-CO-14" });

  add("TAX_INCLUSIVE", lmt("cbc:TaxExclusiveAmount") + vatTotal, lmt("cbc:TaxInclusiveAmount"), { rule: "BR-CO-15" });
  add(
    "PAYABLE",
    lmt("cbc:TaxInclusiveAmount") - zeroIfMissing("cbc:PrepaidAmount") + zeroIfMissing("cbc:PayableRoundingAmount"),
    lmt("cbc:PayableAmount"),
    { rule: "BR-CO-16" },
  );
  return out;
}

// ---------------------------------------------------------------- QR

function inspectQr(
  root: XmlElement,
  summary: ZatcaXmlSummary,
  invoiceHash: string | undefined,
  signatureValue: string | undefined,
  missingSeverity: ZatcaSeverity,
): ZatcaQrReport {
  const ref = docReference(root, "QR");
  const payload = ref && text(ref, "cac:Attachment/cbc:EmbeddedDocumentBinaryObject");
  if (!payload) return { status: "missing", severity: missingSeverity, issues: [], mismatches: [] };
  const decoded = decodeZatcaQrPayload(payload);
  if (!decoded.ok) return { status: "invalid", severity: "error", error: decoded.error, issues: [], mismatches: [] };

  const qr = decoded.qr;
  const mismatches: ZatcaQrMismatch[] = [];
  const cmp = (field: ZatcaQrMismatchField, qrValue: string | undefined, docValue: string | undefined, same?: boolean) => {
    if (qrValue === undefined || qrValue === "") return;
    const equal = same ?? qrValue === (docValue ?? "");
    if (!equal) mismatches.push({ field, qr: qrValue, document: docValue ?? "" });
  };
  const sameNumber = (a: string, b: string) => b !== "" && Number.isFinite(Number(a)) && sameMoney(Number(a), Number(b));

  cmp("SELLER_NAME", qr.sellerName, summary.sellerName);
  cmp("VAT_NUMBER", qr.vatNumber, summary.sellerVat);
  const docStamp = `${summary.issueDate}T${summary.issueTime}`;
  cmp("TIMESTAMP", qr.timestamp, docStamp, qr.timestamp.replace(/Z$/, "") === docStamp);
  cmp("TOTAL", qr.total, summary.total, sameNumber(qr.total, summary.total));
  cmp("VAT_TOTAL", qr.vatTotal, summary.vatTotal, sameNumber(qr.vatTotal, summary.vatTotal));
  if (invoiceHash) cmp("INVOICE_HASH", qr.invoiceHash, invoiceHash);
  if (signatureValue) cmp("SIGNATURE", qr.signature, signatureValue);

  return { status: "decoded", phase: qr.phase, decoded: qr, issues: qr.issues, mismatches };
}

// ---------------------------------------------------------------- entry point

function declaresUblPrefixes(root: XmlElement): boolean {
  const ns = (prefix: string) => attr(root, `xmlns:${prefix}`);
  return ns("cbc") === NS.cbc && ns("cac") === NS.cac;
}

export function inspectZatcaInvoiceXml(xml: string, options: ValidateOptions = {}): ZatcaXmlInspection {
  if (!xml.trim()) return { ok: false, error: "EMPTY" };
  let root: XmlElement;
  try {
    root = parseXml(xml).root;
  } catch {
    return { ok: false, error: "NOT_XML" };
  }
  const local = root.name.slice(root.name.indexOf(":") + 1);
  if (local !== "Invoice") return { ok: false, error: "NOT_INVOICE" };
  if (!declaresUblPrefixes(root)) return { ok: false, error: "PREFIXES_UNSUPPORTED" };

  const input = parseZatcaInvoiceXml(root);
  const typeEl = findFirst(root, "cbc:InvoiceTypeCode");
  const typeName = attr(typeEl, "name") ?? "";
  const typeCode = typeEl ? textOf(typeEl) : "";
  const subtype = /^01/.test(typeName) ? "standard" : /^02/.test(typeName) ? "simplified" : "unknown";
  const taxTotal = mainTaxTotal(root);

  const summary: ZatcaXmlSummary = {
    kind: input.kind,
    subtype,
    typeCode,
    typeName,
    profileId: text(root, "cbc:ProfileID") ?? "",
    id: input.id,
    uuid: input.uuid,
    issueDate: input.issueDate,
    issueTime: input.issueTime,
    icv: (docReference(root, "ICV") && text(docReference(root, "ICV")!, "cbc:UUID")) ?? "",
    currency: text(root, "cbc:DocumentCurrencyCode") ?? "",
    sellerName: input.seller.registrationName,
    sellerVat: input.seller.vatNumber,
    buyerName: input.buyer?.registrationName ?? "",
    lineCount: input.lines.length,
    total: text(root, `${LMT}/cbc:TaxInclusiveAmount`) ?? "",
    vatTotal: (taxTotal && text(taxTotal, "cbc:TaxAmount")) ?? "",
  };

  // ---- mandatory elements
  const missing: ZatcaXmlReport["missing"] = [];
  const covered = new Set<string>();
  for (const spec of FIELDS) {
    const present = spec.present ? spec.present(root) : text(root, spec.path) !== undefined;
    if (!present) {
      missing.push({ field: spec.field, path: spec.path });
      spec.covers.forEach((p) => covered.add(p));
    }
  }

  // ---- business rules (shared validator), minus repeats of missing elements
  const rules: ZatcaXmlRuleIssue[] = [];
  if (typeEl && (!/^(388|381|383)$/.test(typeCode) || !/^0[12][01]{5}$/.test(typeName))) {
    rules.push({ code: "INVOICE_TYPE_INVALID", rule: "KSA-2 / BT-3", path: "cbc:InvoiceTypeCode" });
  }
  for (const issue of validateZatcaInvoice(input, options).issues) {
    if (!covered.has(issue.path)) rules.push(issue);
  }

  // ---- totals
  const totals = checkTotals(root);

  // ---- hash, stamp, QR
  let invoiceHash: string | undefined;
  try {
    invoiceHash = computeInvoiceHash(xml);
  } catch {
    invoiceHash = undefined;
  }
  const missingSeverity: ZatcaSeverity = subtype === "standard" ? "info" : subtype === "simplified" ? "error" : "warning";
  const sigEl = findDescendant(root, "ds:Signature");
  let signature: ZatcaSignatureReport;
  if (!sigEl) signature = { status: "missing", severity: missingSeverity };
  else {
    try {
      const { valid, ...checks } = verifySignedInvoice(xml);
      signature = { status: valid ? "verified" : "failed", severity: valid ? undefined : "error", checks };
    } catch {
      signature = { status: "error", severity: "error" };
    }
  }
  const signatureValue = sigEl ? text(sigEl, "ds:SignatureValue") : undefined;
  const qr = inspectQr(root, summary, invoiceHash, signatureValue, missingSeverity);

  // ---- counts
  const sev = (s: ZatcaSeverity | undefined, want: ZatcaSeverity) => (s === want ? 1 : 0);
  const qrErrors =
    qr.status === "decoded"
      ? qr.issues.filter((i) => i.severity === "error").length + qr.mismatches.length
      : sev(qr.severity, "error");
  const qrWarnings =
    qr.status === "decoded" ? qr.issues.filter((i) => i.severity === "warning").length : sev(qr.severity, "warning");
  const errorCount =
    missing.length + rules.length + totals.filter((t) => !t.ok).length + qrErrors + sev(signature.severity, "error");
  const warningCount = qrWarnings + sev(signature.severity, "warning");

  return {
    ok: true,
    report: { summary, missing, rules, totals, qr, signature, invoiceHash, errorCount, warningCount },
  };
}

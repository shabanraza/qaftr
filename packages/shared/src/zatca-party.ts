/**
 * Seller (business) and buyer (client) profile checks for ZATCA Phase 2.
 *
 * Two levels:
 * - check*Format: only fields that are filled in must be well formed. Used
 *   when saving, so a profile can be completed step by step.
 * - *Readiness: format plus everything ZATCA requires before a document can be
 *   signed (seller: BR-KSA-08/09/37/39/66; buyer on a standard B2B invoice:
 *   BR-KSA-42/63/81).
 *
 * Numeric fields accept Arabic-Indic digits, spaces and dashes.
 */
import { normalizeCrNumber } from "./sa-documents";
import { BUYER_ID_SCHEMES } from "./zatca-phase2/invoice-model";
import { SAUDI_VAT_RE } from "./zatca-phase2/validate";

export interface PartyProfileInput {
  name?: string | null;
  vatNumber?: string | null;
  /** Seller only: commercial registration (10 digits). */
  crNumber?: string | null;
  /** Buyer only: ISO 3166-1 alpha-2, defaults to SA. */
  country?: string | null;
  /** Buyer only: other ID scheme when there is no VAT number. */
  idScheme?: string | null;
  idValue?: string | null;
  street?: string | null;
  buildingNumber?: string | null;
  additionalNumber?: string | null;
  district?: string | null;
  city?: string | null;
  postalCode?: string | null;
}

export type PartyField = keyof PartyProfileInput;

export type PartyIssueCode =
  | "REQUIRED"
  | "VAT_OR_ID_REQUIRED"
  | "INVALID_VAT"
  | "INVALID_CR"
  | "INVALID_BUILDING"
  | "INVALID_ADDITIONAL"
  | "INVALID_POSTAL"
  | "INVALID_SCHEME"
  | "INVALID_COUNTRY";

export interface PartyIssue {
  field: PartyField;
  code: PartyIssueCode;
}

export interface PartyReadiness {
  ready: boolean;
  issues: PartyIssue[];
}

/** Buyer ID schemes offered in forms. TIN is the VAT number itself. */
export const BUYER_OTHER_ID_SCHEMES = BUYER_ID_SCHEMES.filter((s) => s !== "TIN");

const NUMERIC: PartyField[] = ["vatNumber", "crNumber", "buildingNumber", "additionalNumber", "postalCode"];
const UPPER: PartyField[] = ["country", "idScheme"];
const ADDRESS_REQUIRED: PartyField[] = ["street", "buildingNumber", "district", "city", "postalCode"];

/** Trim every field, convert digits in numeric fields, upper-case codes; "" becomes undefined. */
export function normalizePartyInput<T extends PartyProfileInput>(input: T): { [K in keyof T]: string | undefined } {
  const out: Record<string, string | undefined> = {};
  for (const [key, raw] of Object.entries(input)) {
    if (raw === undefined || raw === null) {
      out[key] = undefined;
      continue;
    }
    let v = String(raw).trim();
    if (NUMERIC.includes(key as PartyField)) v = normalizeCrNumber(v);
    if (UPPER.includes(key as PartyField)) v = v.toUpperCase();
    out[key] = v === "" ? undefined : v;
  }
  return out as { [K in keyof T]: string | undefined };
}

function addressFormat(p: PartyProfileInput, issues: PartyIssue[]): void {
  if (p.buildingNumber && !/^\d{4}$/.test(p.buildingNumber)) issues.push({ field: "buildingNumber", code: "INVALID_BUILDING" });
  if (p.additionalNumber && !/^\d{4}$/.test(p.additionalNumber)) {
    issues.push({ field: "additionalNumber", code: "INVALID_ADDITIONAL" });
  }
  if (p.postalCode && !/^\d{5}$/.test(p.postalCode)) issues.push({ field: "postalCode", code: "INVALID_POSTAL" });
}

function missing(p: PartyProfileInput, fields: PartyField[], issues: PartyIssue[]): void {
  for (const field of fields) {
    if (!p[field] && !issues.some((i) => i.field === field)) issues.push({ field, code: "REQUIRED" });
  }
}

const sortByForm = (order: PartyField[]) => (a: PartyIssue, b: PartyIssue) =>
  order.indexOf(a.field) - order.indexOf(b.field);

const SELLER_ORDER: PartyField[] = [
  "name",
  "vatNumber",
  "crNumber",
  "street",
  "buildingNumber",
  "additionalNumber",
  "district",
  "city",
  "postalCode",
];

export function checkSellerFormat(input: PartyProfileInput): PartyIssue[] {
  const p = normalizePartyInput(input);
  const issues: PartyIssue[] = [];
  if (p.vatNumber && !SAUDI_VAT_RE.test(p.vatNumber)) issues.push({ field: "vatNumber", code: "INVALID_VAT" });
  if (p.crNumber && !/^\d{10}$/.test(p.crNumber)) issues.push({ field: "crNumber", code: "INVALID_CR" });
  addressFormat(p, issues);
  return issues.sort(sortByForm(SELLER_ORDER));
}

export function sellerZatcaReadiness(input: PartyProfileInput): PartyReadiness {
  const p = normalizePartyInput(input);
  const issues = checkSellerFormat(p);
  missing(p, ["name", "vatNumber", "crNumber", ...ADDRESS_REQUIRED], issues);
  issues.sort(sortByForm(SELLER_ORDER));
  return { ready: issues.length === 0, issues };
}

const BUYER_ORDER: PartyField[] = [
  "name",
  "country",
  "vatNumber",
  "idScheme",
  "idValue",
  "street",
  "buildingNumber",
  "additionalNumber",
  "district",
  "city",
  "postalCode",
];

export function checkBuyerFormat(input: PartyProfileInput): PartyIssue[] {
  const p = normalizePartyInput(input);
  const issues: PartyIssue[] = [];
  const country = p.country ?? "SA";
  if (p.country && !/^[A-Z]{2}$/.test(p.country)) issues.push({ field: "country", code: "INVALID_COUNTRY" });
  if (p.vatNumber && country === "SA" && !SAUDI_VAT_RE.test(p.vatNumber)) {
    issues.push({ field: "vatNumber", code: "INVALID_VAT" });
  }
  if (p.idScheme && !(BUYER_OTHER_ID_SCHEMES as readonly string[]).includes(p.idScheme)) {
    issues.push({ field: "idScheme", code: "INVALID_SCHEME" });
  }
  if (p.idScheme && !p.idValue) issues.push({ field: "idValue", code: "REQUIRED" });
  if (country === "SA") addressFormat(p, issues);
  return issues.sort(sortByForm(BUYER_ORDER));
}

/** What a client needs before they can receive a standard (B2B) tax invoice. */
export function buyerStandardReadiness(input: PartyProfileInput): PartyReadiness {
  const p = normalizePartyInput(input);
  const issues = checkBuyerFormat(p);
  missing(p, ["name"], issues);
  if (!p.vatNumber && !(p.idScheme && p.idValue)) issues.push({ field: "vatNumber", code: "VAT_OR_ID_REQUIRED" });
  if ((p.country ?? "SA") === "SA") missing(p, ADDRESS_REQUIRED, issues);
  issues.sort(sortByForm(BUYER_ORDER));
  return { ready: issues.length === 0, issues };
}

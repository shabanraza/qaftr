/**
 * Static (pre-submission) validation of ZATCA invoice input. Implements the
 * BR-KSA / EN16931 rules that can be checked without ZATCA state. Issue
 * `code`s are stable keys for i18n; `rule` is the ZATCA rule id for support.
 * Rules that need server state (ICV continuity across invoices, PIH chain
 * match, certificate validity) are left to the caller / ZATCA.
 */

import { fromBase64 } from "./bytes";
import { FIRST_INVOICE_PIH } from "./hash";
import {
  BUYER_ID_SCHEMES,
  EXEMPTION_REASONS,
  PAYMENT_MEANS_CODES,
  SELLER_ID_SCHEMES,
  type ZatcaAddress,
  type ZatcaInvoiceInput,
} from "./invoice-model";

export type ZatcaIssueCode =
  | "UUID_INVALID"
  | "INVOICE_NUMBER_REQUIRED"
  | "ISSUE_DATE_INVALID"
  | "ISSUE_DATE_IN_FUTURE"
  | "ISSUE_TIME_INVALID"
  | "ICV_INVALID"
  | "PIH_INVALID"
  | "SELLER_NAME_REQUIRED"
  | "SELLER_VAT_INVALID"
  | "SELLER_ID_REQUIRED"
  | "SELLER_ID_SCHEME_INVALID"
  | "SELLER_COUNTRY_INVALID"
  | "ADDRESS_STREET_REQUIRED"
  | "ADDRESS_BUILDING_NUMBER_INVALID"
  | "ADDRESS_DISTRICT_REQUIRED"
  | "ADDRESS_CITY_REQUIRED"
  | "ADDRESS_POSTAL_CODE_INVALID"
  | "ADDRESS_COUNTRY_INVALID"
  | "BUYER_REQUIRED"
  | "BUYER_NAME_REQUIRED"
  | "BUYER_ID_REQUIRED"
  | "BUYER_ID_SCHEME_INVALID"
  | "BUYER_VAT_INVALID"
  | "BUYER_NATIONAL_ID_REQUIRED"
  | "SUPPLY_DATE_REQUIRED"
  | "SUPPLY_DATE_INVALID"
  | "SUPPLY_END_DATE_BEFORE_START"
  | "BILLING_REFERENCE_REQUIRED"
  | "NOTE_REASON_REQUIRED"
  | "PAYMENT_MEANS_INVALID"
  | "LINES_REQUIRED"
  | "LINE_NAME_REQUIRED"
  | "LINE_QUANTITY_INVALID"
  | "LINE_PRICE_INVALID"
  | "LINE_DISCOUNT_INVALID"
  | "LINE_VAT_RATE_INVALID"
  | "LINE_EXEMPTION_REASON_REQUIRED"
  | "LINE_EXEMPTION_REASON_INVALID"
  | "LINE_EXEMPTION_REASON_NOT_ALLOWED";

export interface ZatcaValidationIssue {
  code: ZatcaIssueCode;
  rule: string;
  path: string;
}

export interface ZatcaValidationResult {
  ok: boolean;
  issues: ZatcaValidationIssue[];
}

export interface ValidateOptions {
  /** Clock for BR-KSA-04 (issue date must not be in the future). */
  now?: Date;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
export const SAUDI_VAT_RE = /^3\d{13}3$/;

const blank = (s: string | undefined) => !s || s.trim() === "";

function isValidDate(s: string | undefined): s is string {
  if (!s || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Calendar day in Asia/Riyadh (UTC+3, no DST). */
function riyadhToday(now: Date): string {
  return new Date(now.getTime() + 3 * 3600_000).toISOString().slice(0, 10);
}

function isValidPih(pih: string): boolean {
  if (pih === FIRST_INVOICE_PIH) return true;
  if (!/^[A-Za-z0-9+/]{43}=$/.test(pih)) return false;
  try {
    return fromBase64(pih).length === 32;
  } catch {
    return false;
  }
}

function validateAddress(
  address: Partial<ZatcaAddress> | undefined,
  path: string,
  issues: ZatcaValidationIssue[],
): void {
  const a = address ?? {};
  const push = (code: ZatcaIssueCode, rule: string, field: string) =>
    issues.push({ code, rule, path: `${path}.${field}` });
  if (blank(a.street)) push("ADDRESS_STREET_REQUIRED", "BR-KSA-09", "street");
  if (!a.buildingNumber || !/^\d{4}$/.test(a.buildingNumber)) {
    push("ADDRESS_BUILDING_NUMBER_INVALID", "BR-KSA-37", "buildingNumber");
  }
  if (blank(a.district)) push("ADDRESS_DISTRICT_REQUIRED", "BR-KSA-09", "district");
  if (blank(a.city)) push("ADDRESS_CITY_REQUIRED", "BR-KSA-09", "city");
  if (!a.postalCode || !/^\d{5}$/.test(a.postalCode)) {
    push("ADDRESS_POSTAL_CODE_INVALID", "BR-KSA-66", "postalCode");
  }
  if (!a.country || !/^[A-Z]{2}$/.test(a.country)) push("ADDRESS_COUNTRY_INVALID", "BR-KSA-09", "country");
}

export function validateZatcaInvoice(
  input: ZatcaInvoiceInput,
  options: ValidateOptions = {},
): ZatcaValidationResult {
  const issues: ZatcaValidationIssue[] = [];
  const push = (code: ZatcaIssueCode, rule: string, path: string) => issues.push({ code, rule, path });
  const isStandard = input.subtype === "standard";
  const isNote = input.kind === "credit-note" || input.kind === "debit-note";

  // ---- header
  if (!UUID_RE.test(input.uuid)) push("UUID_INVALID", "BR-KSA-03", "uuid");
  if (blank(input.id)) push("INVOICE_NUMBER_REQUIRED", "BR-02", "id");
  if (!isValidDate(input.issueDate)) push("ISSUE_DATE_INVALID", "BR-03", "issueDate");
  else if (input.issueDate > riyadhToday(options.now ?? new Date())) {
    push("ISSUE_DATE_IN_FUTURE", "BR-KSA-04", "issueDate");
  }
  if (!TIME_RE.test(input.issueTime)) push("ISSUE_TIME_INVALID", "BR-KSA-70", "issueTime");
  if (!Number.isSafeInteger(input.icv) || input.icv < 1) push("ICV_INVALID", "BR-KSA-33", "icv");
  if (!isValidPih(input.pih)) push("PIH_INVALID", "BR-KSA-61", "pih");

  // ---- seller
  const s = input.seller;
  if (blank(s.registrationName)) push("SELLER_NAME_REQUIRED", "BR-06", "seller.registrationName");
  if (!SAUDI_VAT_RE.test(s.vatNumber)) push("SELLER_VAT_INVALID", "BR-KSA-39", "seller.vatNumber");
  if (!s.otherId || blank(s.otherId.value)) push("SELLER_ID_REQUIRED", "BR-KSA-08", "seller.otherId.value");
  if (s.otherId && !(SELLER_ID_SCHEMES as readonly string[]).includes(s.otherId.scheme)) {
    push("SELLER_ID_SCHEME_INVALID", "BR-KSA-08", "seller.otherId.scheme");
  }
  validateAddress(s.address, "seller.address", issues);
  if (s.address?.country && s.address.country !== "SA") {
    push("SELLER_COUNTRY_INVALID", "BR-KSA-09", "seller.address.country");
  }

  // ---- buyer
  const b = input.buyer;
  if (b?.vatNumber && (b.address?.country ?? "SA") === "SA" && !SAUDI_VAT_RE.test(b.vatNumber)) {
    push("BUYER_VAT_INVALID", "BR-KSA-44", "buyer.vatNumber");
  }
  if (b?.otherId && !(BUYER_ID_SCHEMES as readonly string[]).includes(b.otherId.scheme)) {
    push("BUYER_ID_SCHEME_INVALID", "BR-KSA-14", "buyer.otherId.scheme");
  }
  if (isStandard) {
    if (!b) push("BUYER_REQUIRED", "BR-KSA-42", "buyer");
    else {
      if (blank(b.registrationName)) push("BUYER_NAME_REQUIRED", "BR-KSA-42", "buyer.registrationName");
      if (blank(b.vatNumber) && (!b.otherId || blank(b.otherId.value))) {
        push("BUYER_ID_REQUIRED", "BR-KSA-81", "buyer.otherId");
      }
      // Saudi buyer address is mandatory in full on standard invoices (BR-KSA-63).
      if ((b.address?.country ?? "SA") === "SA") validateAddress(b.address, "buyer.address", issues);
    }
  }

  // ---- dates & notes
  if (input.supplyDate !== undefined && !isValidDate(input.supplyDate)) {
    push("SUPPLY_DATE_INVALID", "BR-KSA-15", "supplyDate");
  } else if (isStandard && input.kind === "invoice" && !input.supplyDate) {
    push("SUPPLY_DATE_REQUIRED", "BR-KSA-15", "supplyDate");
  }
  if (input.supplyEndDate !== undefined) {
    if (!isValidDate(input.supplyEndDate)) push("SUPPLY_DATE_INVALID", "BR-KSA-35", "supplyEndDate");
    else if (input.supplyDate && input.supplyEndDate < input.supplyDate) {
      push("SUPPLY_END_DATE_BEFORE_START", "BR-KSA-36", "supplyEndDate");
    }
  }
  if (isNote) {
    if (blank(input.billingReference?.invoiceId)) {
      push("BILLING_REFERENCE_REQUIRED", "BR-KSA-56", "billingReference.invoiceId");
    }
    if (blank(input.noteReason)) push("NOTE_REASON_REQUIRED", "BR-KSA-17", "noteReason");
  }
  if (input.paymentMeansCode && !(PAYMENT_MEANS_CODES as readonly string[]).includes(input.paymentMeansCode)) {
    push("PAYMENT_MEANS_INVALID", "BR-KSA-16", "paymentMeansCode");
  }

  // ---- lines
  if (!input.lines || input.lines.length === 0) push("LINES_REQUIRED", "BR-16", "lines");
  let needsNationalId = false;
  (input.lines ?? []).forEach((line, i) => {
    const p = (f: string) => `lines[${i}].${f}`;
    if (blank(line.name)) push("LINE_NAME_REQUIRED", "BR-25", p("name"));
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) push("LINE_QUANTITY_INVALID", "BR-KSA-F-04", p("quantity"));
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) push("LINE_PRICE_INVALID", "BR-27", p("unitPrice"));
    if (
      line.discountPerUnit !== undefined &&
      (!Number.isFinite(line.discountPerUnit) || line.discountPerUnit < 0 || line.discountPerUnit > line.unitPrice)
    ) {
      push("LINE_DISCOUNT_INVALID", "BR-KSA-DEC-01", p("discountPerUnit"));
    }
    if (line.vatCategory === "S") {
      if (line.vatRate !== 15 && line.vatRate !== 5) push("LINE_VAT_RATE_INVALID", "BR-KSA-CL-04", p("vatRate"));
      if (line.exemptionReasonCode) {
        push("LINE_EXEMPTION_REASON_NOT_ALLOWED", "BR-KSA-CL-04", p("exemptionReasonCode"));
      }
    } else {
      if (line.vatRate !== 0) push("LINE_VAT_RATE_INVALID", "BR-KSA-CL-04", p("vatRate"));
      const allowed = EXEMPTION_REASONS[line.vatCategory];
      if (!line.exemptionReasonCode) {
        push("LINE_EXEMPTION_REASON_REQUIRED", "BR-KSA-69", p("exemptionReasonCode"));
      } else if (!allowed || !(line.exemptionReasonCode in allowed)) {
        push("LINE_EXEMPTION_REASON_INVALID", "BR-KSA-CL-04", p("exemptionReasonCode"));
      }
      if (line.exemptionReasonCode === "VATEX-SA-EDU" || line.exemptionReasonCode === "VATEX-SA-HEA") {
        needsNationalId = true;
      }
    }
  });
  if (needsNationalId && (b?.otherId?.scheme !== "NAT" || blank(b.otherId.value))) {
    push("BUYER_NATIONAL_ID_REQUIRED", "BR-KSA-49", "buyer.otherId");
  }

  return { ok: issues.length === 0, issues };
}

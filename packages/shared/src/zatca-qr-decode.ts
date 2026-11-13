/**
 * Decodes and checks the QR payload printed on Saudi e-invoices (ZATCA).
 *
 * The payload is base64 of TLV entries: 1-byte tag, 1-byte length, value.
 *   Phase 1 (Generation): 1 seller name, 2 VAT number, 3 timestamp,
 *     4 invoice total incl. VAT, 5 VAT total.
 *   Phase 2 (Integration) adds: 6 invoice hash, 7 ECDSA signature,
 *     8 ECDSA public key, 9 ZATCA CA signature of the certificate
 *     (simplified invoices).
 *
 * This checks structure and field formats only. It cannot verify the Phase 2
 * signature (that needs the signed XML) or whether ZATCA received the invoice.
 * Dependency-free so it runs in the browser, Workers and React Native.
 */
import { validateSaudiVatNumber } from "./trn-analyzer";

export type ZatcaQrDecodeError = "EMPTY" | "IS_URL" | "NOT_BASE64" | "TLV_TRUNCATED" | "NOT_ZATCA";

export type ZatcaQrIssueCode =
  | "SELLER_NAME_MISSING"
  | "VAT_NUMBER_MISSING"
  | "VAT_NUMBER_INVALID"
  | "TIMESTAMP_MISSING"
  | "TIMESTAMP_DATE_ONLY"
  | "TIMESTAMP_INVALID"
  | "TOTAL_MISSING"
  | "TOTAL_INVALID"
  | "VAT_TOTAL_MISSING"
  | "VAT_TOTAL_INVALID"
  | "VAT_EXCEEDS_TOTAL"
  | "VAT_NOT_15"
  | "TEXT_NOT_UTF8"
  | "PHASE2_INCOMPLETE";

export interface ZatcaQrIssue {
  code: ZatcaQrIssueCode;
  severity: "error" | "warning";
}

export interface DecodedZatcaQr {
  phase: 1 | 2;
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  total: string;
  vatTotal: string;
  invoiceHash?: string;
  signature?: string;
  /** Size of tag 8 (DER public key), when present. */
  publicKeyBytes?: number;
  /** Size of tag 9 (certificate signature), when present. */
  certificateSignatureBytes?: number;
  /** Tags found, ascending. */
  tags: number[];
  issues: ZatcaQrIssue[];
}

export type ZatcaQrDecodeResult =
  | { ok: true; qr: DecodedZatcaQr }
  | { ok: false; error: ZatcaQrDecodeError };

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(input: string): Uint8Array | null {
  const s = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  if (!s || !/^[A-Za-z0-9+/]+$/.test(s) || s.length % 4 === 1) return null;
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of s) {
    buffer = (buffer << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

const utf8 = new TextDecoder("utf-8", { fatal: true });

const DECIMAL = /^\d+(\.\d{1,2})?$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

export function decodeZatcaQrPayload(input: string): ZatcaQrDecodeResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "EMPTY" };
  if (/^(https?:\/\/|www\.)/i.test(trimmed)) return { ok: false, error: "IS_URL" };
  const bytes = base64ToBytes(trimmed);
  if (!bytes || bytes.length === 0) return { ok: false, error: "NOT_BASE64" };

  // A ZATCA payload starts with a known tag; anything else is some other QR.
  const first = bytes[0] as number;
  if (first < 1 || first > 9) return { ok: false, error: "NOT_ZATCA" };

  const raw = new Map<number, Uint8Array>();
  let i = 0;
  while (i < bytes.length) {
    const tag = bytes[i] as number;
    const len = bytes[i + 1];
    if (len === undefined || i + 2 + len > bytes.length) return { ok: false, error: "TLV_TRUNCATED" };
    raw.set(tag, bytes.slice(i + 2, i + 2 + len));
    i += 2 + len;
  }
  if (![1, 2, 3, 4, 5].some((t) => raw.has(t))) return { ok: false, error: "NOT_ZATCA" };

  const issues: ZatcaQrIssue[] = [];
  const error = (code: ZatcaQrIssueCode) => issues.push({ code, severity: "error" });
  let badText = false;
  const text = (tag: number): string => {
    const v = raw.get(tag);
    if (!v) return "";
    try {
      return utf8.decode(v);
    } catch {
      badText = true;
      return "";
    }
  };

  const sellerName = text(1);
  const vatNumber = text(2);
  const timestamp = text(3);
  const total = text(4);
  const vatTotal = text(5);
  const invoiceHash = raw.has(6) ? text(6) : undefined;
  const signature = raw.has(7) ? text(7) : undefined;

  if (!raw.has(1) || !sellerName.trim()) error("SELLER_NAME_MISSING");
  if (!raw.has(2)) error("VAT_NUMBER_MISSING");
  else if (!/^\d{15}$/.test(vatNumber) || !validateSaudiVatNumber(vatNumber)) error("VAT_NUMBER_INVALID");
  if (!raw.has(3)) error("TIMESTAMP_MISSING");
  else if (DATE_ONLY.test(timestamp)) error("TIMESTAMP_DATE_ONLY");
  else if (!DATE_TIME.test(timestamp) || Number.isNaN(Date.parse(timestamp.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"))))
    error("TIMESTAMP_INVALID");

  const totalOk = raw.has(4) && DECIMAL.test(total);
  const vatOk = raw.has(5) && DECIMAL.test(vatTotal);
  if (!raw.has(4)) error("TOTAL_MISSING");
  else if (!totalOk) error("TOTAL_INVALID");
  if (!raw.has(5)) error("VAT_TOTAL_MISSING");
  else if (!vatOk) error("VAT_TOTAL_INVALID");
  if (totalOk && vatOk) {
    const t = Number(total);
    const v = Number(vatTotal);
    if (v > t) error("VAT_EXCEEDS_TOTAL");
    else if (v > 0) {
      // VAT at 15% of a total that includes it = total × 15/115. A gap may just
      // mean mixed rates (zero-rated or exempt lines), so it is only a warning.
      const expected = Math.round((t * 15) / 115 * 100) / 100;
      if (Math.abs(v - expected) > 0.05) issues.push({ code: "VAT_NOT_15", severity: "warning" });
    }
  }

  const phase2Tags = [6, 7, 8].filter((t) => raw.has(t));
  if (phase2Tags.length > 0 && phase2Tags.length < 3) error("PHASE2_INCOMPLETE");
  if (badText) error("TEXT_NOT_UTF8");

  return {
    ok: true,
    qr: {
      phase: phase2Tags.length > 0 ? 2 : 1,
      sellerName,
      vatNumber,
      timestamp,
      total,
      vatTotal,
      ...(invoiceHash !== undefined ? { invoiceHash } : {}),
      ...(signature !== undefined ? { signature } : {}),
      ...(raw.has(8) ? { publicKeyBytes: raw.get(8)!.length } : {}),
      ...(raw.has(9) ? { certificateSignatureBytes: raw.get(9)!.length } : {}),
      tags: [...raw.keys()].sort((a, b) => a - b),
      issues,
    },
  };
}

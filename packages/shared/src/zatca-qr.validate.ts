/**
 * One-time QR validator — run with:
 *   bun packages/shared/src/zatca-qr.validate.ts
 *
 * Encodes a sample invoice and decodes it back,
 * printing each TLV field for manual confirmation.
 * Paste the "QR Payload (base64)" value at https://emvlab.org/tlvutils/
 * to do a hex-level cross-check.
 */

import { encodeZatcaQr, ZATCA_QR_TAGS } from "./zatca-qr";

// ── Replace these with a real invoice from your app ──────────────────
const sample = {
  sellerName: "شركة مثال للاستشارات",        // your business Arabic name
  vatNumber: "300000000000003",                // 15 digits, starts & ends with 3
  timestamp: new Date().toISOString(),         // full ISO 8601 with time
  invoiceTotal: "1150.00",                     // total INCLUDING VAT
  vatTotal: "150.00",                          // VAT portion only
};
// ─────────────────────────────────────────────────────────────────────

const base64 = encodeZatcaQr(sample);

// Decode back
const bytes = new Uint8Array(Buffer.from(base64, "base64"));
const decoder = new TextDecoder();
const fields = new Map<number, string>();
let i = 0;
while (i < bytes.length) {
  const tag = bytes[i]!;
  const len = bytes[i + 1]!;
  const val = decoder.decode(bytes.subarray(i + 2, i + 2 + len));
  fields.set(tag, val);
  i += 2 + len;
}

const tagNames: Record<number, string> = {
  [ZATCA_QR_TAGS.sellerName]:    "Seller name   ",
  [ZATCA_QR_TAGS.vatNumber]:     "VAT number    ",
  [ZATCA_QR_TAGS.timestamp]:     "Timestamp     ",
  [ZATCA_QR_TAGS.invoiceTotal]:  "Invoice total ",
  [ZATCA_QR_TAGS.vatTotal]:      "VAT total     ",
};

console.log("\n═══════════════════════════════════════════════");
console.log("  ZATCA Phase 1 QR — Payload Validation");
console.log("═══════════════════════════════════════════════\n");

let allOk = true;

for (const [tag, name] of Object.entries(tagNames)) {
  const decoded = fields.get(Number(tag));
  const expected = Object.values(sample)[Number(tag) - 1];
  const ok = decoded === expected;
  if (!ok) allOk = false;
  console.log(`  Tag ${tag} │ ${name} │ ${ok ? "✓" : "✗"} │ ${decoded ?? "(missing)"}`);
}

// Timestamp format check — must contain T and Z
const ts = fields.get(ZATCA_QR_TAGS.timestamp) ?? "";
const hasTime = ts.includes("T") && (ts.endsWith("Z") || ts.includes("+"));
console.log(`\n  Timestamp format   : ${hasTime ? "✓ Full ISO 8601 (date + time)" : "✗ Date-only — FAILS ZATCA validation"}`);
console.log(`  VAT number length  : ${fields.get(ZATCA_QR_TAGS.vatNumber)?.length === 15 ? "✓ 15 digits" : "✗ Must be exactly 15 digits"}`);
console.log(`  Base64 length      : ${base64.length} chars (max 700)`);

// base64 → hex for emvlab.org/tlvutils/ (the site needs hex, not base64)
const hex = Array.from(bytes)
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("")
  .toUpperCase();

console.log("\n───────────────────────────────────────────────");
console.log("  Base64 (used inside QR code):");
console.log(`\n  ${base64}\n`);
console.log("───────────────────────────────────────────────");
console.log("  HEX — paste this at emvlab.org/tlvutils/:");
console.log(`\n  ${hex}\n`);
console.log("───────────────────────────────────────────────");
console.log(`\n  Result: ${allOk && hasTime ? "✓  PASS — QR structure is ZATCA Phase 1 compliant" : "✗  FAIL — see errors above"}\n`);

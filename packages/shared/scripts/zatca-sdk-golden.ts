/**
 * Generates freshly built + signed ZATCA documents with our zatca-phase2 library
 * so the official ZATCA SDK (`fatoora -validate`) can check them.
 * Usage: bun scripts/zatca-sdk-golden.ts <outDir>
 * Writes <outDir>/<name>.xml and <outDir>/cert.b64 (header-less base64, the SDK's format).
 * Uses CONSTRUCTED test keys/certs only (never real taxpayer credentials).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { toBase64 } from "../src/zatca-phase2/bytes";
import { TEST_SIGNER_KEY, createTestCertificate, simplifiedInvoice, standardInvoice } from "../src/zatca-phase2/fixtures";
import { buildInvoiceXml, signInvoice, verifySignedInvoice } from "../src/zatca-phase2/index";

const out = process.argv[2];
if (!out) throw new Error("usage: bun scripts/zatca-sdk-golden.ts <outDir>");
mkdirSync(out, { recursive: true });

const now = new Date();
const certificate = toBase64(createTestCertificate());
writeFileSync(join(out, "cert.b64"), certificate);

const docs = { "simplified-invoice": simplifiedInvoice(), "standard-invoice": standardInvoice() };
for (const [name, input] of Object.entries(docs)) {
  const xml = buildInvoiceXml(input, { now });
  const { signedXml } = signInvoice({ xml, certificate, privateKey: TEST_SIGNER_KEY, signingTime: now });
  const check = verifySignedInvoice(signedXml);
  if (!check.valid) throw new Error(`${name}: our own verifier rejected it: ${JSON.stringify(check)}`);
  writeFileSync(join(out, `${name}.xml`), signedXml);
  console.log(`wrote ${name}.xml`);
}

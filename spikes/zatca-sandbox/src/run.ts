// End-to-end spike against the PUBLIC developer-portal sandbox only.
// Uses throwaway keys + ZATCA's documented sandbox values (OTP 123345, VAT 399999999900003).
//
//   node --experimental-strip-types src/run.ts          (Node >= 22.6)
//   bun src/run.ts
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/hashes/utils";
import { mkdirSync, writeFileSync } from "node:fs";
import { buildCsr, toPem } from "./csr.ts";
import { BASE_URLS, FatooraClient, redact } from "./api.ts";
import { fromBinarySecurityToken } from "./cert.ts";
import { FIRST_PIH, signInvoice, type DocKind, type InvoiceInput } from "./invoice.ts";

const SANDBOX_OTP = "123345"; // documented developer-portal test OTP
const TEST_VAT = "399999999900003"; // documented sandbox VAT number
const api = new FatooraClient(BASE_URLS.developerPortal);
const log: any[] = [];
const record = (step: string, res: { status: number; body: any }) => {
  const entry = { step, status: res.status, body: redact(res.body) };
  log.push(entry);
  console.log(`\n=== ${step}: HTTP ${res.status}`);
  console.log(JSON.stringify(entry.body, null, 2).slice(0, 2500));
};

mkdirSync("out", { recursive: true });

// 1) key + CSR ---------------------------------------------------------------
const priv = secp256k1.utils.randomPrivateKey();
writeFileSync("out/private-key.hex", bytesToHex(priv)); // gitignored, throwaway
const csrPem = toPem(
  buildCsr(
    {
      country: "SA",
      organizationUnit: "Riyadh Branch",
      organization: "Qaftr Spike Test LLC",
      commonName: `TST-886431145-${TEST_VAT}`,
      egsSerialNumber: `1-Qaftr|2-0.1|3-${crypto.randomUUID()}`,
      vatNumber: TEST_VAT,
      invoiceType: "1100",
      location: "RRRD2929",
      industry: "Supply activities",
      templateName: "TSTZATCA-Code-Signing",
    },
    priv,
  ),
  "CERTIFICATE REQUEST",
);
writeFileSync("out/egs.csr", csrPem);

// 2) Compliance CSID -----------------------------------------------------------
const ccsidRes = await api.complianceCsid(Buffer.from(csrPem).toString("base64"), SANDBOX_OTP);
record("compliance CSID", ccsidRes);
if (ccsidRes.status !== 200) process.exit(1);
const ccsid = { token: ccsidRes.body.binarySecurityToken, secret: ccsidRes.body.secret };
const ccsidCert = fromBinarySecurityToken(ccsid.token);
console.log("CCSID cert issuer:", ccsidCert.issuerName, "serial:", ccsidCert.serialDecimal, "notAfter:", ccsidCert.notAfter);

// 3) Compliance checks: 6 documents (simplified + standard x invoice/credit/debit)
const seller = {
  name: "Qaftr Spike Test LLC", vat: TEST_VAT, crn: "1010010000", street: "King Fahd Road",
  building: "1234", district: "Al Olaya", city: "Riyadh", postal: "12345",
};
const buyer = {
  name: "Buyer Test Co", vat: "399999999800003", street: "Prince Sultan St", building: "5678",
  district: "Al Rawdah", city: "Jeddah", postal: "23456",
};
let icv = 0;
let pih = FIRST_PIH;
const now = new Date();
const issueDate = now.toISOString().slice(0, 10);
const issueTime = now.toISOString().slice(11, 19);

function makeDoc(kind: DocKind, subtype: "0200000" | "0100000"): InvoiceInput {
  icv += 1;
  return {
    id: `SPK-${icv}`,
    uuid: crypto.randomUUID(),
    icv,
    pih,
    issueDate,
    issueTime,
    kind,
    subtype,
    billingReference: kind === "invoice" ? undefined : { id: "SPK-1", reason: "Returned items" },
    seller,
    buyer: subtype === "0100000" ? buyer : undefined,
    lines: [{ name: "Consulting hour", qty: 2, unitPrice: 50, vatRate: 15 }],
  };
}

const docs: [DocKind, "0200000" | "0100000"][] = [
  ["invoice", "0200000"], ["credit", "0200000"], ["debit", "0200000"],
  ["invoice", "0100000"], ["credit", "0100000"], ["debit", "0100000"],
];
for (const [kind, subtype] of docs) {
  const inp = makeDoc(kind, subtype);
  const signed = signInvoice(inp, priv, ccsidCert);
  const label = `${subtype === "0200000" ? "simplified" : "standard"}-${kind}`;
  writeFileSync(`out/${label}.xml`, signed.xml);
  const res = await api.complianceInvoice(ccsid, {
    invoiceHash: signed.invoiceHash,
    uuid: inp.uuid,
    invoice: Buffer.from(signed.xml).toString("base64"),
  });
  record(`compliance check ${label}`, res);
  pih = signed.invoiceHash;
}

// 4) Production CSID --------------------------------------------------------------
const pcsidRes = await api.productionCsid(ccsid, String(ccsidRes.body.requestID));
record("production CSID", pcsidRes);
if (pcsidRes.status !== 200) {
  writeFileSync("out/responses.json", JSON.stringify(log, null, 2));
  process.exit(1);
}
const pcsid = { token: pcsidRes.body.binarySecurityToken, secret: pcsidRes.body.secret };
const pcsidCert = fromBinarySecurityToken(pcsid.token);
console.log("PCSID cert issuer:", pcsidCert.issuerName, "serial:", pcsidCert.serialDecimal);
const pcsidMatchesKey =
  Buffer.from(pcsidCert.publicKeySpki).toString("hex").endsWith(
    Buffer.from(secp256k1.getPublicKey(priv, false)).toString("hex"),
  );
console.log("PCSID public key matches our key:", pcsidMatchesKey);

// 5) Reporting: simplified invoice ------------------------------------------------
{
  const inp = makeDoc("invoice", "0200000");
  const signed = signInvoice(inp, priv, pcsidCert);
  writeFileSync("out/report-simplified.xml", signed.xml);
  const res = await api.report(pcsid, {
    invoiceHash: signed.invoiceHash,
    uuid: inp.uuid,
    invoice: Buffer.from(signed.xml).toString("base64"),
  });
  record("reporting simplified invoice", res);
  pih = signed.invoiceHash;
}

// 6) Clearance: standard invoice ---------------------------------------------------
{
  const inp = makeDoc("invoice", "0100000");
  const signed = signInvoice(inp, priv, pcsidCert);
  writeFileSync("out/clear-standard.xml", signed.xml);
  const res = await api.clear(pcsid, {
    invoiceHash: signed.invoiceHash,
    uuid: inp.uuid,
    invoice: Buffer.from(signed.xml).toString("base64"),
  });
  record("clearance standard invoice", res);
}

writeFileSync("out/responses.json", JSON.stringify(log, null, 2));
console.log("\nSaved redacted responses to out/responses.json");

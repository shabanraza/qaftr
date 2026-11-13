// Negative tests: prove the sandbox actually checks hash/signature/QR, so a PASS means something.
import { secp256k1 } from "@noble/curves/secp256k1";
import { buildCsr, toPem } from "./csr.ts";
import { BASE_URLS, FatooraClient } from "./api.ts";
import { fromBinarySecurityToken } from "./cert.ts";
import { FIRST_PIH, signInvoice, type InvoiceInput } from "./invoice.ts";

const api = new FatooraClient(BASE_URLS.developerPortal);
const VAT = "399999999900003";
const priv = secp256k1.utils.randomPrivateKey();
const csr = toPem(buildCsr({ country: "SA", organizationUnit: "Riyadh Branch", organization: "Qaftr Spike Test LLC",
  commonName: `TST-886431145-${VAT}`, egsSerialNumber: `1-Qaftr|2-0.1|3-${crypto.randomUUID()}`, vatNumber: VAT,
  invoiceType: "1100", location: "RRRD2929", industry: "Supply activities", templateName: "TSTZATCA-Code-Signing" }, priv),
  "CERTIFICATE REQUEST");
const c = await api.complianceCsid(Buffer.from(csr).toString("base64"), "123345");
const ccsid = { token: c.body.binarySecurityToken, secret: c.body.secret };
const p = await api.productionCsid(ccsid, String(c.body.requestID));
const pcsid = { token: p.body.binarySecurityToken, secret: p.body.secret };
const cert = fromBinarySecurityToken(pcsid.token);
const now = new Date().toISOString();
const inp = (): InvoiceInput => ({ id: "NEG-1", uuid: crypto.randomUUID(), icv: 1, pih: FIRST_PIH,
  issueDate: now.slice(0, 10), issueTime: now.slice(11, 19), kind: "invoice", subtype: "0200000",
  seller: { name: "Qaftr Spike Test LLC", vat: VAT, crn: "1010010000", street: "King Fahd Road", building: "1234",
    district: "Al Olaya", city: "Riyadh", postal: "12345" },
  lines: [{ name: "Consulting hour", qty: 2, unitPrice: 50, vatRate: 15 }] });

const show = (label: string, r: any) => {
  const v = r.body?.validationResults ?? {};
  const msgs = [...(v.errorMessages ?? []), ...(v.warningMessages ?? [])].map((m: any) => `${m.type}:${m.code}`);
  console.log(label.padEnd(36), r.status, r.body?.reportingStatus ?? "", msgs.join(", ") || (typeof r.body === "string" ? r.body.slice(0, 120) : ""));
};
const send = (i: InvoiceInput, xml: string, hash: string) =>
  api.report(pcsid, { invoiceHash: hash, uuid: i.uuid, invoice: Buffer.from(xml).toString("base64") });

{ const i = inp(); const s = signInvoice(i, priv, cert); show("baseline", await send(i, s.xml, s.invoiceHash)); }
{ const i = inp(); const s = signInvoice(i, priv, cert);
  show("wrong invoiceHash in request body", await send(i, s.xml, Buffer.alloc(32, 7).toString("base64"))); }
{ const i = inp(); const s = signInvoice(i, priv, cert);
  const xml = s.xml.replace("<cbc:Name>Consulting hour</cbc:Name>", "<cbc:Name>Consulting hours</cbc:Name>");
  show("tampered body after signing", await send(i, xml, s.invoiceHash)); }
{ const i = inp(); const s = signInvoice(i, priv, cert);
  const other = secp256k1.utils.randomPrivateKey();
  const s2 = signInvoice(i, other, cert);
  show("signed with unrelated key", await send(i, s2.xml, s2.invoiceHash)); void s; }
{ const i = inp(); const s = signInvoice(i, priv, cert);
  const xml = s.xml.replace(/(<cbc:ID>QR<\/cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeCode="text\/plain">)[^<]+/, "$1AQVIZWxsbw==");
  show("broken QR", await send(i, xml, s.invoiceHash)); }

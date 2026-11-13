/**
 * PKCS#10 CSR for ZATCA EGS onboarding (compliance CSID request).
 *
 * Mirrors the ZATCA SDK / OpenSSL config:
 *   subject: C=SA, OU=<branch or 10-digit TIN for VAT groups>, O=<org>, CN=<EGS name>
 *   1.3.6.1.4.1.311.20.2 (certificate template name) = UTF8String per env
 *   (UTF8String verified accepted by the developer-portal sandbox, 2026-11-09)
 *   subjectAltName = dirName: SN=1-..|2-..|3-.., UID=<VAT>, title=<TSCZ flags>,
 *                    registeredAddress=<location>, businessCategory=<industry>
 * "SN" here is OpenSSL's short name for surname (2.5.4.4), which is what the
 * ZATCA config uses for the EGS serial (not serialNumber 2.5.4.5).
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { OID, der } from "./asn1";
import { toBase64, utf8 } from "./bytes";
import { publicKeyFromPrivate, publicKeyToSpki, toPem } from "./keys";
import { SAUDI_VAT_RE } from "./validate";

export type ZatcaEnvironment = "sandbox" | "simulation" | "production";

export const CERTIFICATE_TEMPLATES: Record<ZatcaEnvironment, string> = {
  sandbox: "TSTZATCA-Code-Signing",
  simulation: "PREZATCA-Code-Signing",
  production: "ZATCA-Code-Signing",
};

/** title = T S C Z: standard, simplified, (reserved), (reserved). */
export type ZatcaInvoiceTypeFlags = "1000" | "0100" | "1100";

export interface ZatcaCsrInput {
  environment: ZatcaEnvironment;
  commonName: string;
  organizationName: string;
  organizationUnitName: string;
  egsSerialNumber: string;
  vatNumber: string;
  invoiceTypes: ZatcaInvoiceTypeFlags;
  location: string;
  industry: string;
}

export type ZatcaCsrIssueCode =
  | "CSR_COMMON_NAME_REQUIRED"
  | "CSR_ORGANIZATION_REQUIRED"
  | "CSR_ORGANIZATION_UNIT_REQUIRED"
  | "CSR_EGS_SERIAL_INVALID"
  | "CSR_VAT_INVALID"
  | "CSR_INVOICE_TYPES_INVALID"
  | "CSR_LOCATION_REQUIRED"
  | "CSR_INDUSTRY_REQUIRED";

export class ZatcaCsrValidationError extends Error {
  readonly codes: ZatcaCsrIssueCode[];
  constructor(codes: ZatcaCsrIssueCode[]) {
    super(`ZATCA CSR validation failed: ${codes.join(", ")}`);
    this.name = "ZatcaCsrValidationError";
    this.codes = codes;
  }
}

export function egsSerialNumber(p: { solutionName: string; model: string; serial: string }): string {
  return `1-${p.solutionName}|2-${p.model}|3-${p.serial}`;
}

export function validateCsrInput(input: ZatcaCsrInput): ZatcaCsrIssueCode[] {
  const codes: ZatcaCsrIssueCode[] = [];
  const blank = (s: string) => !s || s.trim() === "";
  if (blank(input.commonName)) codes.push("CSR_COMMON_NAME_REQUIRED");
  if (blank(input.organizationName)) codes.push("CSR_ORGANIZATION_REQUIRED");
  if (blank(input.organizationUnitName)) codes.push("CSR_ORGANIZATION_UNIT_REQUIRED");
  if (!/^1-[^|]+\|2-[^|]+\|3-[^|]+$/.test(input.egsSerialNumber)) codes.push("CSR_EGS_SERIAL_INVALID");
  if (!SAUDI_VAT_RE.test(input.vatNumber)) codes.push("CSR_VAT_INVALID");
  if (!["1000", "0100", "1100"].includes(input.invoiceTypes)) codes.push("CSR_INVOICE_TYPES_INVALID");
  if (blank(input.location)) codes.push("CSR_LOCATION_REQUIRED");
  if (blank(input.industry)) codes.push("CSR_INDUSTRY_REQUIRED");
  return codes;
}

/** X.501 Name with one attribute per RDN, in the given order. */
export function encodeName(pairs: ReadonlyArray<readonly [oid: string, value: Uint8Array]>): Uint8Array {
  return der.seq(...pairs.map(([oid, value]) => der.set(der.seq(der.oid(oid), value))));
}

function extension(oid: string, value: Uint8Array): Uint8Array {
  return der.seq(der.oid(oid), der.octet(value));
}

export interface ZatcaCsr {
  der: Uint8Array;
  pem: string;
  /** Body for POST /compliance: { csr: base64(PEM text) }. */
  base64ForApi: string;
}

export function buildZatcaCsr(input: ZatcaCsrInput, privateKey: Uint8Array): ZatcaCsr {
  const codes = validateCsrInput(input);
  if (codes.length) throw new ZatcaCsrValidationError(codes);

  const subject = encodeName([
    [OID.country, der.printable("SA")],
    [OID.organizationalUnit, der.utf8(input.organizationUnitName)],
    [OID.organization, der.utf8(input.organizationName)],
    [OID.commonName, der.utf8(input.commonName)],
  ]);
  const sanDirName = encodeName([
    [OID.surname, der.utf8(input.egsSerialNumber)],
    [OID.uid, der.utf8(input.vatNumber)],
    [OID.title, der.utf8(input.invoiceTypes)],
    [OID.registeredAddress, der.utf8(input.location)],
    [OID.businessCategory, der.utf8(input.industry)],
  ]);
  const extensions = der.seq(
    extension(OID.certificateTemplateName, der.utf8(CERTIFICATE_TEMPLATES[input.environment])),
    extension(OID.subjectAltName, der.seq(der.ctx(4, true, sanDirName))),
  );
  const info = der.seq(
    der.int(0n),
    subject,
    publicKeyToSpki(publicKeyFromPrivate(privateKey)),
    der.ctx(0, true, der.seq(der.oid(OID.extensionRequest), der.set(extensions))),
  );
  const signature = secp256k1.sign(info, privateKey, { format: "der" });
  const csrDer = der.seq(info, der.seq(der.oid(OID.ecdsaWithSha256)), der.bitString(signature));
  const pem = toPem("CERTIFICATE REQUEST", csrDer);
  return { der: csrDer, pem, base64ForApi: toBase64(utf8(pem)) };
}

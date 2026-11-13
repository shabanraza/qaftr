// ZATCA CSR builder in pure TS (no OpenSSL): secp256k1 via @noble/curves.
// Same code could run in the browser (client-side "CSR generator" tool where the
// private key never leaves the device) or in a Cloudflare Worker.
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2";
import {
  bitString, ctx, int, octet, oid, printable, seq, set, utf8,
} from "./der.ts";

export interface CsrInput {
  /** C */
  country: "SA";
  /** OU: branch name (or 10-digit TIN for VAT groups) */
  organizationUnit: string;
  /** O: taxpayer legal name */
  organization: string;
  /** CN: EGS common name / unit name */
  commonName: string;
  /** SAN SN: "1-<solution name>|2-<model/version>|3-<device serial / UUID>" */
  egsSerialNumber: string;
  /** SAN UID: 15-digit VAT number (starts and ends with 3) */
  vatNumber: string;
  /** SAN title: 4-digit invoice-type flags TSCZ, e.g. "1100" = standard+simplified */
  invoiceType: string;
  /** SAN registeredAddress: branch address / short address */
  location: string;
  /** SAN businessCategory: industry */
  industry: string;
  /**
   * Certificate template name, OID 1.3.6.1.4.1.311.20.2:
   *   developer-portal sandbox: "TSTZATCA-Code-Signing" (the portal sample CSR uses "ZATCA-Code-Signing")
   *   simulation:               "PREZATCA-Code-Signing"
   *   production:               "ZATCA-Code-Signing"
   */
  templateName: string;
}

const OID = {
  C: "2.5.4.6", OU: "2.5.4.11", O: "2.5.4.10", CN: "2.5.4.3",
  SN: "2.5.4.4", UID: "0.9.2342.19200300.100.1.1", title: "2.5.4.12",
  registeredAddress: "2.5.4.26", businessCategory: "2.5.4.15",
  ecPublicKey: "1.2.840.10045.2.1", secp256k1: "1.3.132.0.10",
  ecdsaSha256: "1.2.840.10045.4.3.2", extensionRequest: "1.2.840.113549.1.9.14",
  templateName: "1.3.6.1.4.1.311.20.2", subjectAltName: "2.5.29.17",
};

const rdn = (type: string, value: Uint8Array) => set(seq(oid(type), value));

export const spki = (publicKey65: Uint8Array) =>
  seq(seq(oid(OID.ecPublicKey), oid(OID.secp256k1)), bitString(publicKey65));

export function buildCsr(input: CsrInput, privateKey: Uint8Array): Uint8Array {
  const pub = secp256k1.getPublicKey(privateKey, false); // 0x04 || X || Y

  const subject = seq(
    rdn(OID.C, printable(input.country)),
    rdn(OID.OU, utf8(input.organizationUnit)),
    rdn(OID.O, utf8(input.organization)),
    rdn(OID.CN, utf8(input.commonName)),
  );

  const sanDirName = seq(
    rdn(OID.SN, utf8(input.egsSerialNumber)),
    rdn(OID.UID, utf8(input.vatNumber)),
    rdn(OID.title, utf8(input.invoiceType)),
    rdn(OID.registeredAddress, utf8(input.location)),
    rdn(OID.businessCategory, utf8(input.industry)),
  );
  const san = seq(ctx(4, true, sanDirName)); // GeneralNames { [4] directoryName }

  const extensions = seq(
    seq(oid(OID.templateName), octet(utf8(input.templateName))),
    seq(oid(OID.subjectAltName), octet(san)),
  );
  const attributes = ctx(0, true, seq(oid(OID.extensionRequest), set(extensions)));

  const cri = seq(int(0), subject, spki(pub), attributes);
  const sig = secp256k1.sign(sha256(cri), privateKey).toDERRawBytes();
  return seq(cri, seq(oid(OID.ecdsaSha256)), bitString(sig));
}

export const toPem = (der: Uint8Array, label: string) => {
  const b64 = Buffer.from(der).toString("base64").replace(/(.{64})/g, "$1\n");
  return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`;
};

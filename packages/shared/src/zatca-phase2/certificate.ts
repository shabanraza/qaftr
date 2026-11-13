/** Read-only X.509 parsing for the fields ZATCA signing needs. */

import { type Asn1Node, OID, child, decodeDer, decodeInt, decodeOid } from "./asn1";
import { fromBase64, fromUtf8, toBase64 } from "./bytes";

export interface ZatcaCertificate {
  der: Uint8Array;
  /** Base64 DER without PEM armour (what goes into ds:X509Certificate). */
  base64: string;
  tbs: Uint8Array;
  serialNumber: string;
  issuerName: string;
  subjectName: string;
  notBefore: Date;
  notAfter: Date;
  /** 65-byte uncompressed point */
  publicKey: Uint8Array;
  /** DER SubjectPublicKeyInfo (QR tag 8) */
  publicKeySpki: Uint8Array;
  /** DER ECDSA signature of the issuing CA (QR tag 9) */
  signature: Uint8Array;
}

const SHORT_NAMES: Record<string, string> = {
  [OID.commonName]: "CN",
  [OID.country]: "C",
  [OID.locality]: "L",
  [OID.state]: "ST",
  [OID.organization]: "O",
  [OID.organizationalUnit]: "OU",
  [OID.domainComponent]: "DC",
  [OID.serialNumber]: "SERIALNUMBER",
  [OID.surname]: "SN",
  [OID.title]: "T",
  [OID.uid]: "UID",
  [OID.email]: "E",
};

function escapeRdnValue(v: string): string {
  return v.replace(/([,+"\\<>;])/g, "\\$1").replace(/^([ #])/, "\\$1").replace(/ $/, "\\ ");
}

/** RFC 4514-style string: last RDN first, joined with ", " (ZATCA sample format). */
export function formatName(name: Asn1Node): string {
  const parts = (name.children ?? []).map((set) =>
    (set.children ?? [])
      .map((atv) => {
        const oid = decodeOid(child(atv, 0).value);
        return `${SHORT_NAMES[oid] ?? oid}=${escapeRdnValue(fromUtf8(child(atv, 1).value))}`;
      })
      .join("+"),
  );
  return parts.reverse().join(", ");
}

function parseTime(node: Asn1Node): Date {
  const s = fromUtf8(node.value);
  const full = node.tag === 0x17 ? `${Number(s.slice(0, 2)) >= 50 ? "19" : "20"}${s}` : s;
  return new Date(
    `${full.slice(0, 4)}-${full.slice(4, 6)}-${full.slice(6, 8)}T${full.slice(8, 10)}:${full.slice(10, 12)}:${full.slice(12, 14)}Z`,
  );
}

function toDer(input: string | Uint8Array): Uint8Array {
  if (typeof input !== "string") return input;
  return fromBase64(input.replace(/-----(BEGIN|END) [^-]+-----/g, ""));
}

/** Accepts DER bytes, PEM, or bare base64 DER. */
export function parseCertificate(input: string | Uint8Array): ZatcaCertificate {
  const bytes = new Uint8Array(toDer(input));
  const root = decodeDer(bytes);
  const tbs = child(root, 0);
  const hasVersion = child(tbs, 0).tag === 0xa0;
  const at = (i: number) => child(tbs, hasVersion ? i : i - 1);
  const validity = at(4);
  const spki = at(6);
  return {
    der: bytes,
    base64: toBase64(bytes),
    tbs: tbs.raw,
    serialNumber: decodeInt(at(1).value).toString(10),
    issuerName: formatName(at(3)),
    subjectName: formatName(at(5)),
    notBefore: parseTime(child(validity, 0)),
    notAfter: parseTime(child(validity, 1)),
    publicKey: child(spki, 1).value.subarray(1),
    publicKeySpki: spki.raw,
    signature: child(root, 2).value.subarray(1),
  };
}

/**
 * ZATCA returns `binarySecurityToken` = base64(<base64 DER certificate text>).
 * The decoded text is the certificate that is embedded in signed invoices.
 */
export function certificateFromBinarySecurityToken(token: string): ZatcaCertificate {
  return parseCertificate(fromUtf8(fromBase64(token)));
}

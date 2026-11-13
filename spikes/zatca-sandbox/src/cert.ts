// Read the bits of a ZATCA-issued X.509 certificate that the invoice needs.
import { parse, oidToString } from "./der.ts";

const NAMES: Record<string, string> = {
  "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.10": "O", "2.5.4.11": "OU",
  "0.9.2342.19200300.100.1.25": "DC",
};

export interface CertInfo {
  /** base64 DER, exactly as sent inside <ds:X509Certificate> */
  base64: string;
  issuerName: string; // e.g. "CN=eInvoicing" or "CN=PRZEINVOICESCA4-CA, DC=extgazt, DC=gov, DC=local"
  serialDecimal: string;
  /** SubjectPublicKeyInfo DER bytes (QR tag 8) */
  publicKeySpki: Uint8Array;
  /** CA's signature over the certificate, DER bytes (QR tag 9) */
  signatureValue: Uint8Array;
  notAfter: string;
}

/** binarySecurityToken from the CSID APIs is base64( base64(DER) ). */
export function fromBinarySecurityToken(token: string): CertInfo {
  const certB64 = Buffer.from(token, "base64").toString("utf8");
  return parseCert(certB64);
}

export function parseCert(certB64: string): CertInfo {
  const der = new Uint8Array(Buffer.from(certB64, "base64"));
  const cert = parse(der);
  const [tbs, , sigValue] = cert.children!;
  const t = tbs.children!;
  const hasVersion = t[0].tag === 0xa0;
  const serial = t[hasVersion ? 1 : 0];
  const issuer = t[hasVersion ? 3 : 2];
  const validity = t[hasVersion ? 4 : 3];
  const spki = t[hasVersion ? 6 : 5];

  const rdns = issuer.children!.map((set) => {
    const atv = set.children![0].children!;
    const type = oidToString(atv[0].value);
    return `${NAMES[type] ?? type}=${new TextDecoder().decode(atv[1].value)}`;
  });

  let serialBig = 0n;
  for (const b of serial.value) serialBig = (serialBig << 8n) | BigInt(b);

  return {
    base64: certB64,
    issuerName: rdns.reverse().join(", "),
    serialDecimal: serialBig.toString(10),
    publicKeySpki: spki.bytes,
    signatureValue: sigValue.value.subarray(1), // drop "unused bits" byte
    notAfter: new TextDecoder().decode(validity.children![1].value),
  };
}

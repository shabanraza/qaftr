import { describe, expect, it } from "bun:test";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { type Asn1Node, OID, decodeDer, decodeOid } from "./asn1";
import { fromBase64, fromHex, fromUtf8 } from "./bytes";
import { CERTIFICATE_TEMPLATES, ZatcaCsrValidationError, buildZatcaCsr, egsSerialNumber } from "./csr";
import { publicKeyFromPrivate } from "./keys";

const SK = fromHex("0202020202020202020202020202020202020202020202020202020202020202");
const INPUT = {
  environment: "sandbox" as const,
  commonName: "TST-886431145-399999999900003",
  organizationName: "Qaftr Test Co",
  organizationUnitName: "Riyadh Branch",
  egsSerialNumber: egsSerialNumber({ solutionName: "Qaftr", model: "Web", serial: "ed22f1d8-e6a2-1118-9b58-d9a8f11e445f" }),
  vatNumber: "399999999900003",
  invoiceTypes: "1100" as const,
  location: "Riyadh",
  industry: "Retail",
};

/** Flattens a Name / GeneralName RDN sequence into [oid, string] pairs. */
function rdns(name: Asn1Node): Array<[string, string]> {
  return name.children!.map((set) => {
    const atv = set.children![0]!;
    return [decodeOid(atv.children![0]!.value), fromUtf8(atv.children![1]!.value)];
  });
}

describe("egsSerialNumber", () => {
  it("formats 1-Name|2-Model|3-Serial", () => {
    expect(INPUT.egsSerialNumber).toBe("1-Qaftr|2-Web|3-ed22f1d8-e6a2-1118-9b58-d9a8f11e445f");
  });
});

describe("buildZatcaCsr", () => {
  const csr = buildZatcaCsr(INPUT, SK);
  const node = decodeDer(csr.der);
  const info = node.children![0]!;

  it("returns PEM and the base64(PEM) value the compliance API expects", () => {
    expect(csr.pem.startsWith("-----BEGIN CERTIFICATE REQUEST-----\n")).toBe(true);
    expect(fromUtf8(fromBase64(csr.base64ForApi))).toBe(csr.pem);
  });

  it("has subject C=SA, OU, O, CN", () => {
    expect(rdns(info.children![1]!)).toEqual([
      [OID.country, "SA"],
      [OID.organizationalUnit, "Riyadh Branch"],
      [OID.organization, "Qaftr Test Co"],
      [OID.commonName, "TST-886431145-399999999900003"],
    ]);
  });

  it("embeds the secp256k1 public key", () => {
    const spki = info.children![2]!;
    expect(decodeOid(spki.children![0]!.children![1]!.value)).toBe(OID.secp256k1);
    expect(spki.children![1]!.value.subarray(1)).toEqual(publicKeyFromPrivate(SK));
  });

  it("requests the environment certificate template and the ZATCA SAN dirName fields", () => {
    const attrs = info.children![3]!;
    expect(attrs.tag).toBe(0xa0);
    const extReq = attrs.children![0]!;
    expect(decodeOid(extReq.children![0]!.value)).toBe(OID.extensionRequest);
    const exts = extReq.children![1]!.children![0]!.children!;
    const byOid = new Map(exts.map((x) => [decodeOid(x.children![0]!.value), x.children![x.children!.length - 1]!.value]));

    const template = decodeDer(byOid.get(OID.certificateTemplateName)!);
    expect(fromUtf8(template.value)).toBe("TSTZATCA-Code-Signing");

    const san = decodeDer(byOid.get(OID.subjectAltName)!);
    const dirName = san.children![0]!;
    expect(dirName.tag).toBe(0xa4);
    expect(rdns(dirName.children![0]!)).toEqual([
      [OID.surname, "1-Qaftr|2-Web|3-ed22f1d8-e6a2-1118-9b58-d9a8f11e445f"],
      [OID.uid, "399999999900003"],
      [OID.title, "1100"],
      [OID.registeredAddress, "Riyadh"],
      [OID.businessCategory, "Retail"],
    ]);
  });

  it("is signed with ecdsa-with-SHA256 over CertificationRequestInfo", () => {
    expect(decodeOid(node.children![1]!.children![0]!.value)).toBe(OID.ecdsaWithSha256);
    const sig = node.children![2]!.value.subarray(1);
    expect(secp256k1.verify(sig, info.raw, publicKeyFromPrivate(SK), { format: "der", lowS: false })).toBe(true);
  });

  it("uses per-environment template names", () => {
    expect(CERTIFICATE_TEMPLATES).toEqual({
      sandbox: "TSTZATCA-Code-Signing",
      simulation: "PREZATCA-Code-Signing",
      production: "ZATCA-Code-Signing",
    });
    const prod = decodeDer(buildZatcaCsr({ ...INPUT, environment: "production" }, SK).der);
    expect(prod.raw.length).toBeGreaterThan(0);
  });

  it("validates inputs with localisable codes", () => {
    try {
      buildZatcaCsr({ ...INPUT, vatNumber: "1", invoiceTypes: "0000" as never, egsSerialNumber: "x", commonName: "" }, SK);
      throw new Error("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ZatcaCsrValidationError);
      expect((e as ZatcaCsrValidationError).codes.sort()).toEqual(
        ["CSR_COMMON_NAME_REQUIRED", "CSR_EGS_SERIAL_INVALID", "CSR_INVOICE_TYPES_INVALID", "CSR_VAT_INVALID"].sort(),
      );
    }
  });
});

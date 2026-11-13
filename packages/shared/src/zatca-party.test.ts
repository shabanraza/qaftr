import { describe, expect, it } from "bun:test";
import {
  buyerStandardReadiness,
  checkBuyerFormat,
  checkSellerFormat,
  normalizePartyInput,
  sellerZatcaReadiness,
} from "./zatca-party";

const SELLER = {
  name: "مؤسسة قافتر التجارية",
  vatNumber: "300000000000003",
  crNumber: "1010010000",
  street: "طريق الملك فهد",
  buildingNumber: "1234",
  additionalNumber: "5678",
  district: "العليا",
  city: "الرياض",
  postalCode: "12211",
};

const fields = (issues: { field: string; code: string }[]) => issues.map((i) => `${i.field}:${i.code}`);

describe("normalizePartyInput", () => {
  it("converts Arabic-Indic digits and strips spaces and dashes in numeric fields only", () => {
    const n = normalizePartyInput({
      name: " شركة ١٢٣ ",
      vatNumber: "٣٠٠ ٠٠٠٠٠٠٠٠٠٠٠٣",
      crNumber: "1010-010-000",
      buildingNumber: "١٢٣٤",
      postalCode: "١٢٢١١",
      street: "  شارع ٧  ",
      country: "sa",
      idScheme: "nat",
    });
    expect(n).toMatchObject({
      name: "شركة ١٢٣",
      vatNumber: "300000000000003",
      crNumber: "1010010000",
      buildingNumber: "1234",
      postalCode: "12211",
      street: "شارع ٧",
      country: "SA",
      idScheme: "NAT",
    });
  });

  it("turns empty strings into undefined", () => {
    expect(normalizePartyInput({ vatNumber: "  ", city: "" })).toEqual({ vatNumber: undefined, city: undefined });
  });
});

describe("seller (business) profile", () => {
  it("accepts a complete profile and reports it ready for ZATCA Phase 2", () => {
    expect(checkSellerFormat(SELLER)).toEqual([]);
    expect(sellerZatcaReadiness(SELLER)).toEqual({ ready: true, issues: [] });
  });

  it("lets a partial profile be saved but lists what is missing for Phase 2", () => {
    const partial = { name: SELLER.name, vatNumber: SELLER.vatNumber };
    expect(checkSellerFormat(partial)).toEqual([]);
    const r = sellerZatcaReadiness(partial);
    expect(r.ready).toBe(false);
    expect(fields(r.issues)).toEqual([
      "crNumber:REQUIRED",
      "street:REQUIRED",
      "buildingNumber:REQUIRED",
      "district:REQUIRED",
      "city:REQUIRED",
      "postalCode:REQUIRED",
    ]);
  });

  it("flags badly formatted VAT, CR, building, additional and postal numbers", () => {
    expect(
      fields(
        checkSellerFormat({
          vatNumber: "123456789012345",
          crNumber: "12345",
          buildingNumber: "12",
          additionalNumber: "99999",
          postalCode: "1234",
        }),
      ),
    ).toEqual([
      "vatNumber:INVALID_VAT",
      "crNumber:INVALID_CR",
      "buildingNumber:INVALID_BUILDING",
      "additionalNumber:INVALID_ADDITIONAL",
      "postalCode:INVALID_POSTAL",
    ]);
  });

  it("normalizes Arabic digits before checking", () => {
    expect(checkSellerFormat({ vatNumber: "٣٠٠٠٠٠٠٠٠٠٠٠٠٠٣", postalCode: "١٢٢١١" })).toEqual([]);
  });
});

describe("buyer (client) profile", () => {
  const SA_BUYER = {
    name: "شركة العميل",
    vatNumber: "310000000000003",
    street: "شارع التحلية",
    buildingNumber: "2222",
    district: "السليمانية",
    city: "الرياض",
    postalCode: "12245",
    country: "SA",
  };

  it("needs nothing but a name to be saved", () => {
    expect(checkBuyerFormat({ name: "عميل" })).toEqual([]);
  });

  it("is ready for a standard (B2B) invoice with a VAT number and a full Saudi address", () => {
    expect(buyerStandardReadiness(SA_BUYER)).toEqual({ ready: true, issues: [] });
  });

  it("accepts another ID instead of a VAT number, but not TIN (that is the VAT number)", () => {
    const { vatNumber: _vat, ...noVat } = SA_BUYER;
    expect(buyerStandardReadiness({ ...noVat, idScheme: "CRN", idValue: "1010010000" }).ready).toBe(true);
    expect(fields(buyerStandardReadiness(noVat).issues)).toEqual(["vatNumber:VAT_OR_ID_REQUIRED"]);
    expect(fields(checkBuyerFormat({ idScheme: "TIN", idValue: "x" }))).toEqual(["idScheme:INVALID_SCHEME"]);
    expect(fields(checkBuyerFormat({ idScheme: "CRN" }))).toEqual(["idValue:REQUIRED"]);
  });

  it("requires the Saudi address only for Saudi buyers", () => {
    expect(fields(buyerStandardReadiness({ name: "X", vatNumber: "310000000000003" }).issues)).toEqual([
      "street:REQUIRED",
      "buildingNumber:REQUIRED",
      "district:REQUIRED",
      "city:REQUIRED",
      "postalCode:REQUIRED",
    ]);
    expect(buyerStandardReadiness({ name: "Acme Ltd", country: "AE", idScheme: "OTH", idValue: "TRN100" }).ready).toBe(true);
  });

  it("only checks a Saudi VAT format for Saudi buyers", () => {
    expect(fields(checkBuyerFormat({ vatNumber: "100123456700003" }))).toEqual(["vatNumber:INVALID_VAT"]);
    expect(checkBuyerFormat({ vatNumber: "100123456700003", country: "AE" })).toEqual([]);
    expect(fields(checkBuyerFormat({ country: "Saudi" }))).toEqual(["country:INVALID_COUNTRY"]);
  });
});

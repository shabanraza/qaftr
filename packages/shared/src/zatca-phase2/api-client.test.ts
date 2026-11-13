import { describe, expect, it } from "bun:test";
import { fromBase64, fromUtf8 } from "./bytes";
import { ZATCA_BASE_URLS, ZATCA_SANDBOX_OTP, ZatcaApiError, createZatcaClient } from "./api-client";

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function mockFetch(status: number, json: unknown) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method ?? "GET",
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  };
  return { calls, fetchImpl: fetchImpl as typeof fetch };
}

const CREDS = { binarySecurityToken: "VE9LRU4=", secret: "s3cr3t" };
const DOC = { invoiceHash: "aGFzaA==", uuid: "8e6000cf-1a98-4174-b3e7-b5d5954bc10d", signedXml: "<Invoice>ع</Invoice>" };

describe("ZATCA_BASE_URLS", () => {
  it("defines developer-portal sandbox, simulation and production gateways", () => {
    expect(ZATCA_BASE_URLS).toEqual({
      sandbox: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
      simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
      production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
    });
  });
});

describe("createZatcaClient", () => {
  it("requests a compliance CSID with OTP and base64 CSR, without auth", async () => {
    const { calls, fetchImpl } = mockFetch(200, {
      requestID: 1234567890123,
      dispositionMessage: "ISSUED",
      binarySecurityToken: "QkFTRTY0",
      secret: "abc",
    });
    const client = createZatcaClient({ environment: "sandbox", fetch: fetchImpl });
    const res = await client.requestComplianceCsid({ csrBase64: "Q1NS", otp: "123345" });
    expect(res).toEqual({ requestId: "1234567890123", dispositionMessage: "ISSUED", binarySecurityToken: "QkFTRTY0", secret: "abc" });
    expect(calls[0]!.url).toBe(`${ZATCA_BASE_URLS.sandbox}/compliance`);
    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.headers).toMatchObject({ otp: "123345", "accept-version": "V2", "accept-language": "en" });
    expect(calls[0]!.headers.authorization).toBeUndefined();
    expect(calls[0]!.body).toEqual({ csr: "Q1NS" });
  });

  it("checks a compliance invoice with Basic auth = base64(token:secret) and base64 XML", async () => {
    const { calls, fetchImpl } = mockFetch(200, {
      validationResults: {
        infoMessages: [{ type: "INFO", code: "XSD_ZATCA_VALID", category: "XSD validation", message: "Complied", status: "PASS" }],
        warningMessages: [],
        errorMessages: [],
        status: "PASS",
      },
      reportingStatus: "REPORTED",
      clearanceStatus: null,
    });
    const client = createZatcaClient({ environment: "simulation", fetch: fetchImpl, language: "ar" });
    const res = await client.checkComplianceInvoice(CREDS, DOC);
    expect(calls[0]!.url).toBe(`${ZATCA_BASE_URLS.simulation}/compliance/invoices`);
    expect(fromUtf8(fromBase64(calls[0]!.headers.authorization!.replace("Basic ", "")))).toBe("VE9LRU4=:s3cr3t");
    expect(calls[0]!.headers["accept-language"]).toBe("ar");
    expect(calls[0]!.body).toEqual({ invoiceHash: DOC.invoiceHash, uuid: DOC.uuid, invoice: "PEludm9pY2U+2Lk8L0ludm9pY2U+" });
    expect(res).toMatchObject({ ok: true, httpStatus: 200, status: "PASS", reportingStatus: "REPORTED", retryable: false });
    expect(res.info[0]?.code).toBe("XSD_ZATCA_VALID");
  });

  it("requests a production CSID from the compliance request id", async () => {
    const { calls, fetchImpl } = mockFetch(200, { requestID: 99, binarySecurityToken: "UFJPRA==", secret: "p", dispositionMessage: "ISSUED" });
    const client = createZatcaClient({ environment: "production", fetch: fetchImpl });
    const res = await client.requestProductionCsid(CREDS, { complianceRequestId: "1234567890123" });
    expect(calls[0]!.url).toBe(`${ZATCA_BASE_URLS.production}/production/csids`);
    expect(calls[0]!.body).toEqual({ compliance_request_id: "1234567890123" });
    expect(res.binarySecurityToken).toBe("UFJPRA==");
  });

  it("renews a production CSID with PATCH + OTP", async () => {
    const { calls, fetchImpl } = mockFetch(200, { requestID: 1, binarySecurityToken: "TkVX", secret: "n", dispositionMessage: "ISSUED" });
    await createZatcaClient({ environment: "production", fetch: fetchImpl }).renewProductionCsid(CREDS, { csrBase64: "Q1NS", otp: "111111" });
    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.headers.otp).toBe("111111");
    expect(calls[0]!.headers.authorization).toStartWith("Basic ");
  });

  it("reports simplified invoices (Clearance-Status: 0) and parses warnings (202)", async () => {
    const { calls, fetchImpl } = mockFetch(202, {
      validationResults: {
        infoMessages: [],
        warningMessages: [{ type: "WARNING", code: "BR-KSA-08", category: "KSA", message: "seller id", status: "WARNING" }],
        errorMessages: [],
        status: "WARNING",
      },
      reportingStatus: "REPORTED",
    });
    const res = await createZatcaClient({ environment: "sandbox", fetch: fetchImpl }).reportInvoice(CREDS, DOC);
    expect(calls[0]!.url).toBe(`${ZATCA_BASE_URLS.sandbox}/invoices/reporting/single`);
    expect(calls[0]!.headers["clearance-status"]).toBe("0");
    expect(res).toMatchObject({ ok: true, status: "WARNING", httpStatus: 202 });
    expect(res.warnings).toEqual([{ type: "WARNING", code: "BR-KSA-08", category: "KSA", message: "seller id", status: "WARNING" }]);
  });

  it("clears standard invoices (Clearance-Status: 1) and decodes the cleared XML", async () => {
    const { calls, fetchImpl } = mockFetch(200, {
      validationResults: { infoMessages: [], warningMessages: [], errorMessages: [], status: "PASS" },
      clearanceStatus: "CLEARED",
      clearedInvoice: "PEludm9pY2U+2Lk8L0ludm9pY2U+",
    });
    const res = await createZatcaClient({ environment: "sandbox", fetch: fetchImpl }).clearInvoice(CREDS, DOC);
    expect(calls[0]!.url).toBe(`${ZATCA_BASE_URLS.sandbox}/invoices/clearance/single`);
    expect(calls[0]!.headers["clearance-status"]).toBe("1");
    expect(res).toMatchObject({ ok: true, clearanceStatus: "CLEARED", clearedInvoiceXml: "<Invoice>ع</Invoice>" });
  });

  it("returns rejected (400) submissions as non-retryable results with errors", async () => {
    const { fetchImpl } = mockFetch(400, {
      validationResults: {
        infoMessages: [],
        warningMessages: [],
        errorMessages: [{ type: "ERROR", code: "invalid-invoice-hash", category: "INVOICE_HASHING_ERRORS", message: "bad hash", status: "ERROR" }],
        status: "ERROR",
      },
      clearanceStatus: "NOT_CLEARED",
    });
    const res = await createZatcaClient({ environment: "sandbox", fetch: fetchImpl }).clearInvoice(CREDS, DOC);
    expect(res).toMatchObject({ ok: false, status: "ERROR", retryable: false, clearanceStatus: "NOT_CLEARED" });
    expect(res.errors[0]?.code).toBe("invalid-invoice-hash");
  });

  it("maps HTTP 303 on clearance to CLEARANCE_DISABLED without following the redirect", async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = (async (_u: string, init?: RequestInit) => {
      calls.push(init!);
      return new Response(null, { status: 303, headers: { location: "/invoices/reporting/single" } });
    }) as unknown as typeof fetch;
    const res = await createZatcaClient({ environment: "sandbox", fetch: fetchImpl }).clearInvoice(CREDS, DOC);
    expect(calls[0]!.redirect).toBe("manual");
    expect(res).toMatchObject({ ok: false, httpStatus: 303, status: "CLEARANCE_DISABLED", retryable: false });
  });

  it("exposes the documented developer-portal test OTP", () => {
    expect(ZATCA_SANDBOX_OTP).toBe("123345");
  });

  it("throws typed errors: 401 not retryable, 429/5xx and network failures retryable", async () => {
    const run = async (status: number) => {
      const { fetchImpl } = mockFetch(status, { message: "x" });
      return createZatcaClient({ environment: "sandbox", fetch: fetchImpl }).reportInvoice(CREDS, DOC);
    };
    await expect(run(401)).rejects.toMatchObject({ name: "ZatcaApiError", httpStatus: 401, retryable: false });
    await expect(run(429)).rejects.toMatchObject({ httpStatus: 429, retryable: true });
    await expect(run(503)).rejects.toMatchObject({ httpStatus: 503, retryable: true });
    const failing = (async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    const err = await createZatcaClient({ environment: "sandbox", fetch: failing }).reportInvoice(CREDS, DOC).catch((e) => e);
    expect(err).toBeInstanceOf(ZatcaApiError);
    expect(err).toMatchObject({ httpStatus: 0, retryable: true });
  });
});

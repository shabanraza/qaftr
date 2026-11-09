import { describe, expect, it } from "vitest";
import {
  UAE_EINVOICING_MILESTONES,
  getUaeEInvoicingReadiness,
} from "./index";

const base = {
  annualRevenueAed: 2_000_000,
  isGovernmentEntity: false,
  sellsB2BorB2G: true,
  sellsOnlyB2C: false,
  today: "2026-11-08",
};

describe("UAE_EINVOICING_MILESTONES", () => {
  it("lists the pilot and the three go-live dates", () => {
    expect(UAE_EINVOICING_MILESTONES.pilotStart).toBe("2026-07-01");
    expect(UAE_EINVOICING_MILESTONES.largeBusinessGoLive).toBe("2027-01-01");
    expect(UAE_EINVOICING_MILESTONES.otherBusinessGoLive).toBe("2027-07-01");
    expect(UAE_EINVOICING_MILESTONES.governmentGoLive).toBe("2027-10-01");
    expect(UAE_EINVOICING_MILESTONES.largeBusinessRevenueThresholdAed).toBe(50_000_000);
  });
});

describe("getUaeEInvoicingReadiness", () => {
  it("puts a small B2B business in the 1 Jul 2027 phase", () => {
    const result = getUaeEInvoicingReadiness(base)!;
    expect(result.phase).toBe("other-business");
    expect(result.mandatoryDate).toBe("2027-07-01");
    expect(result.status).toBe("upcoming");
    expect(result.daysRemaining).toBe(235);
  });

  it("puts revenue of exactly AED 50M in the 1 Jan 2027 phase", () => {
    const result = getUaeEInvoicingReadiness({ ...base, annualRevenueAed: 50_000_000 })!;
    expect(result.phase).toBe("large-business");
    expect(result.mandatoryDate).toBe("2027-01-01");
    expect(result.daysRemaining).toBe(54);
  });

  it("keeps revenue just under AED 50M in the other-business phase", () => {
    expect(
      getUaeEInvoicingReadiness({ ...base, annualRevenueAed: 49_999_999.99 })!.phase,
    ).toBe("other-business");
  });

  it("gives large businesses the reported ASP deadline and its alternative", () => {
    const result = getUaeEInvoicingReadiness({ ...base, annualRevenueAed: 80_000_000 })!;
    expect(result.aspAppointment).toEqual({
      reportedDeadline: "2026-07-31",
      alternateReportedDeadline: "2026-10-30",
      deadlinePassed: true,
      recommendation: "appoint-now",
    });
  });

  it("recommends planning the ASP appointment now for other businesses", () => {
    const result = getUaeEInvoicingReadiness(base)!;
    expect(result.aspAppointment).toEqual({
      reportedDeadline: null,
      alternateReportedDeadline: null,
      deadlinePassed: false,
      recommendation: "plan-now",
    });
  });

  it("uses the government phase for government entities regardless of revenue", () => {
    const result = getUaeEInvoicingReadiness({
      ...base,
      annualRevenueAed: 900_000_000,
      isGovernmentEntity: true,
    })!;
    expect(result.phase).toBe("government");
    expect(result.mandatoryDate).toBe("2027-10-01");
  });

  it("marks B2C-only sellers as not in scope yet", () => {
    const result = getUaeEInvoicingReadiness({
      ...base,
      sellsB2BorB2G: false,
      sellsOnlyB2C: true,
    })!;
    expect(result.status).toBe("not-in-scope-yet");
    expect(result.phase).toBe("b2c-only");
    expect(result.mandatoryDate).toBeNull();
    expect(result.daysRemaining).toBeNull();
    expect(result.aspAppointment.recommendation).toBe("monitor");
  });

  it("lets B2C-only win even if B2B is also ticked (contradictory input)", () => {
    expect(getUaeEInvoicingReadiness({ ...base, sellsOnlyB2C: true })!.status).toBe(
      "not-in-scope-yet",
    );
  });

  it("treats a business with no B2B/B2G sales as not in scope yet", () => {
    expect(getUaeEInvoicingReadiness({ ...base, sellsB2BorB2G: false })!.status).toBe(
      "not-in-scope-yet",
    );
  });

  it("marks the phase overdue on and after the mandatory date", () => {
    const onDay = getUaeEInvoicingReadiness({ ...base, today: "2027-07-01" })!;
    expect(onDay.status).toBe("overdue-mandatory");
    expect(onDay.daysRemaining).toBe(0);
    const after = getUaeEInvoicingReadiness({
      ...base,
      annualRevenueAed: 60_000_000,
      today: "2027-02-15",
    })!;
    expect(after.status).toBe("overdue-mandatory");
    expect(after.daysRemaining).toBe(0);
  });

  it("accepts a Date for today (UTC calendar day)", () => {
    const result = getUaeEInvoicingReadiness({
      ...base,
      today: new Date("2027-06-30T12:00:00Z"),
    })!;
    expect(result.daysRemaining).toBe(1);
    expect(result.status).toBe("upcoming");
  });

  it("returns null for invalid revenue or date", () => {
    expect(getUaeEInvoicingReadiness({ ...base, annualRevenueAed: -1 })).toBeNull();
    expect(getUaeEInvoicingReadiness({ ...base, annualRevenueAed: Number.NaN })).toBeNull();
    expect(getUaeEInvoicingReadiness({ ...base, today: "not-a-date" })).toBeNull();
    expect(getUaeEInvoicingReadiness({ ...base, today: "2027-02-30" })).toBeNull();
  });
});

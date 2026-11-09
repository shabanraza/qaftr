import { describe, expect, it } from "bun:test";
import { ZATCA_WAVES, getZatcaWaveStatus } from "./index";

const TODAY = "2026-11-08";
const base = { vatRegistered: true, notified: false, today: TODAY };

describe("ZATCA_WAVES", () => {
  it("lists waves 23, 24 and 25 with thresholds and integration deadlines", () => {
    expect(ZATCA_WAVES).toEqual([
      { wave: 23, thresholdSar: 750_000, deadline: "2026-03-31" },
      { wave: 24, thresholdSar: 375_000, deadline: "2026-06-30" },
      { wave: 25, thresholdSar: 187_500, deadline: "2027-02-01" },
    ]);
  });
});

describe("getZatcaWaveStatus", () => {
  it("puts revenue above SAR 187,500 in any year 2022-2025 into Wave 25", () => {
    const r = getZatcaWaveStatus({ ...base, revenues: { 2022: 100_000, 2024: 200_000 } });
    expect(r).toMatchObject({
      status: "due",
      wave: 25,
      deadline: "2027-02-01",
      daysRemaining: 85,
      triggeringYears: [2024],
      maxRevenue: 200_000,
      mayBeEarlierWave: false,
    });
  });

  it("treats exactly SAR 187,500 as not above the threshold", () => {
    expect(getZatcaWaveStatus({ ...base, revenues: { 2023: 187_500 } }).status).toBe(
      "below-threshold",
    );
    expect(getZatcaWaveStatus({ ...base, revenues: { 2023: 187_500.01 } }).wave).toBe(25);
  });

  it("assigns Wave 24 above SAR 375,000 and reports a passed deadline as overdue", () => {
    const r = getZatcaWaveStatus({ ...base, revenues: { 2025: 400_000 } });
    expect(r).toMatchObject({
      status: "overdue",
      wave: 24,
      deadline: "2026-06-30",
      daysRemaining: -131,
    });
  });

  it("assigns Wave 23 above SAR 750,000 and flags a possible earlier wave", () => {
    const r = getZatcaWaveStatus({ ...base, revenues: { 2022: 900_000, 2025: 500_000 } });
    expect(r).toMatchObject({
      status: "overdue",
      wave: 23,
      deadline: "2026-03-31",
      daysRemaining: -222,
      triggeringYears: [2022],
      mayBeEarlierWave: true,
    });
  });

  it("counts down to the day and reaches zero on the deadline", () => {
    const r = getZatcaWaveStatus({ ...base, today: "2027-02-01", revenues: { 2024: 300_000 } });
    expect(r).toMatchObject({ status: "due", daysRemaining: 0 });
    const after = getZatcaWaveStatus({ ...base, today: "2027-02-02", revenues: { 2024: 300_000 } });
    expect(after).toMatchObject({ status: "overdue", daysRemaining: -1 });
  });

  it("returns below-threshold when every year is at or under SAR 187,500", () => {
    const r = getZatcaWaveStatus({
      ...base,
      revenues: { 2022: 50_000, 2023: 187_500, 2024: 0, 2025: 120_000 },
    });
    expect(r).toMatchObject({ status: "below-threshold", wave: null, deadline: null, daysRemaining: null });
  });

  it("returns not-registered when the business is not VAT-registered", () => {
    const r = getZatcaWaveStatus({ ...base, vatRegistered: false, revenues: { 2024: 900_000 } });
    expect(r).toMatchObject({ status: "not-registered", wave: null });
  });

  it("returns incomplete when no valid revenue was entered", () => {
    expect(getZatcaWaveStatus({ ...base, revenues: {} }).status).toBe("incomplete");
    expect(
      getZatcaWaveStatus({ ...base, revenues: { 2024: Number.NaN, 2025: -5, 2023: null } }).status,
    ).toBe("incomplete");
  });

  it("passes the notified flag through (not being notified is not an exemption)", () => {
    const r = getZatcaWaveStatus({ ...base, notified: false, revenues: { 2024: 200_000 } });
    expect(r.notified).toBe(false);
    expect(r.status).toBe("due");
  });

  it("rejects an invalid today date", () => {
    expect(() => getZatcaWaveStatus({ ...base, today: "2026-02-30", revenues: {} })).toThrow();
  });
});

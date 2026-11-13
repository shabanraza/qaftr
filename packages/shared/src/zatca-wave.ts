/**
 * ZATCA Phase 2 (integration) wave estimator for waves 23-25.
 * Thresholds and dates as publicly announced by ZATCA; ZATCA notifies each
 * taxpayer directly, so this is an estimate — verify with ZATCA.
 */

export type ZatcaWaveNumber = 23 | 24 | 25;
export type ZatcaRevenueYear = 2022 | 2023 | 2024 | 2025;

export interface ZatcaWave {
  wave: ZatcaWaveNumber;
  /** Taxable revenue must be above this (SAR) in any year 2022-2025. */
  thresholdSar: number;
  /** Integration deadline (YYYY-MM-DD). */
  deadline: string;
}

/** Ordered from the highest threshold (earliest deadline) to the lowest. */
export const ZATCA_WAVES: readonly ZatcaWave[] = [
  { wave: 23, thresholdSar: 750_000, deadline: "2026-03-31" },
  { wave: 24, thresholdSar: 375_000, deadline: "2026-06-30" },
  { wave: 25, thresholdSar: 187_500, deadline: "2027-02-01" },
];

export const ZATCA_REVENUE_YEARS: readonly ZatcaRevenueYear[] = [2022, 2023, 2024, 2025];

export interface ZatcaWaveInput {
  vatRegistered: boolean;
  /** VAT-subject revenue per year in SAR; missing/invalid years are ignored. */
  revenues: Partial<Record<ZatcaRevenueYear, number | null>>;
  /** Whether ZATCA has notified the taxpayer (email/SMS). Informational only. */
  notified: boolean | null;
  /** Today as YYYY-MM-DD (pass the Saudi calendar day). */
  today: string;
}

export type ZatcaWaveStatusCode =
  | "not-registered"
  | "incomplete"
  | "below-threshold"
  | "due"
  | "overdue";

export interface ZatcaWaveStatus {
  status: ZatcaWaveStatusCode;
  wave: ZatcaWaveNumber | null;
  deadline: string | null;
  /** Days from today to the deadline; negative once it has passed. */
  daysRemaining: number | null;
  /** Years whose revenue is above the matched wave's threshold. */
  triggeringYears: ZatcaRevenueYear[];
  maxRevenue: number | null;
  /** Above the Wave 23 threshold: the business may have been in an earlier wave. */
  mayBeEarlierWave: boolean;
  notified: boolean | null;
}

function parseDay(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Invalid date: ${iso}`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const check = new Date(t);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    throw new Error(`Invalid date: ${iso}`);
  }
  return t / 86_400_000;
}

export function getZatcaWaveStatus(input: ZatcaWaveInput): ZatcaWaveStatus {
  const today = parseDay(input.today);
  const empty: ZatcaWaveStatus = {
    status: "incomplete",
    wave: null,
    deadline: null,
    daysRemaining: null,
    triggeringYears: [],
    maxRevenue: null,
    mayBeEarlierWave: false,
    notified: input.notified,
  };
  if (!input.vatRegistered) return { ...empty, status: "not-registered" };

  const entries = ZATCA_REVENUE_YEARS.flatMap((year) => {
    const v = input.revenues[year];
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? [{ year, v }] : [];
  });
  if (entries.length === 0) return empty;

  const maxRevenue = Math.max(...entries.map((e) => e.v));
  const match = ZATCA_WAVES.find((w) => maxRevenue > w.thresholdSar);
  if (!match) return { ...empty, status: "below-threshold", maxRevenue };

  const daysRemaining = parseDay(match.deadline) - today;
  return {
    status: daysRemaining < 0 ? "overdue" : "due",
    wave: match.wave,
    deadline: match.deadline,
    daysRemaining,
    triggeringYears: entries.filter((e) => e.v > match.thresholdSar).map((e) => e.year),
    maxRevenue,
    mayBeEarlierWave: match.wave === 23,
    notified: input.notified,
  };
}

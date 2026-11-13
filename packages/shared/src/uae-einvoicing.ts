/**
 * UAE e-invoicing timeline, per MoF/FTA guidance as publicly reported.
 * Dates are ISO calendar days (YYYY-MM-DD). Verify before relying on them.
 */
export const UAE_EINVOICING_MILESTONES = {
  pilotStart: "2026-07-01",
  largeBusinessRevenueThresholdAed: 50_000_000,
  largeBusinessGoLive: "2027-01-01",
  otherBusinessGoLive: "2027-07-01",
  governmentGoLive: "2027-10-01",
  /** Reported ASP-appointment deadline for large businesses. */
  largeBusinessAspDeadline: "2026-07-31",
  /** Some sources report this later date instead. */
  largeBusinessAspDeadlineAlternate: "2026-10-30",
} as const;

export type UaeEInvoicingPhase =
  | "large-business"
  | "other-business"
  | "government"
  | "b2c-only";

export type UaeEInvoicingStatus = "not-in-scope-yet" | "upcoming" | "overdue-mandatory";

export interface UaeEInvoicingReadinessInput {
  annualRevenueAed: number;
  isGovernmentEntity: boolean;
  sellsB2BorB2G: boolean;
  sellsOnlyB2C: boolean;
  /** A Date (its UTC calendar day is used) or a YYYY-MM-DD string. */
  today: Date | string;
}

export interface UaeAspAppointmentGuidance {
  reportedDeadline: string | null;
  alternateReportedDeadline: string | null;
  deadlinePassed: boolean;
  /** appoint-now: deadline reported/passed; plan-now: in scope, start early; monitor: not in scope yet. */
  recommendation: "appoint-now" | "plan-now" | "monitor";
}

export interface UaeEInvoicingReadiness {
  phase: UaeEInvoicingPhase;
  mandatoryDate: string | null;
  daysRemaining: number | null;
  status: UaeEInvoicingStatus;
  aspAppointment: UaeAspAppointmentGuidance;
}

const DAY_MS = 86_400_000;

/** Returns the UTC midnight timestamp for a calendar day, or null if invalid. */
function toUtcDay(value: Date | string): number | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ts = Date.UTC(year, month - 1, day);
  const check = new Date(ts);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return ts;
}

function daysBetween(fromDay: number, toDay: number): number {
  return Math.round((toDay - fromDay) / DAY_MS);
}

function resolvePhase(input: UaeEInvoicingReadinessInput): UaeEInvoicingPhase {
  if (input.isGovernmentEntity) return "government";
  if (input.sellsOnlyB2C || !input.sellsB2BorB2G) return "b2c-only";
  return input.annualRevenueAed >= UAE_EINVOICING_MILESTONES.largeBusinessRevenueThresholdAed
    ? "large-business"
    : "other-business";
}

const MANDATORY_DATES: Record<UaeEInvoicingPhase, string | null> = {
  "large-business": UAE_EINVOICING_MILESTONES.largeBusinessGoLive,
  "other-business": UAE_EINVOICING_MILESTONES.otherBusinessGoLive,
  government: UAE_EINVOICING_MILESTONES.governmentGoLive,
  "b2c-only": null,
};

function aspGuidance(phase: UaeEInvoicingPhase, today: number): UaeAspAppointmentGuidance {
  if (phase === "b2c-only") {
    return {
      reportedDeadline: null,
      alternateReportedDeadline: null,
      deadlinePassed: false,
      recommendation: "monitor",
    };
  }
  if (phase === "large-business") {
    const deadline = UAE_EINVOICING_MILESTONES.largeBusinessAspDeadline;
    return {
      reportedDeadline: deadline,
      alternateReportedDeadline: UAE_EINVOICING_MILESTONES.largeBusinessAspDeadlineAlternate,
      deadlinePassed: today > (toUtcDay(deadline) as number),
      recommendation: "appoint-now",
    };
  }
  return {
    reportedDeadline: null,
    alternateReportedDeadline: null,
    deadlinePassed: false,
    recommendation: "plan-now",
  };
}

/**
 * Works out which UAE e-invoicing phase a business falls into and how long it has.
 * Returns null for invalid input. Informational only, not tax advice.
 */
export function getUaeEInvoicingReadiness(
  input: UaeEInvoicingReadinessInput,
): UaeEInvoicingReadiness | null {
  if (!Number.isFinite(input.annualRevenueAed) || input.annualRevenueAed < 0) return null;
  const today = toUtcDay(input.today);
  if (today === null) return null;

  const phase = resolvePhase(input);
  const mandatoryDate = MANDATORY_DATES[phase];
  const aspAppointment = aspGuidance(phase, today);

  if (mandatoryDate === null) {
    return { phase, mandatoryDate, daysRemaining: null, status: "not-in-scope-yet", aspAppointment };
  }

  const remaining = daysBetween(today, toUtcDay(mandatoryDate) as number);
  return {
    phase,
    mandatoryDate,
    daysRemaining: Math.max(0, remaining),
    status: remaining > 0 ? "upcoming" : "overdue-mandatory",
    aspAppointment,
  };
}

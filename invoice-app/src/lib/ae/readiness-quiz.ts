/** The readiness quiz questions, in order. Copy that mentions the count derives it from here. */
export const READINESS_QUESTIONS = [
  'government',
  'customers',
  'revenue',
] as const

export type ReadinessQuestion = (typeof READINESS_QUESTIONS)[number]

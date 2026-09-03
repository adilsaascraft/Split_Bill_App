// /lib/date/ist.ts
//
// Centralized Asia/Kolkata date utilities. This is the ONLY place business
// date math should happen — never do naive `new Date()` / string-prefix
// comparisons anywhere else in the codebase.
//
// Strategy: timestamps are stored in MongoDB as native UTC `Date` objects
// (Mongoose default). All *business* boundaries (day/week/month/billing
// period) are computed by first expressing "now" (or any instant) in IST
// wall-clock time, then converting the IST boundary back to a UTC Date for
// storage/querying.

import {
  toZonedTime,
  fromZonedTime,
  formatInTimeZone,
} from 'date-fns-tz'
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInCalendarDays,
} from 'date-fns'

export const IST_TIMEZONE = 'Asia/Kolkata'

/** Convert any UTC Date to its IST wall-clock representation (for display/manual math). */
export function toIST(date: Date): Date {
  return toZonedTime(date, IST_TIMEZONE)
}

/** Convert an IST wall-clock Date back to the correct UTC instant. */
export function fromIST(date: Date): Date {
  return fromZonedTime(date, IST_TIMEZONE)
}

/** Format a UTC instant using an IST-local pattern (date-fns format tokens). */
export function formatIST(date: Date, pattern: string): string {
  return formatInTimeZone(date, IST_TIMEZONE, pattern)
}

/** Current instant, returned as a real UTC Date (safe to store). */
export function nowUTC(): Date {
  return new Date()
}

export type DateRange = { start: Date; end: Date }

/**
 * [00:00:00.000, 23:59:59.999] of the IST calendar day containing `at`,
 * returned as UTC instants suitable for Mongo range queries.
 */
export function getISTDayRange(at: Date = nowUTC()): DateRange {
  const istInstant = toIST(at)
  const dayStartIST = startOfDay(istInstant)
  const dayEndIST = endOfDay(istInstant)
  return {
    start: fromIST(dayStartIST),
    end: fromIST(dayEndIST),
  }
}

/**
 * Monday → Sunday IST week range (documented default per spec section 54).
 */
export function getISTWeekRange(at: Date = nowUTC()): DateRange {
  const istInstant = toIST(at)
  const weekStartIST = startOfWeek(istInstant, { weekStartsOn: 1 })
  const weekEndIST = endOfWeek(istInstant, { weekStartsOn: 1 })
  return {
    start: fromIST(weekStartIST),
    end: fromIST(weekEndIST),
  }
}

/**
 * Full IST calendar month range containing `at`. This is the canonical
 * billing-period boundary calculation — e.g. "December 2026" is exactly
 * [01-12-2026 00:00:00.000 IST, 31-12-2026 23:59:59.999 IST].
 */
export function getISTMonthRange(at: Date = nowUTC()): DateRange {
  const istInstant = toIST(at)
  const monthStartIST = startOfMonth(istInstant)
  const monthEndIST = endOfMonth(istInstant)
  return {
    start: fromIST(monthStartIST),
    end: fromIST(monthEndIST),
  }
}

/** Same as getISTMonthRange but addressed by explicit year/month (1-12), not "now". */
export function getISTMonthRangeFor(year: number, month1to12: number): DateRange {
  // Build a date that is unambiguously inside the target month at IST noon,
  // then defer to getISTMonthRange for the actual boundary math.
  const probe = fromIST(new Date(Date.UTC(year, month1to12 - 1, 15, 12, 0, 0)))
  return getISTMonthRange(probe)
}

/** yyyy-MM key for a UTC instant, in IST. Useful for grouping/period IDs. */
export function getISTMonthKey(at: Date = nowUTC()): string {
  return formatIST(at, 'yyyy-MM')
}

export function isReportAvailable(periodEnd: Date, at: Date = nowUTC()): boolean {
  return at.getTime() > periodEnd.getTime()
}

export function isWithinRange(at: Date, range: DateRange): boolean {
  return at.getTime() >= range.start.getTime() && at.getTime() <= range.end.getTime()
}

/**
 * Inclusive whole-day overlap (in IST calendar days) between a user's
 * membership window and a billing period. Used by the split engine for
 * daily-prorated participation.
 *
 * `membershipEnd` of null means "still active" (open-ended), clamped to
 * periodEnd.
 */
export function calculateParticipationDays(
  periodRange: DateRange,
  membershipStart: Date,
  membershipEnd: Date | null,
): number {
  const effectiveStart = membershipStart.getTime() > periodRange.start.getTime()
    ? membershipStart
    : periodRange.start

  const effectiveEndRaw = membershipEnd && membershipEnd.getTime() < periodRange.end.getTime()
    ? membershipEnd
    : periodRange.end

  if (effectiveStart.getTime() > effectiveEndRaw.getTime()) {
    return 0
  }

  const startIST = toIST(effectiveStart)
  const endIST = toIST(effectiveEndRaw)

  return differenceInCalendarDays(startIST, endIST) * -1 + 1
}

export function totalBillingDays(periodRange: DateRange): number {
  return differenceInCalendarDays(toIST(periodRange.end), toIST(periodRange.start)) + 1
}

/** Add N calendar days, IST-aware (for iterating day-wise reports). */
export function addISTDays(at: Date, days: number): Date {
  return fromIST(addDays(toIST(at), days))
}

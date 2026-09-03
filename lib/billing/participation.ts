// /lib/billing/participation.ts
import { UserMembership } from '@/lib/models/UserMembership'
import { calculateParticipationDays, totalBillingDays, type DateRange } from '@/lib/date/ist'
import type { Types } from 'mongoose'

export type ParticipationEntry = {
  userId: string
  days: number
}

/**
 * For every membership window (across all users) that overlaps the given
 * billing period, compute the number of IST calendar days that window
 * contributes. A user with multiple windows in the same period (left and
 * rejoined) gets their days summed.
 *
 * This intentionally reads UserMembership (the append-only history), not
 * User.status — a user who is inactive *today* may still have fully
 * participated in a past, already-closed period.
 */
export async function getParticipationForPeriod(periodRange: DateRange): Promise<ParticipationEntry[]> {
  const windows = await UserMembership.find({
    startedAt: { $lte: periodRange.end },
    $or: [{ endedAt: null }, { endedAt: { $gte: periodRange.start } }],
  }).select('userId startedAt endedAt')

  const daysByUser = new Map<string, number>()

  for (const w of windows) {
    const days = calculateParticipationDays(periodRange, w.startedAt, w.endedAt)
    if (days <= 0) continue
    const key = w.userId.toString()
    daysByUser.set(key, (daysByUser.get(key) ?? 0) + days)
  }

  return Array.from(daysByUser.entries()).map(([userId, days]) => ({ userId, days }))
}

export function getTotalPeriodDays(periodRange: DateRange): number {
  return totalBillingDays(periodRange)
}

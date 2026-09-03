// /lib/billing/period.ts
import { BillingPeriod, type IBillingPeriod } from '@/lib/models/BillingPeriod'
import { getISTMonthRange, getISTMonthKey, nowUTC } from '@/lib/date/ist'

/**
 * Returns the BillingPeriod covering `at` (defaults to now), creating it
 * if it doesn't exist yet. Idempotent — safe to call concurrently; relies
 * on the unique index on periodKey to avoid duplicate periods under a race
 * (the loser of the race just re-fetches).
 */
export async function getOrCreateBillingPeriod(at: Date = nowUTC()): Promise<IBillingPeriod> {
  const periodKey = getISTMonthKey(at)

  const existing = await BillingPeriod.findOne({ periodKey })
  if (existing) return existing

  const { start, end } = getISTMonthRange(at)

  try {
    return await BillingPeriod.create({
      periodKey,
      periodStart: start,
      periodEnd: end,
      status: 'open',
    })
  } catch (err: any) {
    // Duplicate key = another concurrent request created it first.
    if (err?.code === 11000) {
      const created = await BillingPeriod.findOne({ periodKey })
      if (created) return created
    }
    throw err
  }
}

export async function getCurrentBillingPeriod(): Promise<IBillingPeriod> {
  return getOrCreateBillingPeriod(nowUTC())
}

export function isPeriodMutable(period: Pick<IBillingPeriod, 'status'>): boolean {
  return period.status === 'open'
}

/**
 * Idempotent close: safe to invoke twice (e.g. two overlapping cron runs).
 * Only transitions 'open' -> 'closing' -> 'closed'; calling it on an
 * already-closed period is a no-op.
 */
export async function closeBillingPeriod(periodId: string): Promise<IBillingPeriod | null> {
  const period = await BillingPeriod.findById(periodId)
  if (!period) return null
  if (period.status !== 'open') return period // already closing/closed/finalized — no-op

  period.status = 'closed'
  period.closedAt = new Date()
  await period.save()
  return period
}

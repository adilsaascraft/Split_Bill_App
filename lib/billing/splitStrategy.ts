// /lib/billing/splitStrategy.ts
import { distributeProportionally, toPaise, toRupees } from '@/lib/money'
import type { ParticipationEntry } from './participation'

export type FairShareResult = {
  userId: string
  fairShareRupees: number
}

export interface SplitStrategy {
  readonly name: 'equal' | 'dailyProrated'
  /**
   * Given the total expense (rupees) for a period and each participant's
   * weight (participation days), return each participant's fair share in
   * rupees. Implementations MUST guarantee the shares sum to exactly
   * totalExpenseRupees (see lib/money.ts distributeProportionally).
   */
  computeFairShares(totalExpenseRupees: number, participation: ParticipationEntry[]): FairShareResult[]
}

/**
 * Default strategy (spec section 19): each participant's share is
 * proportional to the number of IST calendar days they participated in
 * the period, out of the sum of all participants' days.
 */
export const dailyProratedStrategy: SplitStrategy = {
  name: 'dailyProrated',
  computeFairShares(totalExpenseRupees, participation) {
    const totalPaise = toPaise(totalExpenseRupees)
    const weights = participation.map((p) => p.days)
    const sharesPaise = distributeProportionally(totalPaise, weights)
    return participation.map((p, i) => ({
      userId: p.userId,
      fairShareRupees: toRupees(sharesPaise[i]),
    }))
  },
}

/**
 * Legacy behavior: every participant with >0 participation days in the
 * period gets an identical share, regardless of how many days. Useful for
 * rooms that want simple equal splitting even with mid-month joiners.
 */
export const equalSplitStrategy: SplitStrategy = {
  name: 'equal',
  computeFairShares(totalExpenseRupees, participation) {
    const totalPaise = toPaise(totalExpenseRupees)
    const weights = participation.map(() => 1) // equal weight per participant
    const sharesPaise = distributeProportionally(totalPaise, weights)
    return participation.map((p, i) => ({
      userId: p.userId,
      fairShareRupees: toRupees(sharesPaise[i]),
    }))
  },
}

export function getSplitStrategy(name: 'equal' | 'dailyProrated'): SplitStrategy {
  return name === 'equal' ? equalSplitStrategy : dailyProratedStrategy
}

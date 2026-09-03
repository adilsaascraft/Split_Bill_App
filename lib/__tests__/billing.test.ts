// /lib/__tests__/billing.test.ts
import { describe, it, expect } from 'vitest'
import { getISTMonthRangeFor, calculateParticipationDays, totalBillingDays, fromIST } from '@/lib/date/ist'
import { dailyProratedStrategy, equalSplitStrategy } from '@/lib/billing/splitStrategy'
import { computeBalances, computeSettlementPlan, verifyReconciliation } from '@/lib/settlement/engine'
import { distributeProportionally } from '@/lib/money'

describe('IST month boundaries', () => {
  it('December 2026 spans exactly Dec 1 00:00:00.000 IST to Dec 31 23:59:59.999 IST', () => {
    const { start, end } = getISTMonthRangeFor(2026, 12)
    // IST = UTC+5:30, so Dec 1 00:00 IST = Nov 30 18:30 UTC
    expect(start.toISOString()).toBe('2026-11-30T18:30:00.000Z')
    // Dec 31 23:59:59.999 IST = Dec 31 18:29:59.999 UTC
    expect(end.toISOString()).toBe('2026-12-31T18:29:59.999Z')
  })

  it('an expense at 01-12-2026 00:01 IST belongs to December, never November', () => {
    const decRange = getISTMonthRangeFor(2026, 12)
    const novRange = getISTMonthRangeFor(2026, 11)
    // 00:01 IST on Dec 1 = 18:31 UTC on Nov 30
    const expenseInstant = new Date('2026-11-30T18:31:00.000Z')

    expect(expenseInstant.getTime()).toBeGreaterThanOrEqual(decRange.start.getTime())
    expect(expenseInstant.getTime()).toBeLessThanOrEqual(decRange.end.getTime())
    expect(expenseInstant.getTime()).toBeGreaterThan(novRange.end.getTime())
  })

  it('30 Nov 23:59 IST still belongs to November', () => {
    const novRange = getISTMonthRangeFor(2026, 11)
    // 23:59 IST Nov 30 = 18:29 UTC Nov 30
    const expenseInstant = new Date('2026-11-30T18:29:00.000Z')
    expect(expenseInstant.getTime()).toBeLessThanOrEqual(novRange.end.getTime())
    expect(expenseInstant.getTime()).toBeGreaterThanOrEqual(novRange.start.getTime())
  })

  it('December 2026 has 31 total billing days', () => {
    const range = getISTMonthRangeFor(2026, 12)
    expect(totalBillingDays(range)).toBe(31)
  })
})

describe('participation day calculation', () => {
  it('user joining Sep 1 and leaving Sep 15 participates for 15 days', () => {
    const periodRange = getISTMonthRangeFor(2026, 9)
    const joined = fromIST(new Date('2026-09-01T00:00:00'))
    const left = fromIST(new Date('2026-09-15T23:59:59.999'))
    expect(calculateParticipationDays(periodRange, joined, left)).toBe(15)
  })

  it('a full-month participant gets all 30 days in September', () => {
    const periodRange = getISTMonthRangeFor(2026, 9)
    expect(calculateParticipationDays(periodRange, periodRange.start, null)).toBe(30)
  })

  it('a user with no overlap gets 0 days', () => {
    const periodRange = getISTMonthRangeFor(2026, 9)
    const joined = fromIST(new Date('2026-10-01T00:00:00'))
    expect(calculateParticipationDays(periodRange, joined, null)).toBe(0)
  })
})

describe('distributeProportionally', () => {
  it('always sums to exactly the total, even with awkward rounding', () => {
    const total = 10000 // paise = ₹100.00
    const weights = [1, 1, 1] // 3-way split of an odd number
    const parts = distributeProportionally(total, weights)
    expect(parts.reduce((a, b) => a + b, 0)).toBe(total)
  })
})

describe('split strategies reconcile exactly', () => {
  it('dailyProrated: fair shares sum to the total expense exactly', () => {
    const participation = [
      { userId: 'a', days: 15 },
      { userId: 'b', days: 30 },
      { userId: 'c', days: 7 },
    ]
    const shares = dailyProratedStrategy.computeFairShares(999.99, participation)
    const sum = shares.reduce((s, x) => s + x.fairShareRupees, 0)
    expect(Math.round(sum * 100)).toBe(Math.round(999.99 * 100))
  })

  it('equal: every participant gets an identical share', () => {
    const participation = [
      { userId: 'a', days: 3 },
      { userId: 'b', days: 30 },
    ]
    const shares = equalSplitStrategy.computeFairShares(100, participation)
    expect(shares[0].fairShareRupees).toBe(shares[1].fairShareRupees)
  })
})

describe('settlement engine', () => {
  it('matches the worked example from the spec (A=+5000, B=0, C=-5000)', () => {
    const contributions = [
      { userId: 'A', contributionRupees: 15000 },
      { userId: 'B', contributionRupees: 10000 },
      { userId: 'C', contributionRupees: 5000 },
    ]
    const fairShares = [
      { userId: 'A', fairShareRupees: 10000 },
      { userId: 'B', fairShareRupees: 10000 },
      { userId: 'C', fairShareRupees: 10000 },
    ]
    const balances = computeBalances(contributions, fairShares)
    const plan = computeSettlementPlan(balances)

    expect(balances.find((b) => b.userId === 'A')?.balanceRupees).toBe(5000)
    expect(balances.find((b) => b.userId === 'B')?.balanceRupees).toBe(0)
    expect(balances.find((b) => b.userId === 'C')?.balanceRupees).toBe(-5000)
    expect(plan).toEqual([{ fromUserId: 'C', toUserId: 'A', amountRupees: 5000 }])
    expect(verifyReconciliation(30000, balances)).toEqual({ ok: true })
  })

  it('zero balance produces zero transactions', () => {
    const contributions = [
      { userId: 'A', contributionRupees: 50 },
      { userId: 'B', contributionRupees: 50 },
    ]
    const fairShares = [
      { userId: 'A', fairShareRupees: 50 },
      { userId: 'B', fairShareRupees: 50 },
    ]
    const balances = computeBalances(contributions, fairShares)
    expect(computeSettlementPlan(balances)).toEqual([])
  })

  it('rounding never breaks the sum(balances) === 0 invariant', () => {
    const contributions = [{ userId: 'A', contributionRupees: 100 }]
    const fairShares = [
      { userId: 'A', fairShareRupees: 33.33 },
      { userId: 'B', fairShareRupees: 33.33 },
      { userId: 'C', fairShareRupees: 33.34 },
    ]
    const balances = computeBalances(contributions, fairShares)
    const result = verifyReconciliation(100, balances)
    expect(result.ok).toBe(true)
  })
})

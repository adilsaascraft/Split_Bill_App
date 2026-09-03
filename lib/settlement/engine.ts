// /lib/settlement/engine.ts
import { toPaise, toRupees } from '@/lib/money'
import type { FairShareResult } from '@/lib/billing/splitStrategy'

export type ContributionEntry = { userId: string; contributionRupees: number }
export type BalanceEntry = {
  userId: string
  contributionRupees: number
  fairShareRupees: number
  balanceRupees: number // positive = should receive, negative = owes
}
export type SettlementTransaction = { fromUserId: string; toUserId: string; amountRupees: number }

/**
 * Balance = Contribution - FairShare (spec section 18). Computed in paise
 * throughout, converted back to rupees only at the boundary, so this never
 * drifts from floating point error.
 */
export function computeBalances(
  contributions: ContributionEntry[],
  fairShares: FairShareResult[],
): BalanceEntry[] {
  const fairShareByUser = new Map(fairShares.map((f) => [f.userId, f.fairShareRupees]))
  const contributionByUser = new Map(contributions.map((c) => [c.userId, c.contributionRupees]))

  // Union of everyone who either paid something or was a participant.
  const allUserIds = new Set([...fairShareByUser.keys(), ...contributionByUser.keys()])

  return Array.from(allUserIds).map((userId) => {
    const contributionRupees = contributionByUser.get(userId) ?? 0
    const fairShareRupees = fairShareByUser.get(userId) ?? 0
    const balancePaise = toPaise(contributionRupees) - toPaise(fairShareRupees)
    return {
      userId,
      contributionRupees,
      fairShareRupees,
      balanceRupees: toRupees(balancePaise),
    }
  })
}

/**
 * Deterministic greedy min-transaction settlement: repeatedly match the
 * largest creditor against the largest debtor. Deterministic given a
 * fixed input order (ties broken by userId string comparison so the
 * output is stable/testable).
 */
export function computeSettlementPlan(balances: BalanceEntry[]): SettlementTransaction[] {
  type Ledger = { userId: string; amountPaise: number }

  const debtors: Ledger[] = balances
    .filter((b) => b.balanceRupees < 0)
    .map((b) => ({ userId: b.userId, amountPaise: -toPaise(b.balanceRupees) }))
    .sort((a, b) => b.amountPaise - a.amountPaise || a.userId.localeCompare(b.userId))

  const creditors: Ledger[] = balances
    .filter((b) => b.balanceRupees > 0)
    .map((b) => ({ userId: b.userId, amountPaise: toPaise(b.balanceRupees) }))
    .sort((a, b) => b.amountPaise - a.amountPaise || a.userId.localeCompare(b.userId))

  const transactions: SettlementTransaction[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amountPaise = Math.min(debtor.amountPaise, creditor.amountPaise)

    if (amountPaise > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountRupees: toRupees(amountPaise),
      })
    }

    debtor.amountPaise -= amountPaise
    creditor.amountPaise -= amountPaise

    if (debtor.amountPaise === 0) i++
    if (creditor.amountPaise === 0) j++
  }

  return transactions
}

/** Reconciliation invariant checks from spec section 47. Throws detail, never silently passes a bad period. */
export function verifyReconciliation(
  totalExpenseRupees: number,
  balances: BalanceEntry[],
): { ok: true } | { ok: false; reason: string } {
  const totalContributionPaise = balances.reduce((s, b) => s + toPaise(b.contributionRupees), 0)
  const totalFairSharePaise = balances.reduce((s, b) => s + toPaise(b.fairShareRupees), 0)
  const totalBalancePaise = balances.reduce((s, b) => s + toPaise(b.balanceRupees), 0)
  const expensePaise = toPaise(totalExpenseRupees)

  if (totalContributionPaise !== expensePaise) {
    return { ok: false, reason: `sum(contributions)=${totalContributionPaise} != totalExpense=${expensePaise}` }
  }
  if (totalFairSharePaise !== expensePaise) {
    return { ok: false, reason: `sum(fairShares)=${totalFairSharePaise} != totalExpense=${expensePaise}` }
  }
  if (totalBalancePaise !== 0) {
    return { ok: false, reason: `sum(balances)=${totalBalancePaise} != 0` }
  }
  return { ok: true }
}

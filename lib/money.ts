// /lib/money.ts
//
// All amounts are handled as rupees at the API boundary (for readability)
// but every calculation converts to integer paise internally so that
// settlement totals reconcile exactly (spec section 46/47). Never do
// floating-point arithmetic directly on rupee amounts across multiple
// operations.

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function toRupees(paise: number): number {
  return Math.round(paise) / 100
}

export function sumPaise(amountsInRupees: number[]): number {
  return amountsInRupees.reduce((sum, r) => sum + toPaise(r), 0)
}

/**
 * Distributes `totalPaise` across `weights` (e.g. participation days)
 * proportionally, guaranteeing the parts sum to exactly totalPaise (the
 * largest-remainder method) — this is what keeps
 * sum(fairShares) === totalExpense exactly, even with rounding.
 */
export function distributeProportionally(totalPaise: number, weights: number[]): number[] {
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) return weights.map(() => 0)

  const raw = weights.map((w) => (totalPaise * w) / totalWeight)
  const floors = raw.map((r) => Math.floor(r))
  let remainder = totalPaise - floors.reduce((a, b) => a + b, 0)

  // Distribute the leftover paise to the entries with the largest
  // fractional remainder, so the total always matches exactly.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)

  const result = [...floors]
  for (let k = 0; k < order.length && remainder > 0; k++) {
    result[order[k].i] += 1
    remainder -= 1
  }
  return result
}

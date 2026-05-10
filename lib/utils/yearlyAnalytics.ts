export function getYearlyAnalytics(expenses: any[]) {
  const monthlyTotals: Record<string, number> = {}

  expenses.forEach((e) => {
    const month = new Date(e.date).toLocaleString('default', {
      month: 'short',
    })

    monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount
  })

  const chartData = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount,
  }))

  const totalYearExpense = expenses.reduce((sum, e) => sum + e.amount, 0)

  const highestMonth =
    Object.entries(monthlyTotals).sort((a, b) => b[1] - a[1])[0] || []

  return {
    totalYearExpense,

    highestMonth: {
      month: highestMonth[0] || '-',
      amount: highestMonth[1] || 0,
    },

    chartData,
  }
}

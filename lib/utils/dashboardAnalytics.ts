export function getDashboardAnalytics(expenses: any[]) {
  /* ================= TOTAL ================= */
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  /* ================= TOTAL ENTRIES ================= */
  const totalEntries = expenses.length

  /* ================= USER SPENDING ================= */
  const userTotals: Record<string, number> = {}

  const userEntries: Record<string, number> = {}

  expenses.forEach((e) => {
    const name = e.paidBy?.name || 'Unknown'

    userTotals[name] = (userTotals[name] || 0) + e.amount

    userEntries[name] = (userEntries[name] || 0) + 1
  })

  /* ================= TOP SPENDER ================= */
  const topSpender =
    Object.entries(userTotals).sort((a, b) => b[1] - a[1])[0] || []

  /* ================= MOST ACTIVE USER ================= */
  const mostActiveUser =
    Object.entries(userEntries).sort((a, b) => b[1] - a[1])[0] || []

  /* ================= CATEGORY DATA ================= */
  const categoryTotals: Record<string, number> = {}

  expenses.forEach((e) => {
    const category = e.category || 'Other'

    categoryTotals[category] = (categoryTotals[category] || 0) + e.amount
  })

  const pieChartData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }))

  /* ================= USER BAR DATA ================= */
  const userBarData = Object.entries(userTotals).map(([name, amount]) => ({
    name,
    amount,
  }))

  /* ================= DAILY TREND ================= */
  const dailyTotals: Record<string, number> = {}

  expenses.forEach((e) => {
    const day = new Date(e.date).toLocaleDateString()

    dailyTotals[day] = (dailyTotals[day] || 0) + e.amount
  })

  const lineChartData = Object.entries(dailyTotals).map(([date, amount]) => ({
    date,
    amount,
  }))

  return {
    totalExpenses,
    totalEntries,

    topSpender: {
      name: topSpender[0] || '-',
      amount: topSpender[1] || 0,
    },

    mostActiveUser: {
      name: mostActiveUser[0] || '-',
      count: mostActiveUser[1] || 0,
    },

    pieChartData,
    userBarData,
    lineChartData,
  }
}

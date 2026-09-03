// /app/api/expenses/route.ts
import { connectDB } from '@/lib/db'
import { Expense } from '@/lib/models/Expense'
import { getOrCreateBillingPeriod } from '@/lib/billing/period'
import { getParticipationForPeriod } from '@/lib/billing/participation'
import { getSplitStrategy } from '@/lib/billing/splitStrategy'
import { computeBalances, computeSettlementPlan, type ContributionEntry } from '@/lib/settlement/engine'
import { requireActiveUser, requireAuthUser, apiSuccess, apiError, ApiError } from '@/lib/auth/session'
import { createExpense, updateExpense, deleteExpense } from '@/lib/services/expenseService'
import { CreateExpenseSchema, UpdateExpenseSchema } from '@/schemas/expense.schema'
import { getISTMonthRangeFor } from '@/lib/date/ist'

/* =====================================================
   GET /api/expenses?year=&month=&page=&limit=&categoryId=&userId=
   Returns the expense list for a billing period PLUS the computed
   summary (contributions, fair shares, balances, settlement plan) for
   that period, using the period's configured split strategy.
===================================================== */
export async function GET(req: Request) {
  try {
    await connectDB()
    await requireAuthUser()

    const { searchParams } = new URL(req.url)
    const now = new Date()
    const year = Number(searchParams.get('year')) || now.getFullYear()
    const month = Number(searchParams.get('month')) || now.getMonth() + 1
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
    const categoryId = searchParams.get('categoryId')
    const userId = searchParams.get('userId')

    const periodRange = getISTMonthRangeFor(year, month)
    const period = await getOrCreateBillingPeriod(periodRange.start)

    const filter: Record<string, unknown> = {
      billingPeriodId: period._id,
      isDeleted: false,
    }
    if (categoryId) filter.categoryId = categoryId
    if (userId) filter.paidBy = userId

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('paidBy', 'name')
        .populate('createdBy', 'name role')
        .populate('categoryId', 'name slug icon color')
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Expense.countDocuments(filter),
    ])

    // Summary is computed over ALL of the period's expenses (not just the
    // current page) so totals/balances are always correct regardless of
    // pagination.
    const allPeriodExpenses = await Expense.find({ billingPeriodId: period._id, isDeleted: false }).select('amount paidBy')
    const totalExpense = allPeriodExpenses.reduce((sum, e) => sum + e.amount, 0)

    const contributionMap = new Map<string, number>()
    for (const e of allPeriodExpenses) {
      const id = e.paidBy.toString()
      contributionMap.set(id, (contributionMap.get(id) ?? 0) + e.amount)
    }
    const contributions: ContributionEntry[] = Array.from(contributionMap.entries()).map(
      ([userId, contributionRupees]) => ({ userId, contributionRupees }),
    )

    const participation = await getParticipationForPeriod(periodRange)
    const strategy = getSplitStrategy(period.splitStrategy)
    const fairShares = strategy.computeFairShares(totalExpense, participation)

    const balances = computeBalances(contributions, fairShares)
    const settlements = computeSettlementPlan(balances)

    return apiSuccess(
      expenses,
      undefined,
      {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
        billingPeriod: {
          id: period._id,
          periodKey: period.periodKey,
          status: period.status,
          splitStrategy: period.splitStrategy,
        },
        summary: {
          total: totalExpense,
          balances,
          settlements,
        },
      },
    )
  } catch (err) {
    return apiError(err)
  }
}

/* =====================================================
   POST /api/expenses
===================================================== */
export async function POST(req: Request) {
  try {
    await connectDB()
    const auth = await requireActiveUser()

    const body = await req.json()
    const parsed = CreateExpenseSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid expense data', 'VALIDATION_ERROR', { issues: parsed.error.issues })
    }

    const expense = await createExpense(auth, parsed.data)
    return apiSuccess(expense, 'Expense created successfully')
  } catch (err) {
    return apiError(err)
  }
}

/* =====================================================
   PATCH /api/expenses/:id-style updates via body.id (kept for
   backward compatibility with the existing frontend contract)
===================================================== */
export async function PUT(req: Request) {
  try {
    await connectDB()
    const auth = await requireActiveUser()

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) {
      throw new ApiError(400, 'Expense id is required', 'VALIDATION_ERROR')
    }

    const parsed = UpdateExpenseSchema.safeParse(rest)
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid expense data', 'VALIDATION_ERROR', { issues: parsed.error.issues })
    }

    const expense = await updateExpense(auth, id, parsed.data)
    return apiSuccess(expense, 'Expense updated successfully')
  } catch (err) {
    return apiError(err)
  }
}

/* =====================================================
   DELETE /api/expenses?id=
===================================================== */
export async function DELETE(req: Request) {
  try {
    await connectDB()
    const auth = await requireActiveUser()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      throw new ApiError(400, 'Expense id is required', 'VALIDATION_ERROR')
    }

    await deleteExpense(auth, id)
    return apiSuccess(null, 'Expense deleted successfully')
  } catch (err) {
    return apiError(err)
  }
}

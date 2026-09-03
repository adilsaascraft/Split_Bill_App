// /lib/services/expenseService.ts
import { Expense, type IExpense } from '@/lib/models/Expense'
import { BillingPeriod } from '@/lib/models/BillingPeriod'
import { getOrCreateBillingPeriod, isPeriodMutable } from '@/lib/billing/period'
import { ApiError, requireOwnerOrAdmin, type AuthTokenPayload } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/audit/log'
import { nowUTC } from '@/lib/date/ist'
import type { Types } from 'mongoose'

export type CreateExpenseInput = {
  title: string
  description?: string | null
  categoryId: string
  amount: number
  expenseDate: Date
  paidBy: string // must equal auth.userId unless admin
  paymentMethod?: string | null
  merchant?: string | null
  notes?: string | null
  tags?: string[]
}

/**
 * Creates an expense. Ownership rule (spec section 15): a normal user's
 * expense.paidBy/createdBy is ALWAYS derived from the session, never
 * trusted from the request body — a mismatched paidBy for a non-admin is
 * a 403, not a silent override.
 */
export async function createExpense(auth: AuthTokenPayload, input: CreateExpenseInput): Promise<IExpense> {
  if (auth.role !== 'admin' && input.paidBy !== auth.userId) {
    throw new ApiError(403, 'You can only add your own expense entries', 'FORBIDDEN_EXPENSE_OWNERSHIP')
  }

  // The billing period is derived from the expense date, not "now" — an
  // admin backfilling a past expense should land it in the correct period.
  const period = await getOrCreateBillingPeriod(input.expenseDate)

  if (auth.role !== 'admin' && !isPeriodMutable(period)) {
    throw new ApiError(
      403,
      'This billing period is closed and can no longer be edited',
      'BILLING_PERIOD_CLOSED',
    )
  }

  const expense = await Expense.create({
    title: input.title,
    description: input.description ?? null,
    categoryId: input.categoryId,
    amount: input.amount,
    expenseDate: input.expenseDate,
    billingPeriodId: period._id,
    paidBy: input.paidBy,
    createdBy: auth.userId,
    paymentMethod: input.paymentMethod ?? null,
    merchant: input.merchant ?? null,
    notes: input.notes ?? null,
    tags: input.tags ?? [],
  })

  await writeAuditLog({
    actor: auth,
    action: 'EXPENSE_CREATED',
    entityType: 'Expense',
    entityId: expense._id.toString(),
    newValues: { amount: expense.amount, categoryId: expense.categoryId, paidBy: expense.paidBy },
  })

  return expense
}

export type UpdateExpenseInput = Partial<Omit<CreateExpenseInput, 'paidBy'>> & { paidBy?: string }

export async function updateExpense(
  auth: AuthTokenPayload,
  expenseId: string,
  input: UpdateExpenseInput,
): Promise<IExpense> {
  const expense = await Expense.findById(expenseId)
  if (!expense || expense.isDeleted) {
    throw new ApiError(404, 'Expense not found', 'EXPENSE_NOT_FOUND')
  }

  requireOwnerOrAdmin(auth, expense.createdBy.toString())

  const period = await BillingPeriod.findById(expense.billingPeriodId)
  const periodWasClosed = period ? !isPeriodMutable(period) : false

  if (auth.role !== 'admin' && period && !isPeriodMutable(period)) {
    throw new ApiError(
      403,
      'This billing period is closed and can no longer be edited',
      'BILLING_PERIOD_CLOSED',
    )
  }

  const previousValues = {
    title: expense.title,
    amount: expense.amount,
    categoryId: expense.categoryId,
    expenseDate: expense.expenseDate,
  }

  if (input.title !== undefined) expense.title = input.title
  if (input.description !== undefined) expense.description = input.description
  if (input.categoryId !== undefined) expense.categoryId = input.categoryId as unknown as Types.ObjectId
  if (input.amount !== undefined) expense.amount = input.amount
  if (input.paymentMethod !== undefined) expense.paymentMethod = input.paymentMethod
  if (input.merchant !== undefined) expense.merchant = input.merchant
  if (input.notes !== undefined) expense.notes = input.notes
  if (input.tags !== undefined) expense.tags = input.tags
  if (input.paidBy !== undefined) {
    if (auth.role !== 'admin' && input.paidBy !== auth.userId) {
      throw new ApiError(403, 'You can only assign expenses to yourself', 'FORBIDDEN_EXPENSE_OWNERSHIP')
    }
    expense.paidBy = input.paidBy as unknown as Types.ObjectId
  }
  if (input.expenseDate !== undefined) {
    // Re-deriving the billing period on a date change keeps the record
    // consistent if an admin corrects the date across a month boundary.
    const newPeriod = await getOrCreateBillingPeriod(input.expenseDate)
    expense.expenseDate = input.expenseDate
    expense.billingPeriodId = newPeriod._id
  }

  expense.updatedBy = auth.userId as unknown as Types.ObjectId
  if (periodWasClosed) {
    expense.status = 'corrected'
  }

  await expense.save()

  if (periodWasClosed && period) {
    period.needsRecalculation = true
    await period.save()
  }

  await writeAuditLog({
    actor: auth,
    action: periodWasClosed ? 'HISTORICAL_EXPENSE_MODIFIED' : 'EXPENSE_UPDATED',
    entityType: 'Expense',
    entityId: expense._id.toString(),
    previousValues,
    newValues: { title: expense.title, amount: expense.amount, categoryId: expense.categoryId, expenseDate: expense.expenseDate },
  })

  return expense
}

export async function deleteExpense(auth: AuthTokenPayload, expenseId: string): Promise<void> {
  const expense = await Expense.findById(expenseId)
  if (!expense || expense.isDeleted) {
    throw new ApiError(404, 'Expense not found', 'EXPENSE_NOT_FOUND')
  }

  requireOwnerOrAdmin(auth, expense.createdBy.toString())

  const period = await BillingPeriod.findById(expense.billingPeriodId)
  if (auth.role !== 'admin' && period && !isPeriodMutable(period)) {
    throw new ApiError(
      403,
      'This billing period is closed and can no longer be edited',
      'BILLING_PERIOD_CLOSED',
    )
  }

  // Soft delete — historical integrity (spec section 49/50): never hard
  // delete an expense that may already be part of a finalized report.
  expense.isDeleted = true
  expense.deletedAt = nowUTC()
  expense.deletedBy = auth.userId as unknown as Types.ObjectId
  await expense.save()

  if (period && !isPeriodMutable(period)) {
    period.needsRecalculation = true
    await period.save()
  }

  await writeAuditLog({
    actor: auth,
    action: 'EXPENSE_DELETED',
    entityType: 'Expense',
    entityId: expense._id.toString(),
    previousValues: { amount: expense.amount },
  })
}

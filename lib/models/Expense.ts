// /lib/models/Expense.ts
import mongoose, { Schema, models, type Document, type Model, type Types } from 'mongoose'

export type ExpenseStatus = 'active' | 'corrected'

export interface IExpense extends Document {
  title: string
  description: string | null
  categoryId: Types.ObjectId
  amount: number // stored in rupees with paise as decimal; see lib/money.ts for safe arithmetic
  currency: string

  // The real timestamp of the expense, always stored as a UTC Date. Never
  // store/parse this as a naive string — see lib/date/ist.ts.
  expenseDate: Date

  billingPeriodId: Types.ObjectId

  paidBy: Types.ObjectId // who actually paid — drives contribution
  createdBy: Types.ObjectId // who entered it into the system — derived server-side, never client-trusted
  updatedBy: Types.ObjectId | null

  paymentMethod: string | null
  merchant: string | null
  notes: string | null
  tags: string[]

  receiptUrl: string | null
  receiptFileName: string | null
  receiptMimeType: string | null

  status: ExpenseStatus
  isDeleted: boolean
  deletedAt: Date | null
  deletedBy: Types.ObjectId | null

  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: null, maxlength: 1000 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true, min: 1, max: 1000000 },
    currency: { type: String, default: 'INR' },

    expenseDate: { type: Date, required: true },
    billingPeriodId: { type: Schema.Types.ObjectId, ref: 'BillingPeriod', required: true },

    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    paymentMethod: { type: String, default: null },
    merchant: { type: String, default: null },
    notes: { type: String, default: null, maxlength: 1000 },
    tags: { type: [String], default: [] },

    receiptUrl: { type: String, default: null },
    receiptFileName: { type: String, default: null },
    receiptMimeType: { type: String, default: null },

    status: { type: String, enum: ['active', 'corrected'], default: 'active' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
)

// Compound indexes per spec section 37 — support the query patterns the
// API actually uses (period listing, user history, category breakdowns).
ExpenseSchema.index({ billingPeriodId: 1, expenseDate: -1 })
ExpenseSchema.index({ billingPeriodId: 1, paidBy: 1 })
ExpenseSchema.index({ billingPeriodId: 1, categoryId: 1 })
ExpenseSchema.index({ paidBy: 1, expenseDate: -1 })
ExpenseSchema.index({ isDeleted: 1 })

export const Expense: Model<IExpense> =
  models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema)

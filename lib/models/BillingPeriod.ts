// /lib/models/BillingPeriod.ts
import mongoose, { Schema, models, type Document, type Model } from 'mongoose'

export type BillingPeriodStatus = 'open' | 'closing' | 'closed' | 'finalized'

export interface IBillingPeriod extends Document {
  periodKey: string // 'yyyy-MM' in IST, unique — e.g. '2026-12'
  periodStart: Date // UTC instant = 01-MM-yyyy 00:00:00.000 IST
  periodEnd: Date // UTC instant = last-day-MM-yyyy 23:59:59.999 IST
  timezone: string
  status: BillingPeriodStatus
  splitStrategy: 'equal' | 'dailyProrated'

  openedAt: Date
  closedAt: Date | null
  finalizedAt: Date | null
  reportGeneratedAt: Date | null

  settlementStatus: 'pending' | 'generated' | 'reconciled'
  totalExpense: number
  totalUsers: number
  participatingUsers: number

  needsRecalculation: boolean // set true if admin edits a closed period's expenses
  notes: string | null

  createdAt: Date
  updatedAt: Date
}

const BillingPeriodSchema = new Schema<IBillingPeriod>(
  {
    periodKey: { type: String, required: true, unique: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    status: { type: String, enum: ['open', 'closing', 'closed', 'finalized'], default: 'open' },
    splitStrategy: { type: String, enum: ['equal', 'dailyProrated'], default: 'dailyProrated' },

    openedAt: { type: Date, default: () => new Date() },
    closedAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
    reportGeneratedAt: { type: Date, default: null },

    settlementStatus: { type: String, enum: ['pending', 'generated', 'reconciled'], default: 'pending' },
    totalExpense: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    participatingUsers: { type: Number, default: 0 },

    needsRecalculation: { type: Boolean, default: false },
    notes: { type: String, default: null },
  },
  { timestamps: true },
)

BillingPeriodSchema.index({ periodStart: 1, periodEnd: 1 })
BillingPeriodSchema.index({ status: 1 })

export const BillingPeriod: Model<IBillingPeriod> =
  models.BillingPeriod || mongoose.model<IBillingPeriod>('BillingPeriod', BillingPeriodSchema)

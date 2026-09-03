// /lib/models/AuditLog.ts
import mongoose, { Schema, models, type Document, type Model, type Types } from 'mongoose'

export type AuditAction =
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_ACTIVATED' | 'USER_DEACTIVATED'
  | 'EXPENSE_CREATED' | 'EXPENSE_UPDATED' | 'EXPENSE_DELETED' | 'HISTORICAL_EXPENSE_MODIFIED'
  | 'BILLING_PERIOD_CLOSED' | 'REPORT_GENERATED' | 'SETTLEMENT_CREATED' | 'SETTLEMENT_UPDATED'
  | 'CATEGORY_CREATED' | 'CATEGORY_UPDATED'

export interface IAuditLog extends Document {
  actorId: Types.ObjectId
  actorRole: 'admin' | 'user'
  action: AuditAction
  entityType: string
  entityId: string
  previousValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorRole: { type: String, enum: ['admin', 'user'], required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    previousValues: { type: Schema.Types.Mixed, default: null },
    newValues: { type: Schema.Types.Mixed, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

AuditLogSchema.index({ entityType: 1, entityId: 1 })
AuditLogSchema.index({ actorId: 1, createdAt: -1 })
AuditLogSchema.index({ createdAt: -1 })

export const AuditLog: Model<IAuditLog> =
  models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

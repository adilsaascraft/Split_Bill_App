// /lib/models/UserMembership.ts
//
// Authoritative history of when a user was an active room participant.
// User.status/joinedAt/leftAt reflect the CURRENT window for cheap reads;
// this collection is the append-only source of truth the billing engine
// uses to compute historical participation, even after a user rejoins,
// leaves again, or is later deleted/renamed.

import mongoose, { Schema, models, type Document, type Model, type Types } from 'mongoose'

export interface IUserMembership extends Document {
  userId: Types.ObjectId
  userNameSnapshot: string
  startedAt: Date
  endedAt: Date | null // null = currently active window
  reason: 'joined' | 'reactivated' | 'left' | 'deactivated' | 'suspended' | 'admin_correction'
  createdAt: Date
  updatedAt: Date
}

const UserMembershipSchema = new Schema<IUserMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userNameSnapshot: { type: String, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    reason: {
      type: String,
      enum: ['joined', 'reactivated', 'left', 'deactivated', 'suspended', 'admin_correction'],
      required: true,
    },
  },
  { timestamps: true },
)

UserMembershipSchema.index({ userId: 1, startedAt: 1 })
UserMembershipSchema.index({ endedAt: 1 })

export const UserMembership: Model<IUserMembership> =
  models.UserMembership || mongoose.model<IUserMembership>('UserMembership', UserMembershipSchema)

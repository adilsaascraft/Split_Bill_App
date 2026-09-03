// /lib/models/User.ts
import mongoose, { Schema, models, type Document, type Model } from 'mongoose'

export type UserRole = 'admin' | 'user'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface IUser extends Document {
  username: string
  email: string
  mobile: string
  name: string
  pin: string // hashed
  role: UserRole
  status: UserStatus
  joinedAt: Date
  leftAt: Date | null
  deactivatedAt: Date | null
  reactivatedAt: Date | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    pin: { type: String, required: true }, // hashed, never returned by default
    role: { type: String, enum: ['admin', 'user'], default: 'user', required: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', required: true },

    // Membership lifecycle (section 8/20 of spec). The authoritative
    // per-window history lives in UserMembership; these fields reflect the
    // CURRENT window only, for cheap reads (e.g. "is this user active now").
    joinedAt: { type: Date, default: () => new Date() },
    leftAt: { type: Date, default: null },
    deactivatedAt: { type: Date, default: null },
    reactivatedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
)

UserSchema.index({ status: 1 })
UserSchema.index({ role: 1 })

// Enforce "exactly one admin" at the database level, not just in route
// logic. A partial unique index means at most one document can have
// role: 'admin' — any second insert/update will throw a duplicate-key
// error (E11000) that the route layer converts into a 409.
UserSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: 'admin' } },
)

export const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema)

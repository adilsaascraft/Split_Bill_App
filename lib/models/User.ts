// /lib/models/User.ts
import mongoose, { Schema, models } from 'mongoose'

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    pin: { type: String, required: true }, // hashed
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true },
)

export const User = models.User || mongoose.model('User', UserSchema)

// /lib/services/userService.ts
import bcrypt from 'bcryptjs'
import { User, type IUser, type UserRole } from '@/lib/models/User'
import { UserMembership } from '@/lib/models/UserMembership'
import { ApiError, type AuthTokenPayload } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/audit/log'
import { nowUTC } from '@/lib/date/ist'

export type CreateUserInput = {
  username: string
  email: string
  mobile: string
  name: string
  pin: string
  role?: UserRole
}

/**
 * Creates a user. The FIRST user in the system becomes admin automatically
 * (bootstrap); every subsequent creation is forced to role 'user' —
 * normal API callers can never mint a second admin, no matter what `role`
 * is passed in the body (spec sections 5/62). The DB-level partial unique
 * index on {role:'admin'} is the final backstop if this logic is ever
 * bypassed directly against the database.
 */
export async function createUser(actor: AuthTokenPayload | null, input: CreateUserInput): Promise<IUser> {
  const adminExists = await User.exists({ role: 'admin' })

  if (adminExists) {
    if (!actor) {
      throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED')
    }
    if (actor.role !== 'admin') {
      throw new ApiError(403, 'Only admin can create users', 'FORBIDDEN_NOT_ADMIN')
    }
  }

  const existing = await User.findOne({
    $or: [{ email: input.email }, { mobile: input.mobile }, { username: input.username }],
  })
  if (existing) {
    throw new ApiError(409, 'A user with this email, mobile, or username already exists', 'USER_DUPLICATE')
  }

  if (!/^\d{6}$/.test(input.pin)) {
    throw new ApiError(400, 'PIN must be 6 digits', 'VALIDATION_ERROR')
  }

  const hashedPin = await bcrypt.hash(input.pin, 12)
  // Role is NEVER taken from client input when an admin already exists —
  // it is always 'user'. Only the very first bootstrap user becomes admin.
  const finalRole: UserRole = adminExists ? 'user' : 'admin'

  const user = await User.create({
    username: input.username,
    email: input.email,
    mobile: input.mobile,
    name: input.name,
    pin: hashedPin,
    role: finalRole,
    status: 'active',
    joinedAt: nowUTC(),
  })

  await UserMembership.create({
    userId: user._id,
    userNameSnapshot: user.name,
    startedAt: user.joinedAt,
    endedAt: null,
    reason: 'joined',
  })

  if (actor) {
    await writeAuditLog({
      actor,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user._id.toString(),
      newValues: { username: user.username, role: user.role },
    })
  }

  return user
}

/**
 * Deactivates a user: closes their current open membership window and
 * records why. Historical expenses/settlements remain untouched — this
 * only affects future billing periods (spec section 9/49/50).
 */
export async function deactivateUser(actor: AuthTokenPayload, userId: string): Promise<IUser> {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
  if (user.role === 'admin') throw new ApiError(403, 'Admin cannot be deactivated', 'FORBIDDEN_ADMIN_PROTECTED')

  const at = nowUTC()
  user.status = 'inactive'
  user.leftAt = at
  user.deactivatedAt = at
  await user.save()

  await UserMembership.findOneAndUpdate(
    { userId: user._id, endedAt: null },
    { endedAt: at, reason: 'deactivated' },
  )

  await writeAuditLog({
    actor,
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: user._id.toString(),
    newValues: { status: user.status },
  })

  return user
}

/** Reactivates a user: opens a new membership window starting now. */
export async function reactivateUser(actor: AuthTokenPayload, userId: string): Promise<IUser> {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')

  const at = nowUTC()
  user.status = 'active'
  user.leftAt = null
  user.reactivatedAt = at
  await user.save()

  await UserMembership.create({
    userId: user._id,
    userNameSnapshot: user.name,
    startedAt: at,
    endedAt: null,
    reason: 'reactivated',
  })

  await writeAuditLog({
    actor,
    action: 'USER_ACTIVATED',
    entityType: 'User',
    entityId: user._id.toString(),
    newValues: { status: user.status },
  })

  return user
}

export type UpdateUserInput = Partial<{
  username: string
  email: string
  mobile: string
  name: string
  pin: string
}>

/**
 * Profile update. Role is intentionally NOT a field here — role changes
 * are not supported via this path at all (spec: normal users can never
 * become admin, and there is exactly one admin for the app's lifetime).
 */
export async function updateUser(actor: AuthTokenPayload, userId: string, input: UpdateUserInput): Promise<IUser> {
  if (actor.role !== 'admin' && actor.userId !== userId) {
    throw new ApiError(403, 'You can only update your own profile', 'FORBIDDEN_NOT_OWNER')
  }

  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')

  const previousValues = { username: user.username, email: user.email, mobile: user.mobile, name: user.name }

  if (input.username !== undefined) user.username = input.username
  if (input.email !== undefined) user.email = input.email
  if (input.mobile !== undefined) user.mobile = input.mobile
  if (input.name !== undefined) user.name = input.name
  if (input.pin !== undefined) {
    if (!/^\d{6}$/.test(input.pin)) {
      throw new ApiError(400, 'PIN must be 6 digits', 'VALIDATION_ERROR')
    }
    user.pin = await bcrypt.hash(input.pin, 12)
  }

  await user.save()

  await writeAuditLog({
    actor,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: user._id.toString(),
    previousValues,
    newValues: { username: user.username, email: user.email, mobile: user.mobile, name: user.name },
  })

  return user
}

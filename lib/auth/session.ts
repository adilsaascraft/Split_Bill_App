// /lib/auth/session.ts
//
// Single source of truth for reading the authenticated user from the
// request cookie. Every API route should call getAuthUser() from here —
// do not re-implement JWT verification locally in route files.

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db'
import { User, type UserRole } from '@/lib/models/User'

export type AuthTokenPayload = {
  userId: string
  role: UserRole
}

export class ApiError extends Error {
  status: number
  code: string
  details?: Record<string, unknown>

  constructor(status: number, message: string, code: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export function apiSuccess<T>(data: T, message?: string, extra?: Record<string, unknown>) {
  return Response.json({ success: true, message, data, ...extra })
}

export function apiError(err: unknown) {
  if (err instanceof ApiError) {
    console.error(`[API_ERROR] ${err.code}: ${err.message}`)
    return Response.json(
      { success: false, message: err.message, code: err.code, details: err.details },
      { status: err.status },
    )
  }

  console.error('[UNEXPECTED_ERROR]', err)
  return Response.json(
    { success: false, message: 'Something went wrong', code: 'INTERNAL_ERROR' },
    { status: 500 },
  )
}

/**
 * Reads and verifies the JWT from the httpOnly cookie. Returns null if
 * absent/invalid — callers that require auth should use requireAuthUser().
 */
export async function getAuthUser(): Promise<AuthTokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthTokenPayload
    return decoded
  } catch {
    return null
  }
}

export async function requireAuthUser(): Promise<AuthTokenPayload> {
  const user = await getAuthUser()
  if (!user) {
    throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED')
  }
  return user
}

export async function requireAdmin(): Promise<AuthTokenPayload> {
  const user = await requireAuthUser()
  if (user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required', 'FORBIDDEN_NOT_ADMIN')
  }
  return user
}

/**
 * Throws unless the caller is either the resource owner or an admin.
 * Never trust a client-supplied ownerId for anything other than this check.
 */
export function requireOwnerOrAdmin(auth: AuthTokenPayload, ownerId: string) {
  if (auth.role === 'admin') return
  if (auth.userId !== ownerId.toString()) {
    throw new ApiError(403, 'You do not have permission to perform this action', 'FORBIDDEN_NOT_OWNER')
  }
}

/**
 * Confirms the currently authenticated user still exists and is active.
 * Use for sensitive mutations (expense create, login) where a deactivated
 * user's still-valid JWT should not grant access.
 */
export async function requireActiveUser(): Promise<AuthTokenPayload> {
  const auth = await requireAuthUser()
  await connectDB()
  const dbUser = await User.findById(auth.userId).select('status role')
  if (!dbUser || dbUser.status !== 'active') {
    throw new ApiError(403, 'Your account is not active', 'ACCOUNT_INACTIVE')
  }
  return auth
}

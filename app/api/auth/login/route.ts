// /app/api/auth/login/route.ts
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { apiError, ApiError } from '@/lib/auth/session'
import { LoginSchema } from '@/schemas/auth.schema'
import { nowUTC } from '@/lib/date/ist'

export async function POST(req: Request) {
  try {
    await connectDB()

    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid login data', 'VALIDATION_ERROR', { issues: parsed.error.issues })
    }
    const { mobile, pin } = parsed.data

    const user = await User.findOne({ mobile })

    // Same generic message whether the user doesn't exist or the PIN is
    // wrong — avoids leaking which mobile numbers are registered.
    if (!user) {
      throw new ApiError(401, 'Invalid mobile number or PIN', 'INVALID_CREDENTIALS')
    }

    const isMatch = await bcrypt.compare(pin, user.pin)
    if (!isMatch) {
      throw new ApiError(401, 'Invalid mobile number or PIN', 'INVALID_CREDENTIALS')
    }

    if (user.status !== 'active') {
      throw new ApiError(403, 'Your account is not active. Contact the admin.', 'ACCOUNT_INACTIVE')
    }

    user.lastLoginAt = nowUTC()
    await user.save()

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    )

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return Response.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          status: user.status,
        },
      },
    })
  } catch (err) {
    return apiError(err)
  }
}

// /app/api/auth/login/route.ts

import { cookies } from 'next/headers'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    await connectDB()

    const { mobile, pin } = await req.json()

    const user = await User.findOne({ mobile })

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }

    const isMatch = await bcrypt.compare(pin, user.pin)

    if (!isMatch) {
      return Response.json(
        { success: false, message: 'Invalid PIN' },
        { status: 401 },
      )
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    )

    // ✅ FIX: await cookies()
    const cookieStore = await cookies()

    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // better practice
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return Response.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login Error:', error)

    return Response.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 },
    )
  }
}

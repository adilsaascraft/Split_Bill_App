// /app/api/auth/me/route.ts
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'

export async function GET() {
  try {
    await connectDB()

    // ✅ FIX: await cookies()
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return Response.json({ user: null })
    }

    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch {
      return Response.json({ user: null })
    }

    const user = await User.findById(decoded.userId).select('-pin')

    if (!user) {
      return Response.json({ user: null })
    }

    return Response.json({
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('ME API Error:', error)

    return Response.json({ user: null })
  }
}

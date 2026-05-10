// /app/api/users/route.ts

import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import bcrypt from 'bcryptjs'

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

/* =====================================================
   🧠 Helper: Get Auth User
===================================================== */
async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch {
    return null
  }
}

/* =====================================================
   📥 GET USERS
===================================================== */
export async function GET() {
  try {
    await connectDB()

    const decoded: any = await getAuthUser()

    if (!decoded) {
      return Response.json(
        { success: false, message: 'Only logged-in users can view users' },
        { status: 401 },
      )
    }

    const users = await User.find().select('-pin').sort({ createdAt: -1 })

    return Response.json({
      success: true,
      data: users,
    })
  } catch (error) {
    return Response.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 },
    )
  }
}

/* =====================================================
   👤 CREATE USER
===================================================== */
export async function POST(req: Request) {
  try {
    await connectDB()

    const adminExists = await User.findOne({ role: 'admin' })

    let decoded: any = null

    if (adminExists) {
      decoded = await getAuthUser()

      if (!decoded) {
        return Response.json(
          { success: false, message: 'Only admin can delete users' },
          { status: 401 },
        )
      }

      if (decoded.role !== 'admin') {
        return Response.json(
          { success: false, message: 'Only admin can update users' },
          { status: 403 },
        )
      }
    }

    const body = await req.json()
    const { username, email, mobile, name, pin, role } = body

    if (!username || !email || !mobile || !name || !pin) {
      return Response.json(
        { success: false, message: 'All fields are required' },
        { status: 400 },
      )
    }

    if (pin.length !== 6) {
      return Response.json(
        { success: false, message: 'PIN must be 6 digits' },
        { status: 400 },
      )
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }, { username }],
    })

    if (existingUser) {
      return Response.json(
        { success: false, message: 'User already exists' },
        { status: 400 },
      )
    }

    const hashedPin = await bcrypt.hash(pin, 10)

    const finalRole = adminExists ? role || 'user' : 'admin'

    const user = await User.create({
      username,
      email,
      mobile,
      name,
      pin: hashedPin,
      role: finalRole,
    })

    return Response.json({
      success: true,
      data: user,
    })
  } catch {
    return Response.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 },
    )
  }
}

/* =====================================================
   ✏️ UPDATE USER (Admin + User allowed)
===================================================== */
export async function PUT(req: Request) {
  try {
    await connectDB()

    const decoded: any = await getAuthUser()

    // 🔐 Must be logged in
    if (!decoded) {
      return Response.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      )
    }

    // 🔥 NEW: Only admin allowed
    if (decoded.role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only admin can update users' },
        { status: 403 },
      )
    }

    const body = await req.json()
    const { id, username, email, mobile, name, pin, role } = body

    const user = await User.findById(id)

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }

    // ✏️ Update fields
    if (username) user.username = username
    if (email) user.email = email
    if (mobile) user.mobile = mobile
    if (name) user.name = name
    if (role) user.role = role

    // 🔐 Handle PIN
    if (pin) {
      if (pin.length !== 6) {
        return Response.json(
          { success: false, message: 'PIN must be 6 digits' },
          { status: 400 },
        )
      }
      user.pin = await bcrypt.hash(pin, 10)
    }

    await user.save()

    return Response.json({
      success: true,
      message: 'User updated successfully',
    })
  } catch {
    return Response.json(
      { success: false, message: 'Update failed' },
      { status: 500 },
    )
  }
}

/* =====================================================
   ❌ DELETE USER (Only user, NOT admin)
===================================================== */
export async function DELETE(req: Request) {
  try {
    await connectDB()

    const decoded: any = await getAuthUser()

    if (!decoded || decoded.role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only admin can delete users' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const user = await User.findById(id)

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 },
      )
    }

    // 🚫 Prevent admin deletion
    if (user.role === 'admin') {
      return Response.json(
        { success: false, message: 'Admin cannot be deleted' },
        { status: 403 },
      )
    }

    await User.findByIdAndDelete(id)

    return Response.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch {
    return Response.json(
      { success: false, message: 'Delete failed' },
      { status: 500 },
    )
  }
}

// /app/api/users/route.ts
import { connectDB } from '@/lib/db'
import { User } from '@/lib/models/User'
import { Expense } from '@/lib/models/Expense'
import { getAuthUser, requireAdmin, apiSuccess, apiError, ApiError } from '@/lib/auth/session'
import { createUser, updateUser } from '@/lib/services/userService'
import { UserSchema } from '@/schemas/user.schema'

/* =====================================================
   GET /api/users — any authenticated user can list users
   (needed for the "paid by" picker), passwords never selected.
===================================================== */
export async function GET(req: Request) {
  try {
    await connectDB()
    const auth = await getAuthUser()
    if (!auth) {
      throw new ApiError(401, 'Only logged-in users can view users', 'UNAUTHENTICATED')
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // active | inactive | suspended

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status

    const users = await User.find(filter).select('-pin').sort({ createdAt: -1 })
    return apiSuccess(users)
  } catch (err) {
    return apiError(err)
  }
}

/* =====================================================
   POST /api/users — bootstrap creates the first admin; every
   subsequent call requires an authenticated admin (see userService
   for why `role` from the body is never trusted).
===================================================== */
export async function POST(req: Request) {
  try {
    await connectDB()
    const auth = await getAuthUser()

    const body = await req.json()
    const parsed = UserSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid user data', 'VALIDATION_ERROR', { issues: parsed.error.issues })
    }

    const user = await createUser(auth, parsed.data)
    const { pin, ...safeUser } = user.toObject()
    return apiSuccess(safeUser, 'User created successfully')
  } catch (err: any) {
    if (err?.code === 11000) {
      return apiError(new ApiError(409, 'A second admin cannot be created', 'SINGLE_ADMIN_VIOLATION'))
    }
    return apiError(err)
  }
}

/* =====================================================
   PATCH /api/users — self or admin can update profile fields.
   Role is never accepted here at all.
===================================================== */
export async function PATCH(req: Request) {
  try {
    await connectDB()
    const auth = await getAuthUser()
    if (!auth) throw new ApiError(401, 'Unauthorized', 'UNAUTHENTICATED')

    const body = await req.json()
    const { id, ...rest } = body
    if (!id) throw new ApiError(400, 'User id is required', 'VALIDATION_ERROR')

    const user = await updateUser(auth, id, rest)
    const { pin, ...safeUser } = user.toObject()
    return apiSuccess(safeUser, 'User updated successfully')
  } catch (err) {
    return apiError(err)
  }
}

/* =====================================================
   DELETE /api/users?id= — admin only. Prefer this to be used
   rarely; deactivate is the normal lifecycle path (spec section 50).
   Refuses to hard-delete a user who has any expenses on record —
   soft deactivation must be used instead to preserve history.
===================================================== */
export async function DELETE(req: Request) {
  try {
    await connectDB()
    const auth = await requireAdmin()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) throw new ApiError(400, 'User id is required', 'VALIDATION_ERROR')

    const user = await User.findById(id)
    if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND')
    if (user.role === 'admin') throw new ApiError(403, 'Admin cannot be deleted', 'FORBIDDEN_ADMIN_PROTECTED')

    const hasExpenses = await Expense.exists({ $or: [{ paidBy: id }, { createdBy: id }] })
    if (hasExpenses) {
      throw new ApiError(
        409,
        'This user has expense history and cannot be permanently deleted — deactivate them instead',
        'USER_HAS_HISTORY',
      )
    }

    await User.findByIdAndDelete(id)
    return apiSuccess(null, 'User deleted successfully')
  } catch (err) {
    return apiError(err)
  }
}

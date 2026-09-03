// /app/api/users/[id]/activate/route.ts
import { connectDB } from '@/lib/db'
import { requireAdmin, apiSuccess, apiError } from '@/lib/auth/session'
import { reactivateUser } from '@/lib/services/userService'

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const auth = await requireAdmin()
    const { id } = await params

    const user = await reactivateUser(auth, id)
    const { pin, ...safeUser } = user.toObject()
    return apiSuccess(safeUser, 'User activated successfully')
  } catch (err) {
    return apiError(err)
  }
}

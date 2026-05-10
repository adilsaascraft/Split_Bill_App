// /app/api/auth/logout/route.ts
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies() // ✅ FIX

  cookieStore.set('token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  })

  return Response.json({ success: true })
}

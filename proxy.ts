// /proxy.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function proxy(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  const { pathname } = req.nextUrl

  const isAuthPage = pathname === '/login'
  const isProtected = pathname.startsWith('/dashboard')

  // ✅ No token
  if (!token) {
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.next()
  }

  // ✅ Token exists → verify
  try {
    jwt.verify(token, process.env.JWT_SECRET!)

    // If logged in → prevent going to login again
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  } catch {
    // Invalid token → clear and redirect
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('token')
    return res
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}

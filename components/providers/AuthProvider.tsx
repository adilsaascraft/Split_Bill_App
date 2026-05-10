// /components/providers/AuthProvider.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return <>{children}</>
}

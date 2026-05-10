// /store/useAuthStore.ts
import { create } from 'zustand'

type User = {
  id: string
  name: string
  mobile: string
  role: string
}

type AuthState = {
  user: User | null
  loading: boolean

  login: (data: { mobile: string; pin: string }) => Promise<void>
  init: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  // 🔐 LOGIN
  login: async (data) => {
    try {
      set({ loading: true })

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message || 'Login failed')
      }

      // ✅ Cookie is automatically set by backend
      set({
        user: result.user,
        loading: false,
      })
    } catch (error: any) {
      set({ loading: false })
      throw error
    }
  },

  // 🔄 AUTO LOGIN (on refresh)
  init: async () => {
    try {
      const res = await fetch('/api/auth/me')

      if (!res.ok) {
        set({ user: null })
        return
      }

      const data = await res.json()

      set({ user: data.user || null })
    } catch {
      set({ user: null })
    }
  },

  // 🚪 LOGOUT
  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch {
      // ignore
    }

    set({ user: null })
  },
}))

// /app/login/page.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Building2 } from 'lucide-react'

import { LoginSchema, LoginValues } from '@/schemas/auth.schema'
import { useAuthStore } from '@/store/useAuthStore'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()

  const { login, loading } = useAuthStore()

  const [error, setError] = useState('')
  const [loadingText, setLoadingText] = useState('Logging in...')
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Disable everything while logging in or redirecting
  const isBusy = loading || isRedirecting

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginValues) => {
    try {
      setError('')

      setLoadingText('Logging in...')

      await login(data)

      // Keep UI disabled while redirecting
      setIsRedirecting(true)

      setLoadingText('Redirecting to dashboard...')

      // Give cookie time to settle
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (err: any) {
      setError(err.message)
      setIsRedirecting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-8">
      {/* Background Blur */}
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="p-0 overflow-hidden rounded-3xl border-0 bg-white/85 shadow-2xl backdrop-blur-xl">
          {/* Hero Image */}
          <div className="relative h-52 w-full overflow-hidden">
            <Image
              src="/banner.png"
              alt="Rab Residency"
              fill
              priority
              className="object-fit"
            />

            <div className="absolute inset-0 bg-black/45" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-3 rounded-full bg-white/20 p-3 backdrop-blur-md"
              >
                <Building2 className="h-7 w-7" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold tracking-tight"
              >
                Rab Residency
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-1 text-sm text-white/90"
              >
                Flat 201 Expense Tracker
              </motion.p>
            </div>
          </div>

          <CardContent className="space-y-6 p-7">
            {/* Welcome */}
            <div className="space-y-2 text-center">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-bold tracking-tight text-slate-900"
              >
                Welcome Back 👋
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-slate-500"
              >
                Login to manage room expenses, settlements & reports.
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Mobile */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-2"
              >
                <Input
                  placeholder="Enter mobile number"
                  {...form.register('mobile')}
                  disabled={isBusy}
                  className="h-11 rounded-xl"
                />

                {form.formState.errors.mobile && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.mobile.message}
                  </p>
                )}
              </motion.div>

              {/* PIN */}
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-2"
              >
                <Input
                  type="password"
                  placeholder="Enter 6-digit PIN"
                  {...form.register('pin')}
                  disabled={isBusy}
                  className="h-11 rounded-xl"
                />

                {form.formState.errors.pin && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.pin.message}
                  </p>
                )}
              </motion.div>

              {/* Error */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500"
                >
                  {error}
                </motion.p>
              )}

              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button
                  type="submit"
                  disabled={isBusy}
                  className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg"
                >
                  {isBusy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {loadingText}
                    </span>
                  ) : (
                    'Login as a Flat 201 Member'
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-center text-xs text-slate-400"
            >
              Rab Residency Members Only
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

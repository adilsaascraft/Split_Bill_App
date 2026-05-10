'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Wallet } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type Settlement = {
  from: { id: string; name: string }
  to: { id: string; name: string }
  amount: number
}

type Props = {
  settlements: Settlement[]
}

const COLORS = [
  'from-green-500 to-emerald-600',
  'from-orange-500 to-amber-500',
  'from-purple-500 to-fuchsia-600',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
]

export default function SettlementCards({ settlements }: Props) {
  if (!settlements.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
              <Wallet size={26} />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Everyone is settled up 🎉
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              No pending balances remaining
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {settlements.map((s, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -3 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-md hover:shadow-xl transition-all">
            {/* Top gradient */}
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${COLORS[index % COLORS.length]}`}
            />

            {/* Glow */}
            <div
              className={`absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${COLORS[index % COLORS.length]} opacity-10 blur-3xl`}
            />

            <CardContent className="p-4 sm:p-5">
              {/* MAIN ROW (desktop) / STACK (mobile) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* LEFT SIDE */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  {/* ICON */}
                  <div
                    className={`
                    flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center
                    rounded-xl sm:rounded-2xl text-white shadow-lg
                    bg-gradient-to-br ${COLORS[index % COLORS.length]}
                  `}
                  >
                    <Wallet size={18} className="sm:hidden" />
                    <Wallet size={22} className="hidden sm:block" />
                  </div>

                  {/* TEXT */}
                  <div className="space-y-1">
                    {/* FROM → TO */}
                    <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Payer:</span>
                        <span className="font-semibold text-red-600">
                          {s.from.name}
                        </span>
                      </div>

                      <ArrowRight size={14} className="text-gray-400" />

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Receiver:</span>
                        <span className="font-semibold text-green-600">
                          {s.to.name}
                        </span>
                      </div>
                    </div>

                    {/* DESCRIPTION */}
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="font-medium text-gray-700">
                        {s.from.name}
                      </span>{' '}
                      pays{' '}
                      <span className="font-medium text-gray-700">
                        {s.to.name}
                      </span>
                    </p>
                  </div>
                </div>

                {/* AMOUNT */}
                <div className="flex sm:block justify-between items-center">
                  <span className="text-xs text-gray-400 sm:hidden">
                    Amount
                  </span>

                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    ₹{s.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

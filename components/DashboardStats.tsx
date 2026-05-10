'use client'

import { motion } from 'framer-motion'
import { Wallet, Users, Crown, Activity, Receipt } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type Props = {
  totalExpenses: number
  perHead: number
  totalEntries: number

  topSpender: {
    name: string
    amount: number
  }

  mostActiveUser: {
    name: string
    count: number
  }
}

const COLORS = [
  'from-green-500 to-emerald-600',
  'from-orange-500 to-amber-500',
  'from-purple-500 to-fuchsia-600',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
]

export default function DashboardStats({
  totalExpenses,
  perHead,
  totalEntries,
  topSpender,
  mostActiveUser,
}: Props) {
  const stats = [
    {
      title: 'Total Expenses',
      value: `₹${totalExpenses.toFixed(2)}`,
      icon: Wallet,
    },

    {
      title: 'Per Head Expense',
      value: `₹${perHead.toFixed(2)}`,
      icon: Users,
    },

    {
      title: 'Top Spender',
      value: topSpender.name,
      sub: `₹${topSpender.amount.toFixed(2)}`,
      icon: Crown,
    },

    {
      title: 'Most Active User',
      value: mostActiveUser.name,
      sub: `${mostActiveUser.count} entries`,
      icon: Activity,
    },

    {
      title: 'Total Entries',
      value: totalEntries,
      icon: Receipt,
    },
  ]

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((s, index) => {
        const Icon = s.icon

        return (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: index * 0.08,
            }}
            whileHover={{
              y: -6,
              scale: 1.02,
            }}
            className="group"
          >
            <Card
              className="
                relative overflow-hidden border-0
                bg-white/80 backdrop-blur-xl
                shadow-lg shadow-black/5
                transition-all duration-300
                hover:shadow-2xl hover:shadow-black/10
              "
            >
              {/* Gradient Top Border */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${COLORS[index % COLORS.length]}`}
              />

              {/* Background Glow */}
              <div
                className={`
                  absolute -right-10 -top-10 h-28 w-28 rounded-full
                  bg-gradient-to-br ${COLORS[index % COLORS.length]}
                  opacity-10 blur-3xl transition-all duration-500
                  group-hover:scale-125
                `}
              />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {s.title}
                    </p>

                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                      {s.value}
                    </h2>

                    {s.sub && (
                      <p className="mt-2 text-sm text-gray-500">{s.sub}</p>
                    )}
                  </div>

                  <div
                    className={`
                      flex h-12 w-12 items-center justify-center rounded-2xl
                      bg-gradient-to-br ${COLORS[index % COLORS.length]}
                      text-white shadow-lg
                    `}
                  >
                    <Icon size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

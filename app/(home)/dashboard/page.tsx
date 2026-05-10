'use client'

import useSWR from 'swr'
import { useState } from 'react'

import ReportFilters from '@/components/ReportFilters'
import AddExpenseForm from '@/components/AddExpenseForm'
import { ExpenseTable } from '@/components/ExpenseTable'
import DashboardStats from '@/components/DashboardStats'
import DashboardCharts from '@/components/DashboardCharts'
import SettlementCards from '@/components/SettlementCards'

import { getDashboardAnalytics } from '@/lib/utils/dashboardAnalytics'
import { exportProfessionalReport } from '@/lib/utils/exportProfessionalReport'

import { useAuthStore } from '@/store/useAuthStore'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
  }).then((r) => r.json())

/* =================================================
   🔥 SKELETONS
================================================= */

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
          <Skeleton className="h-4 w-28" />

          <Skeleton className="mt-4 h-8 w-24" />

          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* PIE */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <Skeleton className="mb-5 h-5 w-40" />

        <div className="flex items-center justify-center">
          <Skeleton className="h-[260px] w-[260px] rounded-full" />
        </div>
      </div>

      {/* BAR */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <Skeleton className="mb-5 h-5 w-40" />

        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>

      {/* LINE */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
        <Skeleton className="mb-5 h-5 w-40" />

        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="space-y-4">
        {/* HEADER */}
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>

        {/* ROWS */}
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className="grid grid-cols-5 gap-4">
            {Array.from({
              length: 5,
            }).map((_, col) => (
              <Skeleton key={col} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SettlementSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
          <Skeleton className="h-5 w-32" />

          <Skeleton className="mt-4 h-4 w-48" />

          <Skeleton className="mt-2 h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

/* =================================================
   PAGE
================================================= */

export default function Dashboard() {
  const { user } = useAuthStore()

  const now = new Date()

  const [month, setMonth] = useState(String(now.getMonth() + 1))

  const [year, setYear] = useState(String(now.getFullYear()))

  const [open, setOpen] = useState(false)

  const { data, mutate, isLoading } = useSWR(
    `/api/expenses?month=${month}&year=${year}`,
    fetcher,
  )

  const expenses = data?.data || []

  const settlements = data?.summary?.settlements || []

  const analytics = getDashboardAnalytics(expenses)

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* 🔥 Header */}
      <div className="space-y-4">
        {/* Row 1 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>

            <p className="hidden text-sm text-gray-500 sm:block">
              Track expenses, analytics & settlements
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={isLoading}
            onClick={() =>
              exportProfessionalReport({
                expenses,

                summary: data?.summary,

                analytics,

                month,
                year,

                generatedBy: user?.name || 'Unknown',

                roomName: 'Rab Residency 201',
              })
            }
          >
            Export PDF
          </Button>
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <ReportFilters
              month={month}
              year={year}
              setMonth={setMonth}
              setYear={setYear}
            />
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                size="sm"
                className="shrink-0 bg-sky-800 hover:bg-sky-900"
              >
                Add Expense
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:w-[600px]">
              <SheetHeader>
                <SheetTitle>Add Expense</SheetTitle>
              </SheetHeader>

              <div className="mt-6 overflow-y-auto">
                <AddExpenseForm
                  onSave={() => {
                    mutate()

                    setOpen(false)
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 📈 Stats */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <DashboardStats
          totalExpenses={analytics.totalExpenses}
          perHead={data?.summary?.perHead || 0}
          totalEntries={analytics.totalEntries}
          topSpender={analytics.topSpender}
          mostActiveUser={analytics.mostActiveUser}
        />
      )}

      {/* 📊 Charts */}
      {isLoading ? (
        <ChartsSkeleton />
      ) : (
        <DashboardCharts
          pieChartData={analytics.pieChartData}
          userBarData={analytics.userBarData}
          lineChartData={analytics.lineChartData}
        />
      )}

      {/* 📋 Table */}
      <div className="overflow-x-auto rounded-2xl">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <ExpenseTable data={expenses} mutate={mutate} />
        )}
      </div>

      {/* 💸 Settlements */}
      <div className="mb-24 space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Settlements</h2>

        {isLoading ? (
          <SettlementSkeleton />
        ) : (
          <SettlementCards settlements={settlements} />
        )}
      </div>
    </div>
  )
}

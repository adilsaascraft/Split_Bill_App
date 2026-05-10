'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

import { Card, CardContent } from '@/components/ui/card'

type Props = {
  chartData: any[]
}

export default function YearlyReportChart({ chartData }: Props) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="font-semibold mb-4">Yearly Expense Report</h2>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

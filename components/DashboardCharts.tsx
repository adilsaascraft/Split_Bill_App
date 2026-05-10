'use client'

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'

import { Card, CardContent } from '@/components/ui/card'

type Props = {
  pieChartData: any[]
  userBarData: any[]
  lineChartData: any[]
}

const COLORS = [
  '#22C55E', // Green
  '#F97316', // Orange
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#EAB308', // Yellow
  '#14B8A6', // Teal
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#84CC16', // Lime
]

export default function DashboardCharts({
  pieChartData,
  userBarData,
  lineChartData,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ================= PIE ================= */}
      <Card id="category-chart" className="bg-white text-black">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">Expense Categories</h2>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ================= BAR ================= */}
      <Card id="user-chart" className="bg-white text-black">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">User Contribution</h2>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userBarData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="amount">
                  {userBarData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* ================= LINE ================= */}
      <Card id="trend-chart" className="lg:col-span-2 bg-white text-black">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-4">Expense Trend</h2>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={COLORS[0]} // Green
                  strokeWidth={3}
                  dot={{ fill: COLORS[1], r: 5 }} // Orange dots
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

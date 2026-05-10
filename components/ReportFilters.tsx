'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

type Props = {
  month: string
  year: string
  setMonth: (v: string) => void
  setYear: (v: string) => void
}

const months = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
]

export default function ReportFilters({
  month,
  year,
  setMonth,
  setYear,
}: Props) {
  const currentYear = new Date().getFullYear()

  const years = Array.from({ length: 5 }, (_, i) =>
    (currentYear - i).toString(),
  )

  return (
    <div className="flex flex-row items-center gap-2 w-full">
      {/* MONTH */}
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-[48%] sm:w-[200px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>

        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* YEAR */}
      <Select value={year} onValueChange={setYear}>
        <SelectTrigger className="w-[48%] sm:w-[160px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>

        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

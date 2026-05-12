'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/* ================= TYPES ================= */

type Props = {
  disabled?: boolean
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disableFuture?: boolean
}

/* ================= HELPERS ================= */

function toSafeDate(input: unknown): Date | undefined {
  if (!input) return undefined

  if (input instanceof Date && !isNaN(input.getTime())) {
    return input
  }

  const parsed = new Date(input as any)

  return isNaN(parsed.getTime()) ? undefined : parsed
}

/* ================= COMPONENT ================= */

export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'DD/MM/YYYY',
  className,
  disableFuture = false,
}: Props) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>()

  const [isOpen, setIsOpen] = React.useState(false)

  const safeValue = toSafeDate(value)

  const date = safeValue ?? internalDate

  const handleSelect = (selected: Date | undefined) => {
    if (!selected) return

    // ✅ PURE CALENDAR DATE
    // Remove time completely
    const cleanDate = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
    )

    setInternalDate(cleanDate)

    onChange?.(cleanDate)

    setIsOpen(false)
  }

  const displayValue = date ? format(date, 'dd/MM/yyyy') : placeholder

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />

          {displayValue}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={
            disableFuture
              ? (date) => {
                  const today = new Date()

                  today.setHours(0, 0, 0, 0)

                  return date > today
                }
              : undefined
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

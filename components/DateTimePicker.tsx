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
import { ScrollArea } from '@/components/ui/scroll-area'

/* ================= TYPES ================= */

type Props = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  minuteStep?: number
  placeholder?: string
  className?: string
}

/* ================= HELPERS ================= */

function toSafeDate(input: unknown): Date | undefined {
  if (!input) return undefined
  if (input instanceof Date && !isNaN(input.getTime())) return input

  const parsed = new Date(input as any)
  return isNaN(parsed.getTime()) ? undefined : parsed
}

/* ================= COMPONENT ================= */

export function DateTimePicker({
  value,
  onChange,
  minuteStep = 5,
  placeholder = 'MM/DD/YYYY HH:mm',
  className,
}: Props) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>()
  const [isOpen, setIsOpen] = React.useState(false)

  const safeValue = toSafeDate(value)
  const date = safeValue ?? internalDate

  const setDate = (newDate: Date | undefined) => {
    setInternalDate(newDate)
    onChange?.(newDate)
  }

  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])
  const minutes = React.useMemo(
    () =>
      Array.from(
        { length: Math.ceil(60 / minuteStep) },
        (_, i) => i * minuteStep,
      ),
    [minuteStep],
  )

  /* ================= LOGIC ================= */

  const updateDatePart = (selected: Date) => {
    const newDate = new Date(selected)

    // keep time if already selected
    if (date) {
      newDate.setHours(date.getHours())
      newDate.setMinutes(date.getMinutes())
    }

    setDate(newDate)
  }

  const updateTimePart = (type: 'hour' | 'minute', value: number) => {
    if (!date) return

    const newDate = new Date(date)

    if (type === 'hour') newDate.setHours(value)
    if (type === 'minute') newDate.setMinutes(value)

    setDate(newDate)

    // ✅ CLOSE AFTER TIME SELECTED (only if date exists)
    setIsOpen(false)
  }

  /* ================= SCROLL HANDLER ================= */

  const handleWheel = (e: React.WheelEvent, type: 'hour' | 'minute') => {
    e.preventDefault()

    if (!date) return

    const delta = e.deltaY > 0 ? 1 : -1
    const newDate = new Date(date)

    if (type === 'hour') {
      let h = newDate.getHours() + delta
      if (h < 0) h = 23
      if (h > 23) h = 0
      newDate.setHours(h)
    }

    if (type === 'minute') {
      let m = newDate.getMinutes() + delta * minuteStep
      if (m < 0) m = 60 - minuteStep
      if (m >= 60) m = 0
      newDate.setMinutes(m)
    }

    setDate(newDate)
  }

  /* ================= UI ================= */

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'MM/dd/yyyy HH:mm') : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          {/* CALENDAR */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && updateDatePart(d)}
            initialFocus
          />

          {/* TIME PICKER */}
          <div className="flex sm:h-[300px] divide-x">
            {/* HOURS */}
            <ScrollArea
              className="w-20"
              onWheel={(e) => handleWheel(e, 'hour')}
            >
              <div className="flex flex-col p-2 gap-1">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={date?.getHours() === hour ? 'default' : 'ghost'}
                    onClick={() => updateTimePart('hour', hour)}
                  >
                    {hour.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* MINUTES */}
            <ScrollArea
              className="w-20"
              onWheel={(e) => handleWheel(e, 'minute')}
            >
              <div className="flex flex-col p-2 gap-1">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      date?.getMinutes() === minute ? 'default' : 'ghost'
                    }
                    onClick={() => updateTimePart('minute', minute)}
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

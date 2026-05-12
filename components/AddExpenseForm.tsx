'use client'

import useSWR from 'swr'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'

import { format } from 'date-fns'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

import { category } from '@/lib/constant/static'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SheetClose } from '@/components/ui/sheet'

import { DatePicker } from '@/components/DatePicker'

import { ExpenseSchema, ExpenseInput } from '@/schemas/expense.schema'

import { useAuthStore } from '@/store/useAuthStore'

import { toast } from 'sonner'

/* ================= FETCHER ================= */

const fetcher = (url: string) =>
  fetch(url, {
    credentials: 'include',
  }).then((r) => r.json())

type Props = {
  defaultValues?: any
  onSave: (entry: any) => void
}

export default function AddExpenseForm({ defaultValues, onSave }: Props) {
  const { user } = useAuthStore()

  const { data: userRes } = useSWR('/api/users', fetcher)

  const users = userRes?.data || []

  const [loading, setLoading] = useState(false)

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(ExpenseSchema),

    defaultValues: {
      category: defaultValues?.category || 'Groceries',

      title: defaultValues?.title || '',

      amount: defaultValues?.amount || 0,

      // ✅ PURE DATE STRING
      date: defaultValues?.date || format(new Date(), 'yyyy-MM-dd'),

      paidBy: defaultValues?.paidBy || user?.id || '',
    },
  })

  /* ================= SUBMIT ================= */

  const onSubmit = async (data: ExpenseInput) => {
    try {
      setLoading(true)

      const method = defaultValues?._id ? 'PUT' : 'POST'

      const res = await fetch('/api/expenses', {
        method,

        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(
          defaultValues?._id
            ? {
                id: defaultValues._id,
                ...data,
              }
            : data,
        ),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message)
      }

      toast.success(
        defaultValues?._id
          ? 'Expense updated successfully'
          : 'Expense created successfully',
      )

      onSave?.(result.data)

      form.reset({
        category: 'Groceries',

        title: '',

        amount: null,

        // ✅ RESET PURE DATE STRING
        date: format(new Date(), 'yyyy-MM-dd'),

        paidBy: user?.id || '',
      })
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex flex-col h-screen justify-between mb-24">
      <div className="flex-1 overflow-y-auto pr-3 pl-3">
        <Form {...form}>
          <form
            id="expense-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* CATEGORY */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>

                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full p-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      {category.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TITLE */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Enter title"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AMOUNT */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>

                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={typeof field.value === 'number' ? field.value : ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DATE */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>

                  <FormControl>
                    <DatePicker
                      disabled={false}
                      disableFuture={true}
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PAID BY */}
            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid By</FormLabel>

                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select payer" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {users.map((u: any) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* FOOTER */}
      <div className="sticky bottom-0 border-t px-4 py-3 flex justify-between bg-white">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="expense-form"
          disabled={loading}
          className="bg-sky-800 hover:bg-sky-900"
        >
          {loading
            ? defaultValues?._id
              ? 'Updating...'
              : 'Creating...'
            : defaultValues?._id
              ? 'Update'
              : 'Create'}
        </Button>
      </div>
    </div>
  )
}

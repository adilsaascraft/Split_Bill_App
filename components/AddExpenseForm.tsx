'use client'

import useSWR from 'swr'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'

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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SheetClose } from '@/components/ui/sheet'

import { DatePicker } from '@/components/DatePicker'

import {
  CreateExpenseSchema,
  type CreateExpenseValues,
} from '@/schemas/expense.schema'

import { useAuthStore } from '@/store/useAuthStore'

import { toast } from 'sonner'

/* ================= TYPES ================= */

type ExpenseUser = {
  _id: string
  name?: string
  fullName?: string
  username?: string
}

type ExpenseDefaultValues = Partial<CreateExpenseValues> & {
  _id?: string
}

type Props = {
  defaultValues?: ExpenseDefaultValues
  onSave: (entry: unknown) => void
}

/* ================= FETCHER ================= */

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    credentials: 'include',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch users')
  }

  return result
}

/* ================= COMPONENT ================= */

export default function AddExpenseForm({ defaultValues, onSave }: Props) {
  const { user } = useAuthStore()

  const { data: userRes } = useSWR('/api/users', fetcher)

  const users: ExpenseUser[] = userRes?.data ?? []

  const [loading, setLoading] = useState(false)

  /* ================= FORM ================= */

  const form = useForm<CreateExpenseValues>({
    resolver: zodResolver(CreateExpenseSchema),

    defaultValues: {
      title: defaultValues?.title ?? '',

      description: defaultValues?.description ?? null,

      categoryId: defaultValues?.categoryId ?? '',

      amount: defaultValues?.amount ?? 0,

      expenseDate: defaultValues?.expenseDate
        ? new Date(defaultValues.expenseDate)
        : new Date(),

      paidBy: defaultValues?.paidBy ?? user?.id ?? '',

      paymentMethod: defaultValues?.paymentMethod ?? null,

      merchant: defaultValues?.merchant ?? null,

      notes: defaultValues?.notes ?? null,

      tags: defaultValues?.tags ?? [],
    },
  })

  /* ================= SUBMIT ================= */

  const onSubmit = async (data: CreateExpenseValues) => {
    try {
      setLoading(true)

      const isEditing = Boolean(defaultValues?._id)

      const payload = isEditing
        ? {
            id: defaultValues?._id,
            ...data,
          }
        : data

      const response = await fetch('/api/expenses', {
        method: isEditing ? 'PUT' : 'POST',

        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save expense')
      }

      toast.success(
        isEditing
          ? 'Expense updated successfully'
          : 'Expense created successfully',
      )

      onSave(result.data)

      /* ================= RESET ================= */

      form.reset({
        title: '',

        description: null,

        categoryId: '',

        amount: 0,

        expenseDate: new Date(),

        paidBy: user?.id ?? '',

        paymentMethod: null,

        merchant: null,

        notes: null,

        tags: [],
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong'

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="flex h-screen flex-col justify-between mb-24">
      <div className="flex-1 overflow-y-auto px-3 pr-3">
        <Form {...form}>
          <form
            id="expense-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* ================= TITLE ================= */}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Enter expense title"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= AMOUNT ================= */}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>

                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Enter amount"
                      value={typeof field.value === 'number' ? field.value : ''}
                      onChange={(event) => {
                        const value = event.target.value

                        field.onChange(value === '' ? '' : Number(value))
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= CATEGORY ================= */}

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>

                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {/*
                        IMPORTANT:
                        `value` must be a MongoDB ObjectId because
                        CreateExpenseSchema expects categoryId to be
                        a 24-character ObjectId.

                        Replace these with your actual category records.
                      */}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= EXPENSE DATE ================= */}

            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Date *</FormLabel>

                  <FormControl>
                    <DatePicker
                      disabled={false}
                      disableFuture
                      value={field.value}
                      onChange={(date) => {
                        field.onChange(date ?? undefined)
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= PAID BY ================= */}

            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid By</FormLabel>

                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger className="w-full p-3">
                        <SelectValue placeholder="Select payer" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {users.map((expenseUser) => (
                        <SelectItem
                          key={expenseUser._id}
                          value={expenseUser._id}
                        >
                          {expenseUser.fullName ??
                            expenseUser.name ??
                            expenseUser.username ??
                            expenseUser._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= DESCRIPTION ================= */}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Optional description"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= MERCHANT ================= */}

            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Optional merchant"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= PAYMENT METHOD ================= */}

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="e.g. Cash, UPI, Card"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ================= NOTES ================= */}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Optional notes"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* ================= FOOTER ================= */}

      <div className="sticky bottom-0 flex justify-between border-t bg-white px-4 py-3">
        <SheetClose asChild>
          <Button type="button" variant="outline" disabled={loading}>
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

// /schemas/expense.schema.ts

import { z } from 'zod'

export const ExpenseSchema = z.object({
  category: z.enum(
    [
      'Groceries',
      'WiFi',
      'Electricity',
      'Rent',
      'Cleaning',
      'Kitchen',
      'Maintenance',
      'Other',
    ],
    {
      message: 'Category is required',
    },
  ),

  title: z
    .string()
    .min(2, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters'),

  amount: z.coerce
    .number()
    .min(1, 'Amount must be greater than 0')
    .max(100000, 'Amount cannot exceed 1 lakh'),

  date: z.coerce.date({
    message: 'date time is required',
  }),

  paidBy: z.string().min(1, 'Select payer'),
})

/* 🔥 IMPORTANT:
   - input type = form type
   - output type = parsed data
*/

export type ExpenseInput = z.input<typeof ExpenseSchema>
export type ExpenseValues = z.output<typeof ExpenseSchema>

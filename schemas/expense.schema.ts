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

  // ✅ PURE CALENDAR DATE
  // Format: yyyy-MM-dd
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in yyyy-MM-dd format'),

  paidBy: z.string().min(1, 'Select payer'),
})

/* 🔥 IMPORTANT:
   - input type = form type
   - output type = parsed data
*/

export type ExpenseInput = z.input<typeof ExpenseSchema>

export type ExpenseValues = z.output<typeof ExpenseSchema>

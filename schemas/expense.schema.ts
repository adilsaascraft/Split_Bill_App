// /schemas/expense.schema.ts

import { z } from 'zod'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const CreateExpenseSchema = z.object({
  title: z
    .string()
    .min(2, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters'),

  description: z
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),

  categoryId: z.string().regex(objectIdRegex, 'Select a valid category'),

  amount: z.coerce
    .number()
    .min(1, 'Amount must be greater than 0')
    .max(1000000, 'Amount too large'),

  expenseDate: z.coerce.date({
    message: 'A valid expense date is required',
  }),

  paidBy: z.string().regex(objectIdRegex, 'Select payer'),

  paymentMethod: z
    .string()
    .max(50, 'Payment method cannot exceed 50 characters')
    .optional()
    .nullable(),

  merchant: z
    .string()
    .max(100, 'Merchant cannot exceed 100 characters')
    .optional()
    .nullable(),

  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .nullable(),

  tags: z
    .array(z.string().max(30, 'Tag cannot exceed 30 characters'))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
})

export const UpdateExpenseSchema = CreateExpenseSchema.partial()

export type CreateExpenseValues = z.infer<typeof CreateExpenseSchema>
export type UpdateExpenseValues = z.infer<typeof UpdateExpenseSchema>

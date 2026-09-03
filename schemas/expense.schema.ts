// /schemas/expense.schema.ts
import { z } from 'zod'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const CreateExpenseSchema = z.object({
  title: z.string().min(2, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(1000).optional().nullable(),
  categoryId: z.string().regex(objectIdRegex, 'Invalid category'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0').max(1000000, 'Amount too large'),
  // Accept any ISO-parseable instant; business-day bucketing happens
  // server-side via lib/date/ist.ts, never via string prefix matching.
  expenseDate: z.coerce.date({ message: 'A valid expense date is required' }),
  paidBy: z.string().regex(objectIdRegex, 'Select payer'),
  paymentMethod: z.string().max(50).optional().nullable(),
  merchant: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional(),
})

export const UpdateExpenseSchema = CreateExpenseSchema.partial()

export type CreateExpenseValues = z.infer<typeof CreateExpenseSchema>
export type UpdateExpenseValues = z.infer<typeof UpdateExpenseSchema>

// /schemas/auth.schema.ts
import { z } from 'zod'

export const LoginSchema = z.object({
  mobile: z
    .string()
    .min(10, 'Mobile must be 10 digits')
    .max(10, 'Mobile must be 10 digits'),
  pin: z.string().min(6, 'PIN must be 6 digits').max(6, 'PIN must be 6 digits'),
})

export type LoginValues = z.infer<typeof LoginSchema>

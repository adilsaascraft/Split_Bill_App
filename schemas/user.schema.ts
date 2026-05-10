// /schemas/user.schema.ts
import { z } from 'zod'

export const UserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  mobile: z.string().length(10, 'Mobile must be 10 digits'),
  name: z.string().min(2, 'Name is required'),
  pin: z.string().length(6, 'PIN must be 6 digits'),
})

export type UserValues = z.infer<typeof UserSchema>

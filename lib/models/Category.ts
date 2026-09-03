// /lib/models/Category.ts
import mongoose, { Schema, models, type Document, type Model } from 'mongoose'

export interface ICategory extends Document {
  name: string
  slug: string
  description: string | null
  icon: string | null // lucide-react icon name
  color: string | null // design-token / hex
  status: 'active' | 'archived'
  sortOrder: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: null },
    icon: { type: String, default: null },
    color: { type: String, default: null },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    sortOrder: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
)

CategorySchema.index({ status: 1, sortOrder: 1 })

export const Category: Model<ICategory> =
  models.Category || mongoose.model<ICategory>('Category', CategorySchema)

// Seed set used by the setup script / first-run migration. Not enforced as
// an enum anywhere — this is just the starting data.
export const DEFAULT_CATEGORIES = [
  'Rent', 'Electricity', 'Water', 'Internet', 'Groceries',
  'Cleaning', 'Gas', 'Maintenance', 'Household', 'Food',
  'Transportation', 'Other',
] as const

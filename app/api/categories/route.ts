// /app/api/categories/route.ts
import { connectDB } from '@/lib/db'
import { Category } from '@/lib/models/Category'
import { requireAuthUser, requireAdmin, apiSuccess, apiError, ApiError } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'

const CategoryInputSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(300).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().optional(),
})

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/* GET /api/categories — any authenticated user */
export async function GET() {
  try {
    await connectDB()
    await requireAuthUser()

    const categories = await Category.find({ status: 'active' }).sort({ sortOrder: 1, name: 1 })
    return apiSuccess(categories)
  } catch (err) {
    return apiError(err)
  }
}

/* POST /api/categories — admin only */
export async function POST(req: Request) {
  try {
    await connectDB()
    const auth = await requireAdmin()

    const body = await req.json()
    const parsed = CategoryInputSchema.safeParse(body)
    if (!parsed.success) {
      throw new ApiError(400, 'Invalid category data', 'VALIDATION_ERROR', { issues: parsed.error.issues })
    }

    const slug = slugify(parsed.data.name)
    const existing = await Category.findOne({ slug })
    if (existing) {
      throw new ApiError(409, 'A category with this name already exists', 'CATEGORY_DUPLICATE')
    }

    const category = await Category.create({ ...parsed.data, slug })

    await writeAuditLog({
      actor: auth,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category._id.toString(),
      newValues: { name: category.name },
    })

    return apiSuccess(category, 'Category created successfully')
  } catch (err) {
    return apiError(err)
  }
}

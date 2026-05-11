// /app/api/expenses/route.ts

import { connectDB } from '@/lib/db'
import { Expense } from '@/lib/models/Expense'
import { User } from '@/lib/models/User'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

/* ================= AUTH ================= */
async function getAuthUser() {
  const cookieStore = await cookies()

  const token = cookieStore.get('token')?.value

  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch {
    return null
  }
}

/* ================= BALANCE LOGIC ================= */
function calculateBalances(expenses: any[], users: any[]) {
  const spent: Record<string, number> = {}

  users.forEach((u) => {
    spent[u._id.toString()] = 0
  })

  expenses.forEach((e) => {
    const id = e.paidBy._id.toString()

    spent[id] += e.amount
  })

  const total = Object.values(spent).reduce((a, b) => a + b, 0)

  const perHead = users.length > 0 ? total / users.length : 0

  const balances: Record<string, number> = {}

  for (const userId in spent) {
    balances[userId] = spent[userId] - perHead
  }

  return balances
}

/* ================= SETTLEMENT ================= */
function settleBalances(balances: Record<string, number>) {
  const debtors: any[] = []

  const creditors: any[] = []

  for (const userId in balances) {
    const amt = balances[userId]

    if (amt < 0) {
      debtors.push({
        userId,
        amount: -amt,
      })
    }

    if (amt > 0) {
      creditors.push({
        userId,
        amount: amt,
      })
    }
  }

  const transactions: any[] = []

  let i = 0

  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]

    const c = creditors[j]

    const pay = Math.min(d.amount, c.amount)

    transactions.push({
      from: d.userId,
      to: c.userId,
      amount: pay,
    })

    d.amount -= pay

    c.amount -= pay

    if (d.amount === 0) i++

    if (c.amount === 0) j++
  }

  return transactions
}

/* =====================================================
   📥 GET
===================================================== */

export async function GET(req: Request) {
  try {
    await connectDB()

    const decoded: any = await getAuthUser()

    if (!decoded) {
      return Response.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(req.url)

    const now = new Date()

    const month = Number(searchParams.get('month')) || now.getMonth() + 1

    const year = Number(searchParams.get('year')) || now.getFullYear()

    /* =================================================
       ✅ FIXED FILTER LOGIC (UTC SAFE)
    ================================================= */
const start = new Date(year, month - 1, 1, 0, 0, 0)

const end = new Date(year, month, 1, 0, 0, 0)

    const expenses = await Expense.find({
      date: {
        $gte: start,
        $lt: end,
      },
    })
      .populate('paidBy', 'name')
      .populate('createdBy', 'name role')

      /* ✅ IMPROVED SORT */
      .sort({
        date: -1,
        createdAt: -1,
      })

    const users = await User.find().select('_id name')

    const balances = calculateBalances(expenses, users)

    const rawSettlements = settleBalances(balances)

    const settlements = rawSettlements.map((s) => {
      const fromUser = users.find((u) => u._id.toString() === s.from)

      const toUser = users.find((u) => u._id.toString() === s.to)

      return {
        from: {
          id: s.from,

          name: fromUser?.name || 'Unknown',
        },

        to: {
          id: s.to,

          name: toUser?.name || 'Unknown',
        },

        amount: Number(s.amount.toFixed(2)),
      }
    })

    return Response.json({
      success: true,

      data: expenses,

      summary: {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),

        perHead:
          expenses.length > 0
            ? expenses.reduce((sum, e) => sum + e.amount, 0) / users.length
            : 0,

        balances,

        settlements,
      },
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        success: false,
        message: 'Fetch failed',
      },
      { status: 500 },
    )
  }
}

/* =====================================================
   ➕ CREATE
===================================================== */

export async function POST(req: Request) {
  try {
    await connectDB()

    const decoded: any = await getAuthUser()

    if (!decoded) {
      return Response.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 },
      )
    }

    const body = await req.json()

    const { category, title, amount, paidBy, date } = body

    if (!category || !title || !amount || !paidBy) {
      return Response.json(
        {
          success: false,
          message: 'Missing fields',
        },
        { status: 400 },
      )
    }

    // 🔐 User can only create own expense
    if (paidBy !== decoded.userId) {
      return Response.json(
        {
          success: false,
          message: 'You can add only your own expense entry',
        },
        { status: 403 },
      )
    }

    const expenseDate = date ? new Date(date) : new Date()

    if (isNaN(expenseDate.getTime())) {
      return Response.json(
        {
          success: false,
          message: 'Invalid expense date',
        },
        { status: 400 },
      )
    }

    const expense = await Expense.create({
      category,

      title,

      amount,

      paidBy,

      createdBy: decoded.userId,

      date: expenseDate,
    })

    return Response.json(
      {
        success: true,
        data: expense,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        success: false,
        message: 'Create failed',
      },
      { status: 500 },
    )
  }
}

/* =====================================================
   ✏️ UPDATE
===================================================== */

export async function PUT(req: Request) {
  try {
    await connectDB()

    const decoded: any = await getAuthUser()

    if (!decoded) {
      return Response.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 },
      )
    }

    const body = await req.json()

    const { id, category, title, amount, paidBy, date } = body

    const expense = await Expense.findById(id)

    if (!expense) {
      return Response.json(
        {
          success: false,
          message: 'Expense not found',
        },
        { status: 404 },
      )
    }

    // 🔐 owner or admin
    if (
      expense.createdBy.toString() !== decoded.userId &&
      decoded.role !== 'admin'
    ) {
      return Response.json(
        {
          success: false,
          message: 'You can only edit your own expense entry',
        },
        { status: 403 },
      )
    }

    expense.category = category

    expense.title = title

    expense.amount = amount

    expense.paidBy = paidBy

    if (date) {
      const updatedDate = new Date(date)

      if (isNaN(updatedDate.getTime())) {
        return Response.json(
          {
            success: false,
            message: 'Invalid expense date',
          },
          { status: 400 },
        )
      }

      expense.date = updatedDate
    }

    await expense.save()

    return Response.json({
      success: true,
      data: expense,
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        success: false,
        message: 'Update failed',
      },
      { status: 500 },
    )
  }
}

/* =====================================================
   ❌ DELETE
===================================================== */

export async function DELETE(req: Request) {
  try {
    await connectDB()

    const decoded: any = await getAuthUser()

    if (!decoded) {
      return Response.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(req.url)

    const id = searchParams.get('id')

    const expense = await Expense.findById(id)

    if (!expense) {
      return Response.json(
        {
          success: false,
          message: 'Expense not found',
        },
        { status: 404 },
      )
    }

    // 🔐 owner or admin
    if (
      expense.createdBy.toString() !== decoded.userId &&
      decoded.role !== 'admin'
    ) {
      return Response.json(
        {
          success: false,
          message: 'You can only delete your own expense entry',
        },
        { status: 403 },
      )
    }

    await Expense.findByIdAndDelete(id)

    return Response.json({
      success: true,
      message: 'Expense deleted successfully',
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      {
        success: false,
        message: 'Delete failed',
      },
      { status: 500 },
    )
  }
}

// /components/ExpenseTable.tsx
'use client'

import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2, Loader2, Shield, Lock } from 'lucide-react'

import { DataTable } from '@/components/DataTable'

import { Button } from '@/components/ui/button'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import AddExpenseForm from './AddExpenseForm'

import { toast } from 'sonner'

import { useAuthStore } from '@/store/useAuthStore'

type Props = {
  data: any[]
  mutate: () => void
}

export function ExpenseTable({ data, mutate }: Props) {
  const { user } = useAuthStore()

  const [open, setOpen] = useState(false)

  const [selectedExpense, setSelectedExpense] = useState<any>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)

  const [deleteLoading, setDeleteLoading] = useState(false)

  /* =================================================
     FILTERS
  ================================================= */

  const [paidByFilter, setPaidByFilter] = useState('all')

  /* =================================================
     UNIQUE USERS
  ================================================= */

  const paidByUsers = useMemo(() => {
    const map = new Map()

    data.forEach((expense) => {
      const user = expense.paidBy

      if (user?._id) {
        map.set(user._id, user)
      }
    })

    return Array.from(map.values())
  }, [data])

  /* =================================================
     FILTERED DATA
  ================================================= */

  const filteredData =
    paidByFilter === 'all'
      ? data
      : data.filter((expense) => expense.paidBy?._id === paidByFilter)

  /* =================================================
     TOTAL PAID
  ================================================= */

  const totalPaid = filteredData.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  )

  /* =================================================
     DELETE
  ================================================= */

  const handleDelete = async () => {
    try {
      setDeleteLoading(true)

      const res = await fetch(`/api/expenses?id=${selectedExpense._id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.message)
      }

      toast.success(result.message || 'Expense deleted successfully')

      mutate()

      setDeleteOpen(false)

      setSelectedExpense(null)
    } catch (err: any) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* =================================================
     TABLE COLUMNS
  ================================================= */

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'category',

      header: 'Category',
    },

    {
      accessorKey: 'title',

      header: 'Title',
    },

    {
      accessorKey: 'amount',

      header: 'Amount',

      cell: ({ row }) => (
        <span className="font-medium">₹{row.original.amount}</span>
      ),
    },

    {
      accessorKey: 'date',

      header: 'Date',

      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },

    {
      accessorKey: 'createdBy',

      header: 'Paid By',

      cell: ({ row }) => {
        const isAdmin = row.original.createdBy?.role === 'admin'

        return (
          <div className="flex items-center gap-2">
            <span>{row.original.createdBy?.name}</span>

            {isAdmin && <Shield className="h-4 w-4 text-green-600" />}
          </div>
        )
      },
    },

    /* =================================================
       ACTIONS
    ================================================= */

    {
      id: 'actions',

      header: 'Actions',

      cell: ({ row }) => {
        const expense = row.original

        const createdById =
          typeof expense.createdBy === 'object'
            ? expense.createdBy._id
            : expense.createdBy

        const isOwner = createdById === user?.id

        const isAdmin = user?.role === 'admin'

        const hasAccess = isOwner || isAdmin

        /* 🔐 NO ACCESS */

        if (!hasAccess) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              No Access
            </div>
          )
        }

        return (
          <div className="flex items-center gap-2">
            {/* ✏️ EDIT */}

            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setSelectedExpense(expense)

                setOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* ❌ DELETE */}

            <Button
              size="icon"
              variant="destructive"
              onClick={() => {
                setSelectedExpense(expense)

                setDeleteOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  /* =================================================
     UI
  ================================================= */

  return (
    <>
      <div className="space-y-4">
        {/* 🔥 FILTER CARD */}

        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          {/* LEFT */}

          <div>
            <p className="text-sm font-medium text-muted-foreground">Paid By</p>

            <Select value={paidByFilter} onValueChange={setPaidByFilter}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Filter User" />
              </SelectTrigger>

              <SelectContent>
                {/* ALL */}

                <SelectItem value="all">All Users</SelectItem>

                {/* USERS */}

                {paidByUsers.map((user: any) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* RIGHT */}

          <div className="rounded-xl bg-sky-50 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Total Paid
            </p>

            <h2 className="text-2xl font-bold text-sky-900">
              ₹{totalPaid.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* 📋 TABLE */}

        <DataTable columns={columns} data={filteredData} />
      </div>

      {/* =================================================
         EDIT SHEET
      ================================================= */}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Edit Expense</SheetTitle>
          </SheetHeader>

          <div className="mt-6 h-[calc(100vh-80px)] overflow-y-auto">
            <AddExpenseForm
              defaultValues={{
                ...selectedExpense,

                paidBy: selectedExpense?.paidBy?._id,
              }}
              onSave={() => {
                mutate()

                setOpen(false)

                setSelectedExpense(null)
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* =================================================
         DELETE DIALOG
      ================================================= */}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. This expense entry will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction disabled={deleteLoading} onClick={handleDelete}>
              {deleteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

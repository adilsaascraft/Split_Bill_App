'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import AddUserForm from '@/components/AddUserForm'
import { DataTable } from '@/components/DataTable'
import { ColumnDef } from '@tanstack/react-table'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json())

export default function UsersPage() {
  const { data, isLoading, mutate } = useSWR('/api/users', fetcher)

  const users = data?.data || []

  const [open, setOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)

  const [deleteUser, setDeleteUser] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    try {
      setDeleteLoading(true)

      const res = await fetch(`/api/users?id=${deleteUser._id}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.message)

      toast.success('User deleted')
      mutate()
      setDeleteUser(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span
          className={
            row.original.role === 'admin'
              ? 'text-green-600 font-medium'
              : 'text-gray-600'
          }
        >
          {row.original.role}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original

        return (
          <div className="flex gap-2">
            {/* ✏️ Edit */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditUser(user)
                setOpen(true)
              }}
            >
              Edit
            </Button>

            {/* ❌ Delete */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteUser(user)}
              disabled={user.role === 'admin'} // prevent admin delete
            >
              Delete
            </Button>
          </div>
        )
      },
    },
  ]


  function UsersTableSkeleton() {
    return (
      <div className="rounded-2xl border bg-white shadow-sm">
        {/* HEADER */}
        <div className="border-b p-4">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="grid grid-cols-5 gap-4">
              {/* NAME */}
              <Skeleton className="h-10 w-full rounded-lg" />

              {/* MOBILE */}
              <Skeleton className="h-10 w-full rounded-lg" />

              {/* EMAIL */}
              <Skeleton className="h-10 w-full rounded-lg" />

              {/* ROLE */}
              <Skeleton className="h-10 w-full rounded-lg" />

              {/* ACTIONS */}
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20 rounded-lg" />

                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 🔥 Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">All Users ({users.length})</h1>

        {/* ➕ Add User */}
        <Sheet
          open={open}
          onOpenChange={(val) => {
            setOpen(val)
            if (!val) setEditUser(null)
          }}
        >
          <SheetTrigger asChild>
            <Button className="bg-sky-800 hover:bg-sky-900">Add User</Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[400px] sm:w-[500px]">
            <SheetHeader>
              <SheetTitle>{editUser ? 'Edit User' : 'Add User'}</SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <AddUserForm
                defaultValues={editUser}
                onSuccess={() => {
                  mutate()
                  setOpen(false)
                  setEditUser(null)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 📊 Table */}
      {isLoading ? (
        <UsersTableSkeleton />
      ) : (
        <DataTable columns={columns} data={users} />
      )}

      {/* ⚠️ DELETE CONFIRMATION */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this user?
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className='bg-red-600 hover:bg-red-700'>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

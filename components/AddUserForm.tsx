'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserSchema, UserValues } from '@/schemas/user.schema'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'

type Props = {
  onSuccess?: () => void
  defaultValues?: any
}

export default function AddUserForm({ onSuccess, defaultValues }: Props) {
  const [loading, setLoading] = useState(false)

  const isEdit = !!defaultValues?._id

  const form = useForm<UserValues>({
    resolver: zodResolver(UserSchema),

    defaultValues: {
      username: '',
      email: '',
      mobile: '',
      name: '',
      pin: '',
    },
  })

  /* 🔥 Sync edit values */
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        username: defaultValues.username || '',
        email: defaultValues.email || '',
        mobile: defaultValues.mobile || '',
        name: defaultValues.name || '',
        pin: '',
      })
    }
  }, [defaultValues, form])

  /* ================= SUBMIT ================= */
  const onSubmit = async (data: UserValues) => {
    try {
      setLoading(true)

      const res = await fetch('/api/users', {
        method: isEdit ? 'PUT' : 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(
          isEdit
            ? {
                id: defaultValues._id,
                ...data,
              }
            : data,
        ),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.message)

      toast.success(
        isEdit ? 'User updated successfully' : 'User created successfully',
      )

      form.reset()

      onSuccess?.()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */
  return (
    <div className="flex h-screen flex-col justify-between">
      {/* ================= FORM BODY ================= */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <Form {...form}>
          <form
            id="user-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            {/* NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>

                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* USERNAME */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>

                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EMAIL */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>

                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* MOBILE */}
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>

                  <FormControl>
                    <Input placeholder="Enter mobile number" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PIN */}
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN</FormLabel>

                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        isEdit
                          ? 'Leave blank to keep existing PIN'
                          : 'Enter 6-digit PIN'
                      }
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* ================= FOOTER ================= */}
      <div className="sticky bottom-0 flex items-center justify-between border-t bg-white px-4 py-3">
        <SheetClose asChild>
          <Button variant="outline" disabled={loading}>
            Close
          </Button>
        </SheetClose>

        <Button
          type="submit"
          form="user-form"
          disabled={loading}
          className="bg-sky-800 hover:bg-sky-900"
        >
          {loading
            ? isEdit
              ? 'Updating...'
              : 'Creating...'
            : isEdit
              ? 'Update User'
              : 'Create User'}
        </Button>
      </div>
    </div>
  )
}

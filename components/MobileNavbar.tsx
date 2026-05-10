'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { memo, useState } from 'react'
import clsx from 'clsx'

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
} from '@/components/ui/navigation-menu'

import { Button } from '@/components/ui/button'

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

import { useAuthStore } from '@/store/useAuthStore'

import { NAV_ITEMS } from '@/config/navigation'

function MobileNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  const { logout } = useAuthStore()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isActive = (href?: string) => href && pathname === href

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      await logout()

      setLogoutDialogOpen(false)

      router.replace('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="w-full border-b bg-white shadow-sm dark:bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        {/* ================= NAV ITEMS ================= */}
        <NavigationMenu className="mx-auto">
          <NavigationMenuList className="flex items-center justify-center gap-6">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon

              return (
                <NavigationMenuItem key={item.name}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'relative flex items-center gap-2 px-1 py-2 text-sm font-semibold transition-colors',
                      active
                        ? 'text-sky-700 dark:text-sky-400'
                        : 'text-gray-500 hover:text-sky-600',
                    )}
                  >
                    <Icon size={18} />

                    {item.name}

                    <span
                      className={clsx(
                        'absolute bottom-0 left-0 h-[2px] w-full origin-left bg-sky-600 transition-transform duration-300',
                        active ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </Link>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* ================= LOGOUT ================= */}
        <AlertDialog
          open={logoutDialogOpen}
          onOpenChange={(value) => {
            if (isLoggingOut) return
            setLogoutDialogOpen(value)
          }}
        >
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setLogoutDialogOpen(true)}
            disabled={isLoggingOut}
            className="ml-4"
          >
            {isLoggingOut ? 'Logout...' : 'Logout'}
          </Button>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to logout?
              </AlertDialogTitle>

              <AlertDialogDescription>
                Your session will end and you will be redirected to login.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoggingOut}>
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleLogout()
                }}
                disabled={isLoggingOut}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoggingOut ? 'Logout...' : 'Confirm Logout'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export default memo(MobileNavbar)

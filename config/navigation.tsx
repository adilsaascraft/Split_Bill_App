import { LayoutDashboard, Users } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  name: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Users', href: '/users', icon: Users },
]

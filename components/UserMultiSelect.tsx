// /components/UserMultiSelect.tsx
'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Command, CommandItem, CommandGroup } from '@/components/ui/command'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

export function UserMultiSelect({ users, value, onChange }: any) {
  const [open, setOpen] = useState(false)

  const toggleUser = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v: string) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Select Users ({value.length})
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command>
          <CommandGroup>
            {users.map((user: any) => (
              <CommandItem key={user._id} onSelect={() => toggleUser(user._id)}>
                {user.name}
                {value.includes(user._id) && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

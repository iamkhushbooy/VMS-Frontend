"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  return twMerge(inputs)
}

interface ReusableComboboxProps {
  options: any[]
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  displayField?: string
  isLoading?: boolean
}

export const ReusableCombobox = React.forwardRef<HTMLButtonElement, ReusableComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder,
      searchPlaceholder,
      displayField = "name",
      isLoading,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false)

    const getDisplayValue = (val: string) => {
      const item = options.find((o: any) => o.name === val)
      return item ? item[displayField] || item.name : placeholder
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={isLoading}
            className="w-full justify-between bg-white border-gray-200"
          >
            <span className="truncate">{value ? getDisplayValue(value) : placeholder}</span>
            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((o: any) => (
                  <CommandItem
                    key={o.name}
                    value={o[displayField] || o.name}
                    onSelect={() => {
                      onValueChange(o.name)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === o.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {o[displayField] || o.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

ReusableCombobox.displayName = "ReusableCombobox"

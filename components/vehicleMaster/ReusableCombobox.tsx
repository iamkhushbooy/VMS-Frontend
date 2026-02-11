"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { cn } from "./FormLayout"
import { Check, ChevronsUpDown, Calendar as CalendarIcon } from "lucide-react"

interface ReusableComboboxProps {
  options: any[]
  value: string
  onValueChange: (val: string) => void
  placeholder: string
  searchPlaceholder?: string
  displayField?: string
  isLoading?: boolean
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const ReusableCombobox = React.forwardRef<HTMLButtonElement, ReusableComboboxProps>(
  (props, ref) => {
    const {
      options = [],
      value,
      onValueChange,
      placeholder,
      searchPlaceholder,
      displayField = "name",
      isLoading = false,
      icon: Icon
    } = props

    const [open, setOpen] = useState(false)

    const getDisplayValue = (val: string) => {
      const selected = options.find((o: any) => o.name === val)
      if (!selected) return placeholder
      return selected[displayField] || selected.name
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-background text-left font-normal transition-colors h-10",
              !value && "text-muted-foreground"
            )}
            disabled={isLoading}
            ref={ref}
          >
            <div className="flex items-center gap-2 truncate">
              {Icon && <Icon className="w-4 h-4 text-muted-foreground/70" />}
              <span className="truncate">{value ? getDisplayValue(value) : placeholder}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList
              className=" overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}>

              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option: any) => (
                  <CommandItem
                    key={option.name}
                    value={(option[displayField] || option.name)}
                    onSelect={(currentValue) => {
                      const selected = options.find(
                        (opt: any) =>
                          (opt[displayField] || opt.name).toLowerCase() ===
                          currentValue.toLowerCase()
                      )
                      const newValue = selected ? selected.name : ""
                      onValueChange(newValue === value ? "" : newValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option[displayField] || option.name}
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

export default ReusableCombobox
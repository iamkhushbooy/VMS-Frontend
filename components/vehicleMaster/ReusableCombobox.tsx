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
import { Check, ChevronsUpDown, Calendar as CalendarIcon } from "lucide-react" // Added CalendarIcon
import { format, parseISO } from "date-fns" // Required for date formatting
import { Calendar } from "@/components/ui/calendar" // Required for the picker

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
              "w-full justify-between bg-background text-left font-normal hover:bg-accent/50 transition-colors h-10",
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
            <CommandList>
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

interface DatePickerFieldProps {
  value: string
  onChange: (val: string) => void
  placeholder: string
  min?: string
}

export const DatePickerField = ({ value, onChange, placeholder, min }: DatePickerFieldProps) => {
  const date = value ? parseISO(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal pl-9 h-10 bg-background relative",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="w-4 h-4 absolute left-3 text-muted-foreground" />
          {/* Display format: DD/MM/YYYY */}
          {value ? format(date!, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          // Validation logic: 1900 se pehle aur 2100 ke baad ki dates disable
          disabled={(d) => 
            (min ? d < new Date(min) : false) || 
            d.getFullYear() > 2100 || 
            d.getFullYear() < 1900
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
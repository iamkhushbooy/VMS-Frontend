// components/ui/reusable-combobox.tsx

"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Interface for Frappe-like options
interface ComboboxOption {
  name: string; // Frappe's ID field
  [key: string]: any; // Allow other properties
}

interface ReusableComboboxProps {
  options: ComboboxOption[];
  value: string; // The selected 'name' (ID)
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  displayField?: string; // The field to display (e.g., "registration_no")
  isLoading?: boolean;
}

export function ReusableCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  displayField = "name",
  isLoading = false,
}: ReusableComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Find the currently selected option object to display its name
  const selectedOption = options.find((option) => option.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between mt-1 bg-input"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            // Display the correct field of the selected option
            selectedOption ? selectedOption[displayField] || selectedOption.name : placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ minWidth: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.name}
                  value={option[displayField] || option.name} // This is what the search filters on
                  onSelect={() => {
                    onValueChange(option.name) // This sets the value to the 'name' (ID)
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
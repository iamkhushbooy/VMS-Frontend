"use client"
import React, { useState } from "react"
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
import { Check, ChevronsUpDown } from "lucide-react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// --- Utilities ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Constants ---
export const FRAPPE_BASE_URL = "http://localhost:8000"
export const MAINTENANCE_DOCTYPE = "Vehicle Log Master"
export const VEHICLE_DOCTYPE = "Vehicle"
export const EMPLOYEE_DOCTYPE = "Employee"
export const ITEM_DOCTYPE = "Item"

export const priorityOptions = [
  { name: "Low" },
  { name: "Medium" },
  { name: "High" },
]

export const statusOptions = [
  { name: "Open" },
  { name: "In Progress" },
  { name: "Completed" },
  { name: "Hold" },
]
export const seriesOptions = [
  { name: "HR-VLOG-.YYYY.-" },
]
export const jobCardTypeOptions = [
  { name: "Scheduled Maintenance" },
  { name: "Breakdown" },
  { name: "Preventive Maintenance" },
  { name: "Running Repair" },
  { name: "Major Repair" },
  { name: "PMI / Inspections" },
  { name: "Modification/Upgrades" },
  { name: "Accident Damage" },
]

export const jsaOptions = [
  { name: "Done" },
  { name: "Not Done" },
]

export const housekeepingOptions = [
  { name: "Yes" },
  { name: "No" },
]

// --- Interfaces ---
export interface FrappeDoc {
  name: string
  [key: string]: any
}

export interface VehicleDoc extends FrappeDoc {
  make?: string
  model?: string
  current_odometer?: number
}

export interface ItemDoc extends FrappeDoc {
  item_name?: string
  item_group?: string
  stock_uom?: string
  standard_rate?: number
  total_projected_qty?: number
}
export interface ProblemEntry {
  id: string
  problem_detail: string
}
export interface WorkDoneEntry {
  id: string
  work_done_detail: string
}
export interface PendingJobEntry {
  id: string
  pending_job_detail: string
}

export interface PartEntry {
  id: string
  item_name: string
  item_display?: string
  item_group?: string
  uom?: string
  stock_qty?: number | string
  rate?: number | string
  qty: number | string
  expense?: number | string
  remark?: string
}

export interface LubeEntry extends PartEntry { }

export interface MaintenanceLogSummary {
  name: string
}

export interface MaintenanceFormModalProps {
  isOpen: boolean
  onClose: () => void
  log: MaintenanceLogSummary | null
}

// --- Helper Functions ---
export const fetchFrappeDoctype = async (
  doctype: string,
  fields: string[] = ["name"],
  filters: any[] = [],
): Promise<FrappeDoc[]> => {
  const fieldsParam = encodeURIComponent(JSON.stringify(fields))
  let url = `${FRAPPE_BASE_URL}/api/resource/${doctype}?fields=${fieldsParam}&limit_page_length=2000`
  if (filters && filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`
  }

  try {
    const response = await fetch(url, { credentials: "include" })
    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`)
    const result = await response.json()
    return result.data || []
  } catch (e) {
    console.error("fetchFrappeDoctype error:", e)
    return []
  }
}

// --- Reusable Components ---

export const ReusableCombobox = React.forwardRef<HTMLButtonElement, any>(
  (props, ref) => {
    const {
      options = [],
      value,
      onValueChange,
      placeholder,
      searchPlaceholder,
      displayField = "name",
      isLoading = false,
      disabled = false,
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
            className="w-full justify-between bg-input"
            disabled={isLoading || disabled}
            ref={ref}
          >
            <span className="flex items-center w-full">
              <span className="truncate">
                {value ? getDisplayValue(value) : placeholder}
              </span>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              {options.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((option: any, i: number) => (
                  <CommandItem
                    key={i}
                    value={option[displayField] || option.name}
                    onSelect={(currentValue) => {
                      const selected = options.find(
                        (opt: any) =>
                          (opt[displayField] || opt.name).toLowerCase() ===
                          currentValue.toLowerCase(),
                      )
                      const newValue = selected ? selected.name : ""
                      onValueChange(newValue === value ? "" : newValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.name ? "opacity-100" : "opacity-0",
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
  },
)
ReusableCombobox.displayName = "ReusableCombobox"

export const MultiSelectCombobox = React.forwardRef<HTMLButtonElement, any>(
  (props, ref) => {
    const {
      options = [],
      value = [],
      onValueChange,
      placeholder,
      searchPlaceholder,
      displayField = "name",
      isLoading = false,
    } = props
    const [open, setOpen] = useState(false)

    const getDisplayValue = () => {
      if (value.length === 0) return placeholder
      if (value.length === 1) {
        const selected = options.find((o: any) => o.name === value[0])
        return selected ? (selected[displayField] || selected.name) : placeholder
      }
      return `${value.length} selected`
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-input h-auto"
            disabled={isLoading}
            ref={ref}
          >
            <span className="flex items-center w-full">
              <span className="truncate">{getDisplayValue()}</span>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              {options.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((option: any) => {
                  const isSelected = value.includes(option.name)
                  return (
                    <CommandItem
                      key={option.name}
                      value={option[displayField] || option.name}
                      onSelect={() => {
                        let newValue = []
                        if (isSelected) {
                          newValue = value.filter((v: string) => v !== option.name)
                        } else {
                          newValue = [...value, option.name]
                        }
                        onValueChange(newValue)

                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option[displayField] || option.name}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  },
)
MultiSelectCombobox.displayName = "MultiSelectCombobox"
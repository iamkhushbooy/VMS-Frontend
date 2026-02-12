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

import { getApiUrl, config } from "@/lib/config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MAINTENANCE_DOCTYPE = "Vehicle Log Master"
export const VEHICLE_DOCTYPE = "Vehicle Master"
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

export const seriesOptions = [{ name: "HR-VLOG-.YYYY.-" }]

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

export const jsaOptions = [{ name: "Done" }, { name: "Not Done" }]

export const housekeepingOptions = [{ name: "Yes" }, { name: "No" }]
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
  onSuccess?: () => void
}

export const fetchFrappeDoctype = async (
  doctype: string,
  fields: string[] = ["name"],
  filters: any[] = [],
): Promise<FrappeDoc[]> => {
  const fieldsParam = encodeURIComponent(JSON.stringify(fields))
  let url = `${getApiUrl(config.api.resource(doctype))}?fields=${fieldsParam}&limit_page_length=None`
  if (filters && filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`
  }

  try {
    const response = await fetch(url, { credentials: "include" })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    const result = await response.json()
    return result.data || []
  } catch (e) {
    console.error("fetchFrappeDoctype error:", e)
    return []
  }
}

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
        <PopoverContent
          align="start"
          sideOffset={4}
          collisionPadding={10}
          className="z-[9999] w-[var(--radix-popover-trigger-width)] min-w-[220px] sm:min-w-[300px] max-w-[95vw] p-0 shadow-xl border border-slate-200"
        >
          <Command className="w-full">
            <CommandInput placeholder={searchPlaceholder} className="h-9 text-sm" />

            <CommandList
              className="max-h-[350px] overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}>
              {options.length === 0 && (
                <CommandEmpty className="text-sm p-3 text-muted-foreground">
                  No results found.
                </CommandEmpty>
              )}

              <CommandGroup>
                {options.map((option: any, i: number) => (
                  <CommandItem
                    key={i}

                    className="text-sm py-2 cursor-pointer flex items-center gap-2 hover:bg-slate-100 transition-colors"
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
                    <Check className={cn("h-4 w-4 shrink-0", value === option.name ? "opacity-100" : "opacity-0")} />

                    <span className="truncate leading-tight">
                      {option[displayField] || option.name}
                    </span>
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

    // Remove the old getDisplayValue string logic and render badges directly in the button
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            // Use h-auto and py-2 so the button grows if there are many names
            className="w-full justify-between bg-input h-auto min-h-10 py-2 px-3"
            disabled={isLoading}
            ref={ref}
          >
            <div className="flex flex-wrap gap-1 items-center overflow-hidden">
              {value.length > 0 ? (
                value.map((val: string) => {
                  // Find the option object to get the display name (e.g., employee_name)
                  const option = options.find((o: any) => o.name === val);
                  const label = option ? (option[displayField] || option.name) : val;

                  return (
                    <span
                      key={val}
                      className="bg-slate-200 text-slate-900 px-2 py-0.5 rounded-md text-xs font-medium border border-slate-300 whitespace-nowrap"
                    >
                      {label}
                    </span>
                  );
                })
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {/* <PopoverContent className="z-[9999] w-[500px] max-w-[95vw] p-0 shadow-2xl border border-slate-200">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList
              className=" overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}>
              {options.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
              <CommandGroup>
                {options.map((option: any) => {
                  const isSelected = value.includes(option.name)
                  return (
                    <CommandItem
                      key={option.name}
                      value={option[displayField] || option.name}
                      onSelect={() => {
                        let newValue = isSelected
                          ? value.filter((v: string) => v !== option.name)
                          : [...value, option.name];
                        onValueChange(newValue)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      {option[displayField] || option.name}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent> */}
        <PopoverContent 
          align="start"
          className="z-[9999] w-[--radix-popover-trigger-width] p-0 shadow-2xl border border-slate-200"
        >
          <Command className="w-full">
            <CommandInput placeholder={searchPlaceholder} className="h-9" />
            <CommandList className="max-h-64 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
              {options.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
              <CommandGroup>
                {options.map((option: any) => {
                  const isSelected = value.includes(option.name)
                  return (
                    <CommandItem
                      key={option.name}
                      value={option[displayField] || option.name}
                      onSelect={() => {
                        let newValue = isSelected
                          ? value.filter((v: string) => v !== option.name)
                          : [...value, option.name];
                        onValueChange(newValue)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{option[displayField] || option.name}</span>
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

export const ItemNameCombobox = React.forwardRef<HTMLButtonElement, any>(
  (props, ref) => {
    const {
      options = [],
      value,
      onValueChange,
      onSearchChange,
      placeholder,
      searchPlaceholder,
      isLoading = false,
      disabled = false,
    } = props

    const [open, setOpen] = useState(false)
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-input border-slate-200"
            disabled={isLoading || disabled}
            ref={ref}
          >
            <span className="flex items-center w-full">
              <span className="truncate">
                {value || placeholder}
              </span>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="z-[9999] w-[500px] max-w-[95vw] p-0 shadow-2xl border border-slate-200"
        >
          <Command className="w-full" shouldFilter={false}>
            <CommandInput placeholder={searchPlaceholder} className="h-10 text-sm" onValueChange={onSearchChange} />
            <CommandList className="max-h-[400px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
              {options.length === 0 && (
                <CommandEmpty className="p-4 text-sm text-muted-foreground text-center">
                  No items found.
                </CommandEmpty>
              )}
              <CommandGroup>
                {options.map((option: any, i: number) => (
                  <CommandItem
                    key={i}
                    className="group text-sm py-3 px-4 cursor-pointer flex items-center justify-between gap-4 
                               data-[selected='true']:bg-blue-600 data-[selected='true']:text-white transition-colors"
                    value={option.name}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Check className={cn(
                        "h-4 w-4 shrink-0",
                        value === option.name ? "opacity-100" : "opacity-0",
                        "group-data-[selected='true']:text-white text-blue-600"
                      )} />

                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">
                          {option.name}
                        </span>
                        <span className="text-[10px] truncate opacity-70 group-data-[selected='true']:text-white text-muted-foreground">
                          {option.item_name}
                        </span>
                      </div>
                    </div>
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
ItemNameCombobox.displayName = "ItemNameCombobox"

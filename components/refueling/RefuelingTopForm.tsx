"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ItemNameCombobox } from "../maintenance/MaintenanceShared"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface FrappeDoc {
  name: string
  [key: string]: any
}

interface RefuelingFormData {
  date: string
  issuerName: string
  company: string
  sourceWarehouse: string
  fuelItem: string
  costCenter: string
}

interface RefuelingTopFormProps {
  formData: RefuelingFormData
  setFormData: React.Dispatch<React.SetStateAction<RefuelingFormData>>
  issuerOptions: FrappeDoc[]
  companyOptions: FrappeDoc[]
  warehouseOptions: FrappeDoc[]
  itemOptions: FrappeDoc[]
  costCenterOptions: FrappeDoc[]
  isEditMode: boolean
  onEmployeeFieldClick: () => void
  onItemSearch: (query: string) => void;
  onFuelItemSelect: (val: string) => void;
  itemLoading: boolean;
}

const ReusableCombobox = React.forwardRef<HTMLButtonElement, any>(
  (
    {
      options = [],
      value,
      onValueChange,
      placeholder,
      displayField = "name",
      searchPlaceholder,
      disabled = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)

    const getDisplayValue = (val: string) => {
      const selected = options.find((o: any) => o.name === val)
      return selected ? selected[displayField] || selected.name : placeholder
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-between bg-input"
          >
            {getDisplayValue(value)}
            <ChevronsUpDown className="opacity-50 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0 pointer-events-auto"
          align="start"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList
              className="max-h-60 overflow-y-auto"
              onWheel={(e) => e.stopPropagation()}
            >
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
                      onValueChange(selected ? selected.name : "")
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

export function RefuelingTopForm({
  formData,
  setFormData,
  issuerOptions,
  companyOptions,
  warehouseOptions,
  itemOptions,
  costCenterOptions,
  isEditMode,
  onItemSearch,
  onFuelItemSelect,
  itemLoading,
  onEmployeeFieldClick,
}: RefuelingTopFormProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={formData.date}
          disabled={!isEditMode}
          onChange={(e) =>
            setFormData((p) => ({ ...p, date: e.target.value }))
          }
        />
      </div>

      <div>
        <Label>Company</Label>
        <ReusableCombobox
          options={companyOptions}
          value={formData.company}
          onValueChange={(v: string) =>
            setFormData((p) => ({ ...p, company: v }))
          }
          placeholder="Select company"
          searchPlaceholder="Search company..."
          disabled={!isEditMode}
        />
      </div>



      <div>
        <Label>Source Warehouse</Label>
        <ReusableCombobox
          options={warehouseOptions}
          value={formData.sourceWarehouse}
          onValueChange={(v: string) =>
            setFormData((p) => ({ ...p, sourceWarehouse: v }))
          }
          placeholder="Select warehouse"
          searchPlaceholder="Search warehouse..."
          disabled={!isEditMode}
        />
      </div>
      <div>
        <Label>Cost Center</Label>
        <ReusableCombobox
          options={costCenterOptions}
          value={formData.costCenter}
          onValueChange={(v: string) =>
            setFormData((p) => ({ ...p, costCenter: v }))
          }
          placeholder="Select cost center"
          searchPlaceholder="Search cost center..."
          disabled={!isEditMode}
        />
      </div>
      <div onMouseDown={onEmployeeFieldClick}>
        <Label>Issuer Name</Label>

        <ReusableCombobox
          options={issuerOptions}
          value={formData.issuerName}
          onValueChange={(v: string) => setFormData({ ...formData, issuerName: v })}
          placeholder="Select Issuer"
          searchPlaceholder="Search by ID or Name..."
          displayField="combined_label"
          isLoading={isEditMode ? false : true}
          disabled={!isEditMode}
        />
      </div>

      <div>
        <Label>Fuel Item Code</Label>
        <ItemNameCombobox
          options={itemOptions}
          value={formData.fuelItem}
          onValueChange={onFuelItemSelect}
          onSearchChange={onItemSearch}
          isLoading={itemLoading}
          placeholder="Select Item Code"
          searchPlaceholder="Search by Item Code..."
          displayField="name"
          disabled={!isEditMode}
        />
      </div>


    </div>
  )
}

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
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((opt: any) => (
                  <CommandItem
                    key={opt.name}
                    value={opt[displayField] || opt.name}
                    onSelect={() => {
                      onValueChange(opt.name)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        opt.name === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt[displayField] || opt.name}
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
        <Label>Issuer Name</Label>
        <ReusableCombobox
          options={issuerOptions}
          value={formData.issuerName}
          onValueChange={(v: string) =>
            setFormData((p) => ({ ...p, issuerName: v }))
          }
          placeholder="Select issuer"
          searchPlaceholder="Search issuer..."
          disabled={!isEditMode}
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
        <Label>Fuel Item</Label>
        <ReusableCombobox
          options={itemOptions}
          value={formData.fuelItem}
          onValueChange={(v: string) =>
            setFormData((p) => ({ ...p, fuelItem: v }))
          }
          placeholder="Select item"
          searchPlaceholder="Search item..."
          displayField="item_name"
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
    </div>
  )
}

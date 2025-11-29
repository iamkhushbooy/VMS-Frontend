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
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FuelEntry } from "@/components/refueling/refueling-form-modal"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface VehicleDoc {
  name: string
  [key: string]: any
}

interface FuelEntryFormProps {
  newEntry: Partial<FuelEntry>
  setNewEntry: React.Dispatch<React.SetStateAction<Partial<FuelEntry>>>
  vehicleOptions: VehicleDoc[]
  addFuelEntry: () => void
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

export function FuelEntryForm({
  newEntry,
  setNewEntry,
  vehicleOptions,
  addFuelEntry,
}: FuelEntryFormProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border mt-2 rounded-lg">
      <div>
        <Label>Reg No</Label>
        <ReusableCombobox
          options={vehicleOptions}
          value={newEntry.vehicle || ""}
          onValueChange={(v: string) =>
            setNewEntry((p) => ({
              ...p,
              vehicle: v,
              registrationName: v,
            }))
          }
          placeholder="Select vehicle"
          searchPlaceholder="Search vehicle..."
        />
      </div>
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={newEntry.date}
          onChange={(e) =>
            setNewEntry((p) => ({ ...p, date: e.target.value }))
          }
        />
      </div>
      <div>
        <Label>Fuel Qty</Label>
        <Input
          type="number"
          value={newEntry.fuelQty}
          onChange={(e) =>
            setNewEntry((p) => ({
              ...p,
              fuelQty: Number(e.target.value),
            }))
          }
        />
      </div>
      <div>
        <Label>HMR</Label>
        <Input
          type="number"
          value={newEntry.current_hmrkms}
          onChange={(e) =>
            setNewEntry((p) => ({
              ...p,
              current_hmrkms: Number(e.target.value),
            }))
          }
        />
      </div>
      <div>
        <Label>Fuel Consumption</Label>
        <Input
          type="number"
          value={newEntry.fuelConsumption}
          onChange={(e) =>
            setNewEntry((p) => ({
              ...p,
              fuelConsumption: Number(e.target.value),
            }))
          }
        />
      </div>
      <div className="flex items-end">
        <Button onClick={addFuelEntry} className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>
    </div>
  )
}

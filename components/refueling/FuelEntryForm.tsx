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
  onVehicleFieldClick: () => void
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

export function FuelEntryForm({
  newEntry,
  setNewEntry,
  vehicleOptions,
  addFuelEntry,
  onVehicleFieldClick,
}: FuelEntryFormProps) {
  const maxDate = "2099-12-31"
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border mt-2 rounded-lg">
      <div onMouseDown={onVehicleFieldClick}>
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
          max={maxDate}
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
          min="0"
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
          // Agar value 0 ya undefined hai toh khali string dikhayein
          value={newEntry.fuel_qty_in_ltrs === undefined || newEntry.fuel_qty_in_ltrs === 0 ? "" : newEntry.fuel_qty_in_ltrs}
          onChange={(e) => {
            const val = e.target.value;
            setNewEntry((p) => ({
              ...p,
              // Khali string hone par undefined rakhein, warna Number mein convert karein
              fuel_qty_in_ltrs: val === "" ? undefined : Number(val),
            }))
          }}
        />
      </div>
      <div>
        <Label>HMR</Label>
        <Input
          type="number"
          min="0"
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
          // Agar value undefined ya 0 hai toh khali rakhein
          value={newEntry.current_hmrkms === undefined || newEntry.current_hmrkms === 0 ? "" : newEntry.current_hmrkms}
          onChange={(e) => {
            const val = e.target.value;
            setNewEntry((p) => ({
              ...p,
              current_hmrkms: val === "" ? undefined : Number(val),
            }))
          }}
        />
      </div>
      <div>
        <Label>Fuel Consumption</Label>
        <Input
          type="number"
          min="0"
          onKeyDown={(e) => {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
              e.preventDefault();
            }
          }}
          value={newEntry.fuel_consumption === undefined || newEntry.fuel_consumption === 0 ? "" : newEntry.fuel_consumption}
          onChange={(e) => {
            const val = e.target.value;
            setNewEntry((p) => ({
              ...p,
              fuel_consumption: val === "" ? undefined : Number(val),
            }))
          }}
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

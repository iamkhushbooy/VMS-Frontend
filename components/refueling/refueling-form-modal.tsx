"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
const FRAPPE_BASE_URL = "http://localhost:8000"
const DOCTYPE_NAME = "Vehicle Refueling"

interface FrappeDoc { name: string;[key: string]: any; }

interface VehicleDoc extends FrappeDoc {
  last_odometer?: number;
}

interface FuelEntry {
  id: string;
  vehicle: string;
  registrationName: string;
  date: string;
  fuelQty: number;
  current_hmrkms: number;
  fuelConsumption: number;
}

interface RefuelingFormModalProps {
  isOpen: boolean
  onClose: () => void
  record: { name: string } | null
}

const fetchFrappeDoctype = async (doctype: string, fields: string[] = ["name"], filters: any[] = []): Promise<FrappeDoc[]> => {
  const fieldsParam = encodeURIComponent(JSON.stringify(fields))
  let url = `${FRAPPE_BASE_URL}/api/resource/${doctype}?fields=${fieldsParam}&limit_page_length=2000`
  if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`

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

const ReusableCombobox = React.forwardRef<HTMLButtonElement, any>((props, ref) => {
  const { options = [], value, onValueChange, placeholder, searchPlaceholder, displayField = 'name', isLoading = false } = props
  const [open, setOpen] = useState(false)

  const getDisplayValue = (val: string) => {
    const selected = options.find((o: any) => o.name === val)
    if (!selected) return placeholder
    return selected[displayField] || selected.name
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between bg-input" disabled={isLoading} ref={ref}>
          <span className="truncate">{value ? getDisplayValue(value) : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                    const selected = options.find((opt: any) => (opt[displayField] || opt.name).toLowerCase() === currentValue.toLowerCase())
                    const newValue = selected ? selected.name : ""
                    onValueChange(newValue === value ? "" : newValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.name ? "opacity-100" : "opacity-0")} />
                  {option[displayField] || option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
ReusableCombobox.displayName = "ReusableCombobox"

export function RefuelingFormModal({ isOpen, onClose, record }: RefuelingFormModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    issuerName: "",
    company: "",
    sourceWarehouse: "",
    fuelItem: "",
    costCenter: "",
  })

  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([])
  const [newEntry, setNewEntry] = useState<Partial<FuelEntry>>({
    vehicle: "",
    registrationName: "",
    date: new Date().toISOString().split("T")[0],
    fuelQty: 0,
    current_hmrkms: 0,
    fuelConsumption: 0,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [issuerOptions, setIssuerOptions] = useState<FrappeDoc[]>([])
  const [companyOptions, setCompanyOptions] = useState<FrappeDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
  const [itemOptions, setItemOptions] = useState<FrappeDoc[]>([])
  const [costCenterOptions, setCostCenterOptions] = useState<FrappeDoc[]>([])
  const [vehicleOptions, setVehicleOptions] = useState<VehicleDoc[]>([])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setIsLoading(true)

    const loadDropdowns = async () => {
      try {
        const [users, companies, warehouses, items, costCenters, vehicles] = await Promise.all([
          fetchFrappeDoctype("User", ["name"]),
          fetchFrappeDoctype("Company", ["name"]),
          fetchFrappeDoctype("Warehouse", ["name"]),
          fetchFrappeDoctype("Item", ["name"]),
          fetchFrappeDoctype("Cost Center", ["name"]),
          fetchFrappeDoctype("Vehicle", ["name"]) as Promise<VehicleDoc[]>,
        ])
        if (cancelled) return
        setIssuerOptions(users)
        setCompanyOptions(companies)
        setWarehouseOptions(warehouses)
        setItemOptions(items)
        setCostCenterOptions(costCenters)
        setVehicleOptions(vehicles)
      } catch (e) {
        console.error("loadDropdowns error:", e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    const loadFullRecord = async (name: string) => {
      setIsLoading(true)
      try {
        const url = `${FRAPPE_BASE_URL}/api/resource/${DOCTYPE_NAME}/${encodeURIComponent(name)}`
        const resp = await fetch(url, { credentials: "include" })
        if (!resp.ok) throw new Error("Failed to fetch record")
        const result = await resp.json()
        const doc = result.data || {}
        setFormData({
          date: doc.date || new Date().toISOString().split("T")[0],
          issuerName: doc.issuer_name || "",
          company: doc.company || "",
          sourceWarehouse: doc.source_warehouse || "",
          fuelItem: doc.fuel_item || "",
          costCenter: doc.cost_center || "",
        })
        const childEntries: FuelEntry[] = (doc.vehicle_refueling_details || []).map((ch: any) => ({
          id: ch.name || `${Math.random().toString(36).slice(2)}`,
          vehicle: ch.vehicle,
          registrationName: ch.registration_no || ch.vehicle,
          date: ch.date,
          fuelQty: Number(ch.fuel_qty) || 0,
          current_hmrkms: parseFloat(ch.current_hmrkms) || 0,
          fuelConsumption: Number(ch.fuel_consumption) || 0,
        }))
        setFuelEntries(childEntries)
      } catch (e) {
        console.error("loadFullRecord error:", e)
        onClose()
      } finally {
        setIsLoading(false)
      }
    }

    loadDropdowns().then(() => {
      if (record) loadFullRecord(record.name)
    })

    return () => { cancelled = true }
  }, [isOpen, record, onClose])

  const handleSelectChange = (name: string, value: string) => setFormData(p => ({ ...p, [name]: value }))

  const handleNewEntryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numberFields = ['fuelQty', 'current_hmrkms', 'fuelConsumption']
    setNewEntry(prev => ({
      ...prev,
      [name]: numberFields.includes(name) ? (value === "" ? 0 : Number(value)) : value,
    }))
  }

  // Use vehicle.last_odometer to autofill current_hmrkms
  const handleNewEntrySelectChange = (_name: string, value: string) => {
    const selectedVehicle = vehicleOptions.find(v => v.name === value)
    setNewEntry(prev => ({
      ...prev,
      vehicle: value,
      registrationName: selectedVehicle?.name || "",
      current_hmrkms: selectedVehicle?.last_odometer ?? prev?.current_hmrkms ?? 0,
    }))
  }

  const addFuelEntry = () => {
    if (!newEntry.vehicle || (Number(newEntry.fuelQty) || 0) <= 0) {
      console.warn("Please select a vehicle and enter fuel quantity.")
      return
    }
    const entry: FuelEntry = {
      id: `${Date.now()}`,
      vehicle: newEntry.vehicle as string,
      registrationName: newEntry.registrationName || "",
      date: (newEntry.date as string) || new Date().toISOString().split("T")[0],
      fuelQty: Number(newEntry.fuelQty) || 0,
      current_hmrkms: Number(newEntry.current_hmrkms) || 0,
      fuelConsumption: Number(newEntry.fuelConsumption) || 0,
    }
    setFuelEntries(prev => [...prev, entry])
    setNewEntry({
      vehicle: "",
      registrationName: "",
      date: new Date().toISOString().split("T")[0],
      fuelQty: 0,
      current_hmrkms: 0,
      fuelConsumption: 0,
    })
  }

  const removeFuelEntry = (id: string) => setFuelEntries(prev => prev.filter(e => e.id !== id))



  const handleSubmit = async () => {
    if (!formData.company) return console.warn("Company required");
    if (fuelEntries.length === 0) return console.warn("Add at least one entry");

    setIsSubmitting(true);

    try {
      const payload = {
        date: formData.date,
        issuer_name: formData.issuerName,
        company: formData.company,
        source_warehouse: formData.sourceWarehouse,
        fuel_item: formData.fuelItem,
        cost_center: formData.costCenter,
        vehicle_refueling_details: fuelEntries.map((fe) => ({
          ...(!/^\d+$/.test(fe.id) && { name: fe.id }),
          vehicle: fe.vehicle,
          date: fe.date,
          fuel_qty: fe.fuelQty,
          current_hmrkms: fe.current_hmrkms,
          fuel_consumption: fe.fuelConsumption,
        })),
      };
      console.log("hello", payload);
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(payload));
      const res = await axios.post(
        `${FRAPPE_BASE_URL}/api/method/vms.api.submit_vehicle_refueling`,
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            Accept: "*/*",
          }
        }
      );

      console.log("Success:", res.data);
      onClose();

    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Axios submit error:", err.response?.data || err.message);
      } else {
        console.error("An unexpected error occurred:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const totalFuelQuantity = fuelEntries.reduce((s, e) => s + (Number(e.fuelQty) || 0), 0)
  const totalCost = totalFuelQuantity * 85
  const isBusy = isLoading || isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{record ? "View" : "Log"} Refueling Event</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        <div className={`space-y-6 ${isLoading ? 'opacity-50' : ''}`}>
          <div className="grid grid-cols-2 gap-4 bg-card p-4 rounded-lg border border-border">
            <div>
              <Label htmlFor="formDate" className="text-foreground">Date</Label>
              <Input id="formDate" name="date" type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="mt-1 bg-input" disabled={isBusy} />
            </div>

            <div>
              <Label htmlFor="issuerName" className="text-foreground mb-1">Issuer Name</Label>
              <ReusableCombobox options={issuerOptions} value={formData.issuerName} onValueChange={(v: string) => handleSelectChange("issuerName", v)} placeholder="Select issuer" searchPlaceholder="Search issuers..." isLoading={isBusy} />
            </div>

            <div>
              <Label htmlFor="company" className="text-foreground mb-1">Company</Label>
              <ReusableCombobox options={companyOptions} value={formData.company} onValueChange={(v: string) => handleSelectChange("company", v)} placeholder="Select company" searchPlaceholder="Search companies..." isLoading={isBusy} />
            </div>

            <div>
              <Label htmlFor="sourceWarehouse" className="text-foreground mb-1">Source Warehouse</Label>
              <ReusableCombobox options={warehouseOptions} value={formData.sourceWarehouse} onValueChange={(v: string) => handleSelectChange("sourceWarehouse", v)} placeholder="Select warehouse" searchPlaceholder="Search warehouses..." isLoading={isBusy} />
            </div>

            <div>
              <Label htmlFor="fuelItem" className="text-foreground mb-1">Fuel Item</Label>
              <ReusableCombobox options={itemOptions} value={formData.fuelItem} onValueChange={(v: string) => handleSelectChange("fuelItem", v)} placeholder="Select fuel item" searchPlaceholder="Search items..." displayField="item_name" isLoading={isBusy} />
            </div>

            <div>
              <Label htmlFor="costCenter" className="text-foreground mb-1">Cost Center</Label>
              <ReusableCombobox options={costCenterOptions} value={formData.costCenter} onValueChange={(v: string) => handleSelectChange("costCenter", v)} placeholder="Select cost center" searchPlaceholder="Search cost centers..." isLoading={isBusy} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Fuel Entry Details</h3>

            <div className="space-y-3 bg-card p-4 rounded-lg border border-border">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="vehicle" className="text-foreground mb-1">Registration No</Label>
                  <ReusableCombobox options={vehicleOptions} value={newEntry.vehicle || ""} onValueChange={(v: string) => handleNewEntrySelectChange("vehicle", v)} placeholder="Select vehicle" searchPlaceholder="Search by reg no..." displayField="name" isLoading={isBusy} />
                </div>

                <div>
                  <Label htmlFor="entryDate" className="text-foreground">Date</Label>
                  <Input id="entryDate" name="date" type="date" value={newEntry.date as string} onChange={handleNewEntryInputChange} className="mt-1 bg-input" disabled={isBusy} />
                </div>

                <div>
                  <Label htmlFor="fuelQty" className="text-foreground">Fuel Qty (Ltrs)</Label>
                  <Input id="fuelQty" name="fuelQty" type="number" step="0.5" value={newEntry.fuelQty === 0 ? "" : String(newEntry.fuelQty)} onChange={handleNewEntryInputChange} placeholder="Enter quantity" className="mt-1 bg-input" disabled={isBusy} />
                </div>

                <div>
                  <Label htmlFor="hmr" className="text-foreground">Current HMR/Kms</Label>
                  <Input id="hmr" name="current_hmrkms" type="number" step="0.1" value={newEntry.current_hmrkms === 0 ? "" : String(newEntry.current_hmrkms)} onChange={handleNewEntryInputChange} placeholder="e.g., 125430.5" className="mt-1 bg-input" disabled={isBusy} />
                </div>

                <div>
                  <Label htmlFor="fuelConsumption" className="text-foreground">Fuel Consumption</Label>
                  <Input id="fuelConsumption" name="fuelConsumption" type="number" value={newEntry.fuelConsumption === 0 ? "" : String(newEntry.fuelConsumption)} onChange={handleNewEntryInputChange} placeholder="e.g., 8.5" className="mt-1 bg-input" disabled={isBusy} />
                </div>

                <div className="flex items-end">
                  <Button onClick={addFuelEntry} disabled={isBusy} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add</Button>
                </div>
              </div>
            </div>

            {fuelEntries.length > 0 && (
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-secondary">Registration No</TableHead>
                      <TableHead className="text-secondary">Date</TableHead>
                      <TableHead className="text-secondary">Fuel Qty (Ltrs)</TableHead>
                      <TableHead className="text-secondary">Current HMR/kms</TableHead>
                      <TableHead className="text-secondary">Fuel Consumption</TableHead>
                      <TableHead className="text-secondary">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelEntries.map(entry => (
                      <TableRow key={entry.id} className="border-border">
                        <TableCell className="font-mono text-foreground">{entry.registrationName || entry.vehicle}</TableCell>
                        <TableCell className="font-mono text-foreground">{entry.date}</TableCell>
                        <TableCell className="text-foreground">{entry.fuelQty}</TableCell>
                        <TableCell className="font-mono text-foreground">{entry.current_hmrkms}</TableCell>
                        <TableCell className="text-foreground">{entry.fuelConsumption}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeFuelEntry(entry.id)} disabled={isBusy}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex justify-end">
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>

          {/* Only show this button if 'record' is null (New Log), hide it if Updating */}
          {!record && (
            <Button
              onClick={handleSubmit}
              className="glow-button-pink"
              disabled={isBusy}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Saving..." : "Save Refueling Log"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
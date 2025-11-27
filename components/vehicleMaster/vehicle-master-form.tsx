"use client"
import React, { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { 
  Loader2, 
  Check, 
  ChevronsUpDown, 
  Car, 
  ShieldCheck, 
  Fuel, 
  Calendar, 
  MapPin, 
  User, 
  CreditCard,
  Gauge,
  Info,
  Image as ImageIcon
} from "lucide-react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const FRAPPE_BASE_URL = "http://localhost:8000"
const DOCTYPE_NAME = "Vehicle Master"

interface FrappeDoc { name: string;[key: string]: any; }

interface VehicleModalProps {
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
  const { options = [], value, onValueChange, placeholder, searchPlaceholder, displayField = 'name', isLoading = false, icon: Icon } = props
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

// --- FORM SECTION COMPONENT ---
const FormSection = ({ title, icon: Icon, children, className }: { title: string, icon: any, children: React.ReactNode, className?: string }) => (
  <div className={cn("rounded-xl border bg-card/50 p-6 shadow-sm space-y-4", className)}>
    <div className="flex items-center gap-2.5 border-b pb-3 mb-2">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-lg tracking-tight text-foreground">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
      {children}
    </div>
  </div>
)

// --- INPUT WRAPPER COMPONENT ---
const InputGroup = ({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-muted-foreground">
      {label} {required && <span className="text-red-500 ml-0.5">*</span>}
    </Label>
    {children}
  </div>
)

// --- MAIN FORM COMPONENT ---
export function VehicleMasterModal({ isOpen, onClose, record }: VehicleModalProps) {
  const [formData, setFormData] = useState({
    licensePlate: "",
    make: "",
    model: "",
    image: "", 
    
    lastOdometer: "",
    acquisitionDate: "",
    location: "",
    chassisNo: "",
    vehicleValue: "",
    employee: "",
    
    insuranceCompany: "",
    policyNo: "",
    startDate: "",
    endDate: "",
    
    fuelType: "Petrol",
    fuelUOM: "Litre",
    carbonCheckDate: "",
    color: "",
    wheels: "",
    doors: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dropdown Options
  const [locationOptions, setLocationOptions] = useState<FrappeDoc[]>([])
  const [employeeOptions, setEmployeeOptions] = useState<FrappeDoc[]>([])
  
  const fuelTypeOptions = [
    {name: "Petrol"}, 
    {name: "Diesel"}, 
    {name: "Natural Gas"},
    {name: "Electric"}, 
    {name: "CNG"}
  ]
  const uomOptions = [{name: "Litre"}, {name: "Gallon"}, {name: "Kg"}, {name: "kWh"}]

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setIsLoading(true)

    const loadDropdowns = async () => {
      try {
        const [locs, emps] = await Promise.all([
          fetchFrappeDoctype("Location", ["name"]), 
          fetchFrappeDoctype("Employee", ["name", "employee_name"]),
        ])
        
        if (cancelled) return
        setLocationOptions(locs)
        setEmployeeOptions(emps)
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
          licensePlate: doc.license_plate || "",
          make: doc.make || "",
          model: doc.model || "",
          image: doc.image || "",

          lastOdometer: doc.last_odometer || "",
          acquisitionDate: doc.acquisition_date || "",
          location: doc.location || "",
          chassisNo: doc.chassis_no || "",
          vehicleValue: doc.vehicle_value || "",
          employee: doc.employee || "",

          insuranceCompany: doc.insurance_company || "",
          policyNo: doc.policy_no || "",
          startDate: doc.start_date || "",
          endDate: doc.end_date || "",
          
          fuelType: doc.fuel_type || "Petrol",
          fuelUOM: doc.fuel_uom || "Litre",
          carbonCheckDate: doc.carbon_check_date || "",
          color: doc.color || "",
          wheels: doc.wheels || "",
          doors: doc.doors || ""
        })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(p => ({ ...p, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.licensePlate) return console.warn("License Plate required");
    
    setIsSubmitting(true);
    try {
      const payload = {
        license_plate: formData.licensePlate,
        make: formData.make,
        model: formData.model,
        // image: formData.image, // Handle image upload separately if needed

        last_odometer: formData.lastOdometer,
        acquisition_date: formData.acquisitionDate,
        location: formData.location,
        chassis_no: formData.chassisNo,
        vehicle_value: formData.vehicleValue,
        employee: formData.employee,

        insurance_company: formData.insuranceCompany,
        policy_no: formData.policyNo,
        start_date: formData.startDate,
        end_date: formData.endDate,

        fuel_type: formData.fuelType,
        fuel_uom: formData.fuelUOM,
        carbon_check_date: formData.carbonCheckDate,
        color: formData.color,
        wheels: formData.wheels,
        doors: formData.doors
      };

      let url = `${FRAPPE_BASE_URL}/api/resource/${DOCTYPE_NAME}`
      let method = "POST"

      const res = await axios({ method, url, data: payload, withCredentials: true });
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

  const isBusy = isLoading || isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden bg-background flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b bg-muted/20 flex items-center justify-between shrink-0">
          <DialogHeader className="p-0">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-primary/10 rounded-full">
                  <Car className="w-6 h-6 text-primary" />
               </div>
               <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {record ? "Full Vehicle Record" : "Register New Vehicle"}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage vehicle details, insurance policies, and specifications.
                  </p>
               </div>
             </div>
          </DialogHeader>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Loading vehicle data...</p>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5 min-h-0">
          
          {/* Section 1: Vehicle Identity */}
          <FormSection title="Vehicle Identity" icon={Info}>
            <InputGroup label="License Plate" required>
                <Input 
                  name="licensePlate" 
                  value={formData.licensePlate} 
                  onChange={handleInputChange} 
                  disabled={isBusy} 
                  placeholder="e.g. KA01AB1234"
                  className="text-lg font-semibold tracking-wide uppercase h-12"
                />
            </InputGroup>
            
            <InputGroup label="Make" required>
              <Input name="make" value={formData.make} onChange={handleInputChange} disabled={isBusy} placeholder="e.g. Toyota" />
            </InputGroup>
            <InputGroup label="Model" required>
              <Input name="model" value={formData.model} onChange={handleInputChange} disabled={isBusy} placeholder="e.g. Corolla Altis" />
            </InputGroup>
            <InputGroup label="Image">
               <div className="flex items-center gap-2">
                 <Input 
                   type="file" 
                   accept="image/*"
                   className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                 />
                 {/* Note: File upload logic requires handling FormData or separate API call */}
               </div>
            </InputGroup>
          </FormSection>

          {/* Section 2: Details */}
          <FormSection title="Details" icon={Gauge}>
            <InputGroup label="Odometer Value (Last)" required>
               <div className="relative">
                  <Input name="lastOdometer" type="number" value={formData.lastOdometer} onChange={handleInputChange} disabled={isBusy} className="pl-9" />
                  <Gauge className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
               </div>
            </InputGroup>
            <InputGroup label="Acquisition Date">
              <Input name="acquisitionDate" type="date" value={formData.acquisitionDate} onChange={handleInputChange} disabled={isBusy} />
            </InputGroup>
            <InputGroup label="Location">
              <ReusableCombobox icon={MapPin} options={locationOptions} value={formData.location} onValueChange={(v: string) => handleSelectChange("location", v)} placeholder="Select Location" isLoading={isBusy} />
            </InputGroup>
            <InputGroup label="Chassis No">
              <Input name="chassisNo" value={formData.chassisNo} onChange={handleInputChange} disabled={isBusy} className="uppercase" />
            </InputGroup>
            <InputGroup label="Vehicle Value">
               <div className="relative">
                 <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
                 <Input name="vehicleValue" type="number" value={formData.vehicleValue} onChange={handleInputChange} disabled={isBusy} className="pl-8" />
               </div>
            </InputGroup>
            <InputGroup label="Employee">
              <ReusableCombobox icon={User} options={employeeOptions} value={formData.employee} onValueChange={(v: string) => handleSelectChange("employee", v)} placeholder="Select Employee" displayField="employee_name" isLoading={isBusy} />
            </InputGroup>
          </FormSection>

          {/* Section 3: Insurance Details */}
          <FormSection title="Insurance Details" icon={ShieldCheck}>
            <InputGroup label="Insurance Company">
              <Input name="insuranceCompany" value={formData.insuranceCompany} onChange={handleInputChange} disabled={isBusy} placeholder="e.g. HDFC ERGO" />
            </InputGroup>
            <InputGroup label="Policy No">
               <div className="relative">
                  <Input name="policyNo" value={formData.policyNo} onChange={handleInputChange} disabled={isBusy} className="pl-9" />
                  <CreditCard className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
               </div>
            </InputGroup>
            <InputGroup label="Start Date">
               <div className="relative">
                  <Input name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} disabled={isBusy} className="pl-9" />
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
               </div>
            </InputGroup>
             <InputGroup label="End Date">
               <div className="relative">
                  <Input name="endDate" type="date" value={formData.endDate} onChange={handleInputChange} disabled={isBusy} className="pl-9" />
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
               </div>
            </InputGroup>
          </FormSection>

          {/* Section 4: Additional Details */}
          <FormSection title="Additional Details" icon={Fuel}>
             <InputGroup label="Fuel Type" required>
                <ReusableCombobox options={fuelTypeOptions} value={formData.fuelType} onValueChange={(v: string) => handleSelectChange("fuelType", v)} placeholder="Select Type" isLoading={isBusy} />
             </InputGroup>
             <InputGroup label="Fuel UOM" required>
                <ReusableCombobox options={uomOptions} value={formData.fuelUOM} onValueChange={(v: string) => handleSelectChange("fuelUOM", v)} placeholder="Select UOM" isLoading={isBusy} />
             </InputGroup>
             <InputGroup label="Last Carbon Check">
                <Input name="carbonCheckDate" type="date" value={formData.carbonCheckDate} onChange={handleInputChange} disabled={isBusy} />
             </InputGroup>
             <InputGroup label="Color">
               <Input name="color" value={formData.color} onChange={handleInputChange} disabled={isBusy} placeholder="e.g. Metallic Silver" />
             </InputGroup>
             <InputGroup label="Wheels">
                <Input name="wheels" type="number" value={formData.wheels} onChange={handleInputChange} disabled={isBusy} />
             </InputGroup>
             <InputGroup label="Doors">
                <Input name="doors" type="number" value={formData.doors} onChange={handleInputChange} disabled={isBusy} />
             </InputGroup>
          </FormSection>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background flex justify-end gap-3 items-center shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isBusy} className="text-white bg-[rgb(91,187,219)]">
            Cancel
          </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
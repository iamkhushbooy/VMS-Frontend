"use client"
import React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { getApiUrl, config } from "@/lib/config"
const DOCTYPE_NAME = "Utilization Report"

interface FrappeDoc { name: string;[key: string]: any; }
interface UtilizationFormProps {
  isOpen: boolean
  onClose: () => void
  record: { name: string } | null
}
const formatDateTimeForInput = (dateStr: string | undefined) => {
  if (!dateStr) return "";
  return dateStr.replace(" ", "T").substring(0, 16);
}

const fetchFrappeDoctype = async (doctype: string, fields: string[] = ["name"], filters: any[] = []): Promise<FrappeDoc[]> => {
  const fieldsParam = encodeURIComponent(JSON.stringify(fields))
  let url = `${getApiUrl(config.api.resource(doctype))}?fields=${fieldsParam}&limit_page_length=2000`
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
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between bg-white border-gray-200" disabled={isLoading} ref={ref}>
          <span className="truncate text-gray-700 font-normal">{value ? getDisplayValue(value) : placeholder}</span>
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

export function UtilizationReportModal({ isOpen, onClose, record }: UtilizationFormProps) {

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    fromDate: "",
    toDate: "",
    shift: "A",
    plant: "",
    costCenter: "",
    warehouse: "",
    vehicle: "",
    supervisorName: "",
    hmr: "",
    status: "Running"
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [plantOptions, setPlantOptions] = useState<FrappeDoc[]>([])
  const [costCenterOptions, setCostCenterOptions] = useState<FrappeDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
  const [vehicleOptions, setVehicleOptions] = useState<FrappeDoc[]>([])
  const [supervisorOptions, setSupervisorOptions] = useState<FrappeDoc[]>([])

  const shiftOptions = [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "G" }]
  const statusOptions = [{ name: "Running" }, { name: "Breakdown" }, { name: "Idle" }]

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setIsLoading(true)

    const loadData = async () => {
      try {
        console.log("Loading Data...");

        const userResp = await fetch(getApiUrl(config.api.getLoggedUser), { credentials: "include" })
        const userResult = await userResp.json()
        const loggedInUserId = userResult.message;

        const [branches, costCenters, warehouses, vehicles, users] = await Promise.all([
          fetchFrappeDoctype("Branch", ["name"]),
          fetchFrappeDoctype("Cost Center", ["name"]),
          fetchFrappeDoctype("Warehouse", ["name"]),
          fetchFrappeDoctype("Vehicle Master", ["name"]),
          fetchFrappeDoctype("User", ["name", "full_name", "enabled"]),
        ])

        if (cancelled) return
        const activeUsers = users.filter((u: any) => u.enabled === 1);

        setPlantOptions(branches)
        setCostCenterOptions(costCenters)
        setWarehouseOptions(warehouses)
        setVehicleOptions(vehicles)
        setSupervisorOptions(activeUsers)

        if (record) {
          const url = getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${encodeURIComponent(record.name)}`)
          const resp = await fetch(url, { credentials: "include" })
          const result = await resp.json()
          const doc = result.data || {}

          setFormData({
            date: doc.date ? doc.date.split(" ")[0] : new Date().toISOString().split("T")[0],
            fromDate: formatDateTimeForInput(doc.from_date),
            toDate: formatDateTimeForInput(doc.to_date),
            shift: doc.shift || "A",
            plant: doc.plant || doc.branch || "",
            costCenter: doc.cost_center || "",
            warehouse: doc.warehouse || "",
            vehicle: doc.vehicle || "",
            supervisorName: doc.supervisor_name || "",
            hmr: doc.hmr || "",
            status: doc.status || "Running"
          })

        } else {
          setFormData(prev => ({
            ...prev,
            date: new Date().toISOString().split("T")[0],
            fromDate: "",
            toDate: "",
            supervisorName: loggedInUserId,
          }))
        }

      } catch (e) {
        console.error("loadData error:", e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()

    return () => { cancelled = true }
  }, [isOpen, record])


  const handleSelectChange = (name: string, value: string) => {
    setFormData(p => ({ ...p, [name]: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.vehicle) return console.warn("Vehicle required");
    if (["Breakdown", "Idle"].includes(formData.status)) {
      if (!formData.fromDate || !formData.toDate) {
        return alert("From Date and To Date are required for Breakdown/Idle status.");
      }
    }

    setIsSubmitting(true);

    try {
      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include"
      });

      const tokenResult = await tokenResp.json();
      const csrfToken = tokenResult.message;

      const payload = {
        date: formData.date,
        from_date: formData.fromDate,
        to_date: formData.toDate,
        shift: formData.shift,
        plant: formData.plant,
        cost_center: formData.costCenter,
        warehouse: formData.warehouse,
        vehicle: formData.vehicle,
        supervisor_name: formData.supervisorName,
        hmr: formData.hmr,
        status: formData.status
      };

      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(payload));

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.submit_utilization_report")),
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            "Accept": "*/*",
            "X-Frappe-CSRF-Token": csrfToken,
          }
        }
      );

      console.log("Success:", res.data);
      alert("Utilization Log Saved Successfully!");
      window.location.reload();

    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.error("Axios submit error:", err.response?.data || err.message);
        alert(`Error: ${err.response?.data?.exception || "Failed to save"}`);
      } else {
        console.error("Unexpected error:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!record) return alert("Record not found");
    if (["Breakdown", "Idle"].includes(formData.status)) {
      if (!formData.fromDate || !formData.toDate) {
        return alert("From Date and To Date are required for Breakdown/Idle status.");
      }
    }

    setIsSubmitting(true);

    try {
      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include"
      });
      const tokenResult = await tokenResp.json();
      const csrfToken = tokenResult.message;
      const payload = {
        date: formData.date,
        from_date: formData.fromDate,
        to_date: formData.toDate,
        shift: formData.shift,
        plant: formData.plant,
        cost_center: formData.costCenter,
        warehouse: formData.warehouse,
        vehicle: formData.vehicle,
        supervisor_name: formData.supervisorName,
        hmr: formData.hmr,
        status: formData.status,
      };
      await axios.put(
        getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${encodeURIComponent(record.name)}`),
        payload,
        {
          withCredentials: true,
          headers: {
            "X-Frappe-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Utilization Log Updated Successfully!");
      window.location.reload();

    } catch (err: any) {
      console.error("Update error:", err.response?.data || err);
      alert("Failed to update utilization log.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const isBusy = isLoading || isSubmitting
  const ShowTimeField = ["Breakdown", "Idle"].includes(formData.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white p-0 gap-0 overflow-hidden rounded-xl">
        {/* HEADER */}
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {record ? "Edit Utilization Event" : "Log Utilization Event"}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* BODY WITH SCROLL */}
        <div className="p-6 pt-2 space-y-6 overflow-y-auto max-h-[80vh]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}

          {/* --- TOP SECTION: GENERAL INFO --- */}
          <div className="bg-slate-100/50 p-5 rounded-lg border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">Posting Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  disabled={isBusy}
                  className="bg-white border-gray-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Supervisor */}
              <div className="space-y-1.5">
                <Label htmlFor="supervisorName" className="text-sm font-medium text-gray-700">Supervisor Name</Label>
                <ReusableCombobox
                  options={supervisorOptions}
                  value={formData.supervisorName}
                  onValueChange={(v: string) => handleSelectChange("supervisorName", v)}
                  placeholder="Select Supervisor"
                  searchPlaceholder="Search user..."
                  displayField="full_name"
                  isLoading={isBusy}
                />
              </div>

              {/* --- NEW: FROM DATE --- */}
              {ShowTimeField && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">From Date & Time</Label>
                    <Input
                      id="fromDate"
                      name="fromDate"
                      type="datetime-local"
                      value={formData.fromDate}
                      onChange={handleInputChange}
                      disabled={isBusy}
                      className="bg-white border-gray-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>


                  <div className="space-y-1.5">
                    <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">To Date & Time</Label>
                    <Input
                      id="toDate"
                      name="toDate"
                      type="datetime-local"
                      value={formData.toDate}
                      onChange={handleInputChange}
                      disabled={isBusy}
                      className="bg-white border-gray-200 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Plant */}
              <div className="space-y-1.5">
                <Label htmlFor="plant" className="text-sm font-medium text-gray-700">Plant</Label>
                <ReusableCombobox
                  options={plantOptions}
                  value={formData.plant}
                  onValueChange={(v: string) => handleSelectChange("plant", v)}
                  placeholder="Select Plant"
                  searchPlaceholder="Search plant..."
                  isLoading={isBusy}
                />
              </div>

              {/* Warehouse */}
              <div className="space-y-1.5">
                <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">Source Warehouse</Label>
                <ReusableCombobox
                  options={warehouseOptions}
                  value={formData.warehouse}
                  onValueChange={(v: string) => handleSelectChange("warehouse", v)}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouse..."
                  isLoading={isBusy}
                />
              </div>

              {/* Cost Center */}
              <div className="space-y-1.5">
                <Label htmlFor="costCenter" className="text-sm font-medium text-gray-700">Cost Center</Label>
                <ReusableCombobox
                  options={costCenterOptions}
                  value={formData.costCenter}
                  onValueChange={(v: string) => handleSelectChange("costCenter", v)}
                  placeholder="Select cost center"
                  searchPlaceholder="Search cost center..."
                  isLoading={isBusy}
                />
              </div>

              {/* Shift */}
              <div className="space-y-1.5">
                <Label htmlFor="shift" className="text-sm font-medium text-gray-700">Shift</Label>
                <ReusableCombobox
                  options={shiftOptions}
                  value={formData.shift}
                  onValueChange={(v: string) => handleSelectChange("shift", v)}
                  placeholder="Select shift"
                  searchPlaceholder="Search shift..."
                  isLoading={isBusy}
                />
              </div>

            </div>
          </div>

          {/* --- BOTTOM SECTION: DETAILS --- */}
          <div className="bg-slate-100/50 p-5 rounded-lg border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

              {/* Vehicle */}
              <div className="space-y-1.5">
                <Label htmlFor="vehicle" className="text-sm font-medium text-gray-700">Registration No</Label>
                <ReusableCombobox
                  options={vehicleOptions}
                  value={formData.vehicle}
                  onValueChange={(v: string) => handleSelectChange("vehicle", v)}
                  placeholder="Select vehicle"
                  searchPlaceholder="Search vehicle..."
                  isLoading={isBusy}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <ReusableCombobox
                  options={statusOptions}
                  value={formData.status}
                  onValueChange={(v: string) => handleSelectChange("status", v)}
                  placeholder="Select status"
                  searchPlaceholder="Search status..."
                  isLoading={isBusy}
                />
              </div>

              {/* HMR */}
              <div className="space-y-1.5">
                <Label htmlFor="hmr" className="text-sm font-medium text-gray-700">Current HMR/Kms</Label>
                <Input
                  id="hmr"
                  name="hmr"
                  type="number"
                  step="0.1"
                  value={formData.hmr}
                  onChange={handleInputChange}
                  placeholder="e.g., 125430.5"
                  disabled={isBusy}
                  className="bg-white border-gray-200"
                />
              </div>

            </div>
          </div>

        </div>

        {/* FOOTER */}
        <DialogFooter className="p-6 pt-2 gap-3 flex justify-end border-t border-transparent">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
            className="px-6 border-gray-300 text-gray-700"
          >
            Cancel
          </Button>

          {!record && (
            <Button
              onClick={handleSubmit}
              disabled={isBusy}
              className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Saving..." : "Save Utilization Log"}
            </Button>
          )}

          {record && (
            <Button
              onClick={handleUpdate}
              disabled={isBusy}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Updating..." : "Update Utilization Log"}
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
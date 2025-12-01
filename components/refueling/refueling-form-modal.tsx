"use client"
import React, { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Trash2 } from "lucide-react"
import axios from "axios"

import { RefuelingTopForm } from "./RefuelingTopForm"
import { FuelEntryForm } from "./FuelEntryForm"

const FRAPPE_BASE_URL = "http://localhost:8000"
const DOCTYPE = "Vehicle Refueling"

interface FrappeDoc {
  name: string
  [key: string]: any
}

interface VehicleDoc extends FrappeDoc {
  last_odometer?: number
}

export interface FuelEntry {
  id: string
  vehicle: string
  registrationName: string
  date: string
  fuelQty: number
  current_hmrkms: number
  fuelConsumption: number
}

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  record: { name: string } | null
  // ⭐ NEW: Callback to refresh table after save
  onSuccess?: () => void 
}

export function RefuelingFormModal({ isOpen, onClose, record, onSuccess }: ModalProps) {
  // --- Form State ---
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

  // --- UI State ---
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // --- Frappe Data State ---
  const [docStatus, setDocStatus] = useState<number>(0)
  const [currentName, setCurrentName] = useState<string | null>(null)

  // --- Options State ---
  const [issuerOptions, setIssuerOptions] = useState<FrappeDoc[]>([])
  const [companyOptions, setCompanyOptions] = useState<FrappeDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
  const [itemOptions, setItemOptions] = useState<FrappeDoc[]>([])
  const [costCenterOptions, setCostCenterOptions] = useState<FrappeDoc[]>([])
  const [vehicleOptions, setVehicleOptions] = useState<VehicleDoc[]>([])

  // --- Helpers ---
  const fetchOptions = async (doctype: string, fields = ["name"]) => {
    const fieldsParam = encodeURIComponent(JSON.stringify(fields))
    try {
      const res = await fetch(
        `${FRAPPE_BASE_URL}/api/resource/${doctype}?fields=${fieldsParam}&limit_page_length=2000`,
        { credentials: "include" }
      )
      const json = await res.json()
      return json.data || []
    } catch (error) {
      console.error(`Error fetching ${doctype}`, error)
      return []
    }
  }

  const getCSRF = async () => {
    const res = await fetch(
      `${FRAPPE_BASE_URL}/api/method/vms.api.get_csrf_token`,
      { credentials: "include" }
    )
    const json = await res.json()
    return json.message
  }

  const loadRecord = useCallback(async (name: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `${FRAPPE_BASE_URL}/api/resource/${DOCTYPE}/${encodeURIComponent(name)}`,
        { credentials: "include" }
      )
      const json = await res.json()
      const doc = json.data

      setCurrentName(doc.name)
      setDocStatus(doc.docstatus)

      setFormData({
        date: doc.date,
        issuerName: doc.issuer_name,
        company: doc.company,
        sourceWarehouse: doc.source_warehouse,
        fuelItem: doc.fuel_item,
        costCenter: doc.cost_center,
      })

      const mapped: FuelEntry[] = (doc.vehicle_refueling_details || []).map(
        (d: any) => ({
          id: d.name,
          vehicle: d.vehicle,
          registrationName: d.registration_no,
          date: d.date,
          fuelQty: d.fuel_qty_in_ltrs ?? d.fuel_qty ?? 0,
          current_hmrkms: d.current_hmrkms,
          fuelConsumption: d.fuel_consumption,
        })
      )
      setFuelEntries(mapped)
      setIsEditMode(doc.docstatus === 0)
    } catch (e) {
      console.error("loadRecord error", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // --- Effects ---
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const init = async () => {
      try {
        setIsLoading(true)
        const [users, companies, warehouses, items, centers, vehicles] =
          await Promise.all([
            fetchOptions("User"),
            fetchOptions("Company"),
            fetchOptions("Warehouse"),
            fetchOptions("Item", ["name", "item_name"]),
            fetchOptions("Cost Center"),
            fetchOptions("Vehicle Master"),
          ])
        
        if (cancelled) return

        setIssuerOptions(users)
        setCompanyOptions(companies)
        setWarehouseOptions(warehouses)
        setItemOptions(items)
        setCostCenterOptions(centers)
        setVehicleOptions(vehicles)

        if (record?.name) {
          await loadRecord(record.name)
        } else {
          // Reset to New
          setCurrentName(null)
          setDocStatus(0)
          setIsEditMode(true)
          setFuelEntries([])
          setFormData((p) => ({
            ...p,
            date: new Date().toISOString().split("T")[0],
          }))
        }
      } catch (err) {
        console.error("Initialization error", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    init()

    return () => {
      cancelled = true
    }
    // ⭐ NOTE: Removed handleSave/handleSubmit from dependencies to fix loop
  }, [isOpen, record, loadRecord])

  // --- Handlers ---

  const addFuelEntry = () => {
    if (!newEntry.vehicle || !newEntry.fuelQty) return

    const entry: FuelEntry = {
      id: `${Date.now()}`,
      vehicle: newEntry.vehicle!,
      registrationName: newEntry.registrationName || newEntry.vehicle!,
      date: newEntry.date!,
      fuelQty: newEntry.fuelQty!,
      current_hmrkms: newEntry.current_hmrkms || 0,
      fuelConsumption: newEntry.fuelConsumption || 0,
    }

    setFuelEntries((prev) => [...prev, entry])
    setNewEntry({
      vehicle: "",
      registrationName: "",
      date: new Date().toISOString().split("T")[0],
      fuelQty: 0,
      current_hmrkms: 0,
      fuelConsumption: 0,
    })
  }

  const removeFuelEntry = (id: string) => {
    setFuelEntries((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const csrf = await getCSRF()

      const payload = {
        ...(currentName ? { name: currentName } : {}),
        date: formData.date,
        issuer_name: formData.issuerName,
        company: formData.company,
        source_warehouse: formData.sourceWarehouse,
        fuel_item: formData.fuelItem,
        cost_center: formData.costCenter,
        vehicle_refueling_details: fuelEntries,
      }

      const fd = new FormData()
      fd.append("data", JSON.stringify(payload))

      const res = await axios.post(
        `${FRAPPE_BASE_URL}/api/method/vms.api.save_vehicle_refueling`,
        fd,
        { withCredentials: true, headers: { "X-Frappe-CSRF-Token": csrf } }
      )

      const name = res.data.message.message.name
      const status = res.data.message.message.docstatus
      console.log("hello",res.data,name,status)
     
      setCurrentName(name)
      setDocStatus(status)
      setIsEditMode(true)

      alert(currentName ? "Updated successfully" : "Saved successfully")
      // ⭐ Notify parent to refresh table
      if (onSuccess) onSuccess() 

    } catch (err) {
      console.error(err)
      alert("Error saving")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (fuelEntries.length === 0) {
      alert("Please add at least one fuel entry.")
      return
    }

    setIsSubmitting(true)
    try {
      const csrf = await getCSRF()

      const payload: any = {
        ...(currentName ? { name: currentName } : {}),
        date: formData.date,
        issuer_name: formData.issuerName,
        company: formData.company,
        source_warehouse: formData.sourceWarehouse,
        fuel_item: formData.fuelItem,
        cost_center: formData.costCenter,
        submit: true,
        vehicle_refueling_details: fuelEntries.map((f) => ({
          vehicle: f.vehicle,
          date: f.date,
          fuel_qty: f.fuelQty,
          current_hmrkms: f.current_hmrkms,
          fuel_consumption: f.fuelConsumption,
        })),
      }

      const fd = new FormData()
      fd.append("data", JSON.stringify(payload))

      const res = await axios.post(
        `${FRAPPE_BASE_URL}/api/method/vms.api.submit_vehicle_refueling`,
        fd,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrf },
        }
      )

      // Update local state to Submitted
      const docName = res.data.message?.name || currentName
      setCurrentName(docName)
      setDocStatus(1) // 1 = Submitted
      setIsEditMode(false)

      alert("Saved & Submitted successfully.")
      // ⭐ Notify parent to refresh table
      if (onSuccess) onSuccess()
        onClose()
       

    } catch (e) {
      console.error("submit error", e)
      alert("Error while submitting.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusAction = async () => {
    setIsSubmitting(true)
    try {
      const csrf = await getCSRF()

      // CANCEL
      if (docStatus === 1 && currentName) {
        const fd = new FormData()
        fd.append("name", currentName)

        await fetch(
          `${FRAPPE_BASE_URL}/api/method/vms.api.cancel_vehicle_refueling`,
          {
            method: "POST",
            credentials: "include",
            headers: { "X-Frappe-CSRF-Token": csrf },
            body: fd,
          }
        )

        setDocStatus(2) // 2 = Cancelled
        alert("Cancelled successfully.")
        if (onSuccess) onSuccess()
        return
      }

      // AMEND (Make Draft)
      if (docStatus === 2 && currentName) {
        const fd = new FormData()
        fd.append("name", currentName)

        const res = await fetch(
          `${FRAPPE_BASE_URL}/api/method/vms.api.amend_vehicle_refueling`,
          {
            method: "POST",
            credentials: "include",
            headers: { "X-Frappe-CSRF-Token": csrf },
            body: fd,
          }
        )
        const json = await res.json()
        const newName = json.message?.name

        // Switch context to the new Draft document
        setCurrentName(newName)
        setDocStatus(0)
        setIsEditMode(true)
        
        alert("Draft created. You are now editing the new Draft.")
        if (onSuccess) onSuccess()
      }
    } catch (e) {
      console.error("status action error", e)
      alert("Error performing action.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isLoading || isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {docStatus === 0 ? "Refueling (Draft)" : 
             docStatus === 1 ? "Refueling (Submitted)" : 
             "Refueling (Cancelled)"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}

        <div className={isBusy ? "opacity-50 pointer-events-none" : ""}>
          <RefuelingTopForm
            formData={formData}
            setFormData={setFormData}
            issuerOptions={issuerOptions}
            companyOptions={companyOptions}
            warehouseOptions={warehouseOptions}
            itemOptions={itemOptions}
            costCenterOptions={costCenterOptions}
            isEditMode={isEditMode}
          />

          <h3 className="font-semibold text-lg mt-4">Fuel Entry</h3>

          {isEditMode && (
            <FuelEntryForm
              newEntry={newEntry}
              setNewEntry={setNewEntry}
              vehicleOptions={vehicleOptions}
              addFuelEntry={addFuelEntry}
            />
          )}

          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Reg No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>HMR</TableHead>
                <TableHead>Consumption</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelEntries.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.registrationName}</TableCell>
                  <TableCell>{f.date}</TableCell>
                  <TableCell>{f.fuelQty}</TableCell>
                  <TableCell>{f.current_hmrkms}</TableCell>
                  <TableCell>{f.fuelConsumption}</TableCell>
                  <TableCell>
                    {isEditMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFuelEntry(f.id)}
                      >
                        <Trash2 className="text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="gap-2 flex justify-end">
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Close
          </Button>

          {/* 1️⃣ SAVE / UPDATE */}
          {docStatus === 0 && (
            <Button onClick={handleSave} disabled={isBusy}>
              {currentName ? "Update" : "Save"}
            </Button>
          )}

          {/* 2️⃣ SUBMIT (Visible if Saved Draft) */}
          {currentName && docStatus === 0 && (
            <Button 
              onClick={handleSubmit} 
              disabled={isBusy} 
              className="bg-green-600 hover:bg-green-700"
            >
              Submit
            </Button>
          )}

          {/* 3️⃣ CANCEL */}
          {docStatus === 1 && (
            <Button
              onClick={handleStatusAction}
              disabled={isBusy}
              className="bg-red-600 text-white"
            >
              Cancel
            </Button>
          )}

          {/* 4️⃣ DRAFT */}
          {docStatus === 2 && (
            <Button
              onClick={handleStatusAction}
              disabled={isBusy}
              className="bg-yellow-600 text-white"
            >
              Draft
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
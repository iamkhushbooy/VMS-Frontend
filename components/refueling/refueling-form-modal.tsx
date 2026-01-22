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
import { getApiUrl, config } from "@/lib/config"
import { useAuthStore } from "@/context/auth_store"

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

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [docStatus, setDocStatus] = useState<number>(0)
  const [currentName, setCurrentName] = useState<string | null>(null)
  const [issuerOptions, setIssuerOptions] = useState<FrappeDoc[]>([])
  const [companyOptions, setCompanyOptions] = useState<FrappeDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
  const [itemOptions, setItemOptions] = useState<FrappeDoc[]>([])
  const [costCenterOptions, setCostCenterOptions] = useState<FrappeDoc[]>([])
  const [vehicleOptions, setVehicleOptions] = useState<VehicleDoc[]>([])
  const [allEmployeeOptions, setAllEmployeeOptions] = useState<FrappeDoc[]>([])
  const [allWarehouseOptions, setAllWarehouseOptions] = useState<FrappeDoc[]>([])
  const { user } = useAuthStore()
  const getErrorMessage = (err: any) => {
    let msg = '';
    if (typeof err?.response?.data === 'string' && (err.response.data.includes('<!DOCTYPE') || err.response.data.includes('<html'))) {
        return 'Server is currently unavailable. Please check your internet connection or try again later.';
    }
    if (err?.response?.data?._server_messages) {
        try {
            const messages = JSON.parse(err.response.data._server_messages);
            if (Array.isArray(messages) && messages.length > 0) {
                const firstMsg = JSON.parse(messages[0]);
                msg = firstMsg.message;
            }
        } catch (e) { /* Fallthrough */ }
    }
    else if (err?.response?.data?.exception) {
        const exc = err.response.data.exception;
        if (typeof exc === 'string' && exc.includes(':')) {
            msg = exc.split(':').slice(1).join(':').trim();
        } else {
            msg = exc;
        }
    }
    if (!msg) {
        msg = err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
    }
    return msg.replace(/<[^>]*>/g, '');
  };
  const fetchOptions = async (doctype: string, fields = ["name"]) => {
    const fieldsParam = encodeURIComponent(JSON.stringify(fields))
    try {
      const res = await fetch(
        `${getApiUrl(config.api.resource(doctype))}?fields=${fieldsParam}&limit_page_length=2000`,
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
      getApiUrl(config.api.getCsrfToken),
      { credentials: "include" }
    )
    const json = await res.json()
    return json.message
  }

  const fetchWarehouseMeta = async (warehouseName: string) => {
    if (!warehouseName) return null;

    const fieldsParam = encodeURIComponent(
      JSON.stringify(["name", "cost_center"])   // company removed
    );

    try {
      const res = await fetch(
        `${getApiUrl(config.api.resource("Warehouse"))}/${encodeURIComponent(
          warehouseName
        )}?fields=${fieldsParam}`,
        { credentials: "include" }
      );

      const json = await res.json();


      return json.data || null;
    } catch (error) {
      console.error("Error fetching Warehouse meta", error);
      return null;
    }
  };


  const loadRecord = useCallback(async (name: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(
        getApiUrl(`${config.api.resource(DOCTYPE)}/${encodeURIComponent(name)}`),
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
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const loadDropdowns = async () => {
      try {
        // const url = getApiUrl(
        //   `/api/resource/User Permission?filters=${encodeURIComponent(
        //     JSON.stringify([
        //       ["user", "=", user.email],
        //       ["allow", "=", "Company"]
        //     ])
        //   )}&fields=${encodeURIComponent(JSON.stringify(["for_value", "allow"]))}`
        // );

        // const x = await fetch(url, {
        //   method: "GET",
        //   credentials: "include",
        // });

        const url = getApiUrl(
          `/api/resource/Company?fields=${encodeURIComponent(JSON.stringify(["name"]))}`
        );
        const x = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        // const companyData = await x.json();
        // const assignedCompanies = companyData?.data?.map((c: { for_value: string }) => c.for_value) || [];
        const companyData = await x.json();
        const assignedCompanies =
          companyData?.data?.map((c: { name: string }) => c.name) || [];


        setIsLoading(true)
        const [allCompanies, warehousesAll, items, centers, vehicles] =
          await Promise.all([
            fetchOptions("Company"),
            fetchOptions("Warehouse", ["name", "company"]),
            fetchOptions("Item", ["name", "item_name"]),
            fetchOptions("Cost Center"),
            fetchOptions("Vehicle Master"),
          ])

        const filteredCompanies = allCompanies.filter((item: { name: string }) =>
          assignedCompanies.includes(item.name)
        );
        const url1 = getApiUrl("/api/method/vms.api.get_all_employees");

        const employeesAll = await fetch(url1, {
          method: "GET",
          credentials: "include"
        });

        const eAll = await employeesAll.json();


        if (cancelled) return
        setCompanyOptions(filteredCompanies)
        setItemOptions(items)
        setCostCenterOptions(centers)
        setVehicleOptions(vehicles)
        setAllEmployeeOptions(eAll.message);
        setAllWarehouseOptions(warehousesAll);
        if (!record && filteredCompanies.length > 0) {
          setFormData(prev => ({
            ...prev,
            company: prev.company || filteredCompanies[0].name
          }))
        }
        setIssuerOptions([])
        setWarehouseOptions([])

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
        console.error("loadDropdowns error", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    loadDropdowns()
    return () => {
      cancelled = true
    }
  }, [isOpen, record, loadRecord])
  const checkWarehouseSelection = () => {
    if (!formData.costCenter) {
      alert("Please select a Source Warehouse first to filter the Issuer Name.");
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchFilteredEmployees = async () => {
      if (!formData.company) {
        setIssuerOptions([]);
        setWarehouseOptions([]);
        return;
      }

      const filteredWarehouses = allWarehouseOptions.filter(
        wh => wh.company === formData.company
      );
      setWarehouseOptions(filteredWarehouses);

      if (formData.costCenter) {
        setIsLoading(true);
        try {

          const targetCostCenter = formData.costCenter;

          if (targetCostCenter) {
            const url = getApiUrl(`/api/resource/Employee?filters=${encodeURIComponent(
              JSON.stringify([
                ["company", "=", formData.company],
                ["payroll_cost_center", "=", targetCostCenter],
                ["status", "=", "Active"]
              ])
            )}&fields=${encodeURIComponent(JSON.stringify(["name", "employee_name", "company", "payroll_cost_center"]))}&limit_page_length=None`);

            const response = await fetch(url, { method: "GET", credentials: "include" });
            const result = await response.json();
            setIssuerOptions(result.data || []);
          }
        } catch (error) {
          console.error("Failed to fetch filtered employees:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Alert removed from here to stop it showing on form open
        const companyEmployees = allEmployeeOptions.filter(emp => emp.company === formData.company);
        setIssuerOptions(companyEmployees);
      }
    };

    fetchFilteredEmployees();
  }, [formData.company, formData.costCenter, allWarehouseOptions]);

  useEffect(() => {
    if (!formData.sourceWarehouse) return;

    let cancelled = false;

    const autoFillFromWarehouse = async () => {
      const w = await fetchWarehouseMeta(formData.sourceWarehouse);
      if (!w || cancelled) return;

      const costCenter =
        w.cost_center ||
        w.default_cost_center ||
        w.parent_cost_center ||
        w.costcenter ||
        "";

      setFormData((prev) => ({
        ...prev,
        costCenter: costCenter || prev.costCenter,
      }));
    };

    autoFillFromWarehouse();

    return () => {
      cancelled = true;
    };
  }, [formData.sourceWarehouse]);

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
        getApiUrl(config.api.method("vms.api.save_vehicle_refueling")),
        fd,
        { withCredentials: true, headers: { "X-Frappe-CSRF-Token": csrf } }
      )

      const name = res.data.message.message.name
      const status = res.data.message.message.docstatus

      setCurrentName(name)
      setDocStatus(status)
      setIsEditMode(true)

      alert(currentName ? "Updated successfully" : "Saved successfully")
      if (onSuccess) onSuccess()

    } catch (err:any) {
      const errorMsg = getErrorMessage(err);
      alert(errorMsg);
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
        getApiUrl(config.api.method("vms.api.submit_vehicle_refueling")),
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
          getApiUrl(config.api.method("vms.api.cancel_vehicle_refueling")),
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
          getApiUrl(config.api.method("vms.api.amend_vehicle_refueling")),
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
      <DialogContent className=" overflow-y-auto">
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
            onEmployeeFieldClick={checkWarehouseSelection}
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

          {docStatus === 0 && (
            <Button onClick={handleSave} disabled={isBusy}>
              {currentName ? "Update" : "Save"}
            </Button>
          )}

          {currentName && docStatus === 0 && (
            <Button
              onClick={handleSubmit}
              disabled={isBusy}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit
            </Button>
          )}


          {docStatus === 1 && (
            <Button
              onClick={handleStatusAction}
              disabled={isBusy}
              className="bg-red-600 text-white"
            >
              Cancel
            </Button>
          )}

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
































// "use client"
// import React, { useState, useEffect, useCallback } from "react"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { Loader2, Trash2 } from "lucide-react"
// import axios from "axios"

// import { RefuelingTopForm } from "./RefuelingTopForm"
// import { FuelEntryForm } from "./FuelEntryForm"

// import { getApiUrl, config } from "@/lib/config"
// import { useAuthStore } from "@/context/auth_store"
// const DOCTYPE = "Vehicle Refueling"

// interface FrappeDoc {
//   name: string
//   [key: string]: any
// }

// interface VehicleDoc extends FrappeDoc {
//   last_odometer?: number
// }

// export interface FuelEntry {
//   id: string
//   vehicle: string
//   registrationName: string
//   date: string
//   fuelQty: number
//   current_hmrkms: number
//   fuelConsumption: number
// }

// interface ModalProps {
//   isOpen: boolean
//   onClose: () => void
//   record: { name: string } | null
//   onSuccess?: () => void
// }

// export function RefuelingFormModal({ isOpen, onClose, record, onSuccess }: ModalProps) {
//   // --- Form State ---
//   const [formData, setFormData] = useState({
//     date: new Date().toISOString().split("T")[0],
//     issuerName: "",
//     company: "",
//     sourceWarehouse: "",
//     fuelItem: "",
//     costCenter: "",
//   })

//   const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([])
//   const [newEntry, setNewEntry] = useState<Partial<FuelEntry>>({
//     vehicle: "",
//     registrationName: "",
//     date: new Date().toISOString().split("T")[0],
//     fuelQty: 0,
//     current_hmrkms: 0,
//     fuelConsumption: 0,
//   })

//   // --- UI State ---
//   const [isLoading, setIsLoading] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [isEditMode, setIsEditMode] = useState(false)

//   // --- Frappe Data State ---
//   const [docStatus, setDocStatus] = useState<number>(0)
//   const [currentName, setCurrentName] = useState<string | null>(null)

//   // --- Options State ---
//   const [issuerOptions, setIssuerOptions] = useState<FrappeDoc[]>([])
//   const [companyOptions, setCompanyOptions] = useState<FrappeDoc[]>([])
//   const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
//   const [itemOptions, setItemOptions] = useState<FrappeDoc[]>([])
//   const [costCenterOptions, setCostCenterOptions] = useState<FrappeDoc[]>([])
//   const [vehicleOptions, setVehicleOptions] = useState<VehicleDoc[]>([])
//   const { user } = useAuthStore();
//   // --- Helpers ---
//   const fetchOptions = async (doctype: string, fields = ["name"]) => {
//     const fieldsParam = encodeURIComponent(JSON.stringify(fields))
//     try {
//       const res = await fetch(
//         `${getApiUrl(config.api.resource(doctype))}?fields=${fieldsParam}&limit_page_length=2000`,
//         { credentials: "include" }
//       )
//       const json = await res.json()
//       return json.data || []
//     } catch (error) {
//       console.error(`Error fetching ${doctype}`, error)
//       return []
//     }
//   }

//   const getCSRF = async () => {
//     const res = await fetch(
//       getApiUrl(config.api.getCsrfToken),
//       { credentials: "include" }
//     )
//     const json = await res.json()
//     return json.message
//   }

//   const loadRecord = useCallback(async (name: string) => {
//     setIsLoading(true)
//     try {
//       const res = await fetch(
//         getApiUrl(`${config.api.resource(DOCTYPE)}/${encodeURIComponent(name)}`),
//         { credentials: "include" }
//       )
//       const json = await res.json()
//       const doc = json.data

//       setCurrentName(doc.name)
//       setDocStatus(doc.docstatus)

//       setFormData({
//         date: doc.date,
//         issuerName: doc.issuer_name,
//         company: doc.company,
//         sourceWarehouse: doc.source_warehouse,
//         fuelItem: doc.fuel_item,
//         costCenter: doc.cost_center,
//       })

//       const mapped: FuelEntry[] = (doc.vehicle_refueling_details || []).map(
//         (d: any) => ({
//           id: d.name,
//           vehicle: d.vehicle,
//           registrationName: d.registration_no,
//           date: d.date,
//           fuelQty: d.fuel_qty_in_ltrs ?? d.fuel_qty ?? 0,
//           current_hmrkms: d.current_hmrkms,
//           fuelConsumption: d.fuel_consumption,
//         })
//       )
//       setFuelEntries(mapped)
//       setIsEditMode(doc.docstatus === 0)
//     } catch (e) {
//       console.error("loadRecord error", e)
//     } finally {
//       setIsLoading(false)
//     }
//   }, [])

//   // --- Effects ---
//   useEffect(() => {
//     if (!isOpen) return
//     let cancelled = false

//     const loadDropdowns = async () => {
//       try {
//         const x = await fetch(
//           `http://localhost:8000/api/resource/User%20Permission?filters=${encodeURIComponent(
//             JSON.stringify([
//               ["user", "=", user.email],
//               ["allow", "=", "Company"]
//             ])
//           )}&fields=${encodeURIComponent(JSON.stringify(["for_value", "allow"]))}`,
//           { method: "GET", credentials: "include" }
//         );

//         const companyData = await x.json();
//         // const assignedCompanies = companyData?.data?.map(c => c.for_value) || [];
//         const assignedCompanies = companyData?.data[0].for_value
//         console.log("Assigned Companies:", assignedCompanies, companyData, companyData.data);


//         const y = await fetch(
//           `http://localhost:8000/api/resource/User%20Permission?filters=${encodeURIComponent(
//             JSON.stringify([
//               ["allow", "=", "Company"],
//               ["for_value","=",assignedCompanies]

//             ])
//           )}&fields=${encodeURIComponent(JSON.stringify(["user"]))}`,
//           { method: "GET", credentials: "include" }
//         );

//         const userData = await y.json();
//         const users = userData?.data?.map(c => c.user) || [];
//         // const assignedCompanies = companyData?.data[0].for_value
//         console.log("userAssigned Companies:", users);



//         setIsLoading(true)
//         const [companies, warehouses, items, centers, vehicles] =
//           await Promise.all([
//             fetchOptions("Company"),
//             fetchOptions("Warehouse"),
//             fetchOptions("Item", ["name", "item_name"]),
//             fetchOptions("Cost Center"),
//             fetchOptions("Vehicle Master"),
//           ])

//         if (cancelled) return

//         setIssuerOptions(users)
//         setCompanyOptions(companies)
//         setWarehouseOptions(warehouses)
//         setItemOptions(items)
//         setCostCenterOptions(centers)
//         setVehicleOptions(vehicles)

//         if (record?.name) {
//           await loadRecord(record.name)
//         } else {
//           // Reset to New
//           setCurrentName(null)
//           setDocStatus(0)
//           setIsEditMode(true)
//           setFuelEntries([])
//           setFormData((p) => ({
//             ...p,
//             date: new Date().toISOString().split("T")[0],
//           }))
//         }
//       } catch (err) {
//         console.error("loadDropdownsialization error", err)
//       } finally {
//         if (!cancelled) setIsLoading(false)
//       }
//     }

//     loadDropdowns()

//     return () => {
//       cancelled = true
//     }
//   }, [isOpen, record, loadRecord])

//   // --- Handlers ---

//   const addFuelEntry = () => {
//     if (!newEntry.vehicle || !newEntry.fuelQty) return

//     const entry: FuelEntry = {
//       id: `${Date.now()}`,
//       vehicle: newEntry.vehicle!,
//       registrationName: newEntry.registrationName || newEntry.vehicle!,
//       date: newEntry.date!,
//       fuelQty: newEntry.fuelQty!,
//       current_hmrkms: newEntry.current_hmrkms || 0,
//       fuelConsumption: newEntry.fuelConsumption || 0,
//     }

//     setFuelEntries((prev) => [...prev, entry])
//     setNewEntry({
//       vehicle: "",
//       registrationName: "",
//       date: new Date().toISOString().split("T")[0],
//       fuelQty: 0,
//       current_hmrkms: 0,
//       fuelConsumption: 0,
//     })
//   }

//   const removeFuelEntry = (id: string) => {
//     setFuelEntries((prev) => prev.filter((f) => f.id !== id))
//   }

//   const handleSave = async () => {
//     setIsSubmitting(true)
//     try {
//       const csrf = await getCSRF()

//       const payload = {
//         ...(currentName ? { name: currentName } : {}),
//         date: formData.date,
//         issuer_name: formData.issuerName,
//         company: formData.company,
//         source_warehouse: formData.sourceWarehouse,
//         fuel_item: formData.fuelItem,
//         cost_center: formData.costCenter,
//         vehicle_refueling_details: fuelEntries,
//       }

//       const fd = new FormData()
//       fd.append("data", JSON.stringify(payload))

//       const res = await axios.post(
//         getApiUrl(config.api.method("vms.api.save_vehicle_refueling")),
//         fd,
//         { withCredentials: true, headers: { "X-Frappe-CSRF-Token": csrf } }
//       )

//       const name = res.data.message.message.name
//       const status = res.data.message.message.docstatus
//       console.log("hello", res.data, name, status)

//       setCurrentName(name)
//       setDocStatus(status)
//       setIsEditMode(true)

//       alert(currentName ? "Updated successfully" : "Saved successfully")
//       if (onSuccess) onSuccess()

//     } catch (err) {
//       console.error(err)
//       alert("Error saving")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleSubmit = async () => {
//     if (fuelEntries.length === 0) {
//       alert("Please add at least one fuel entry.")
//       return
//     }

//     setIsSubmitting(true)
//     try {
//       const csrf = await getCSRF()

//       const payload: any = {
//         ...(currentName ? { name: currentName } : {}),
//         date: formData.date,
//         issuer_name: formData.issuerName,
//         company: formData.company,
//         source_warehouse: formData.sourceWarehouse,
//         fuel_item: formData.fuelItem,
//         cost_center: formData.costCenter,
//         submit: true,
//         vehicle_refueling_details: fuelEntries.map((f) => ({
//           vehicle: f.vehicle,
//           date: f.date,
//           fuel_qty: f.fuelQty,
//           current_hmrkms: f.current_hmrkms,
//           fuel_consumption: f.fuelConsumption,
//         })),
//       }

//       const fd = new FormData()
//       fd.append("data", JSON.stringify(payload))

//       const res = await axios.post(
//         getApiUrl(config.api.method("vms.api.submit_vehicle_refueling")),
//         fd,
//         {
//           withCredentials: true,
//           headers: { "X-Frappe-CSRF-Token": csrf },
//         }
//       )

//       // Update local state to Submitted
//       const docName = res.data.message?.name || currentName
//       setCurrentName(docName)
//       setDocStatus(1) // 1 = Submitted
//       setIsEditMode(false)

//       alert("Saved & Submitted successfully.")
//       if (onSuccess) onSuccess()
//       onClose()


//     } catch (e) {
//       console.error("submit error", e)
//       alert("Error while submitting.")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleStatusAction = async () => {
//     setIsSubmitting(true)
//     try {
//       const csrf = await getCSRF()

//       // CANCEL
//       if (docStatus === 1 && currentName) {
//         const fd = new FormData()
//         fd.append("name", currentName)

//         await fetch(
//           getApiUrl(config.api.method("vms.api.cancel_vehicle_refueling")),
//           {
//             method: "POST",
//             credentials: "include",
//             headers: { "X-Frappe-CSRF-Token": csrf },
//             body: fd,
//           }
//         )

//         setDocStatus(2) // 2 = Cancelled
//         alert("Cancelled successfully.")
//         if (onSuccess) onSuccess()
//         return
//       }

//       // AMEND (Make Draft)
//       if (docStatus === 2 && currentName) {
//         const fd = new FormData()
//         fd.append("name", currentName)

//         const res = await fetch(
//           getApiUrl(config.api.method("vms.api.amend_vehicle_refueling")),
//           {
//             method: "POST",
//             credentials: "include",
//             headers: { "X-Frappe-CSRF-Token": csrf },
//             body: fd,
//           }
//         )
//         const json = await res.json()
//         const newName = json.message?.name

//         // Switch context to the new Draft document
//         setCurrentName(newName)
//         setDocStatus(0)
//         setIsEditMode(true)

//         alert("Draft created. You are now editing the new Draft.")
//         if (onSuccess) onSuccess()
//       }
//     } catch (e) {
//       console.error("status action error", e)
//       alert("Error performing action.")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const isBusy = isLoading || isSubmitting

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="text-xl">
//             {docStatus === 0 ? "Refueling (Draft)" :
//               docStatus === 1 ? "Refueling (Submitted)" :
//                 "Refueling (Cancelled)"}
//           </DialogTitle>
//         </DialogHeader>

//         {isLoading && (
//           <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
//             <Loader2 className="h-10 w-10 animate-spin text-white" />
//           </div>
//         )}

//         <div className={isBusy ? "opacity-50 pointer-events-none" : ""}>
//           <RefuelingTopForm
//             formData={formData}
//             setFormData={setFormData}
//             issuerOptions={issuerOptions}
//             companyOptions={companyOptions}
//             warehouseOptions={warehouseOptions}
//             itemOptions={itemOptions}
//             costCenterOptions={costCenterOptions}
//             isEditMode={isEditMode}
//           />

//           <h3 className="font-semibold text-lg mt-4">Fuel Entry</h3>

//           {isEditMode && (
//             <FuelEntryForm
//               newEntry={newEntry}
//               setNewEntry={setNewEntry}
//               vehicleOptions={vehicleOptions}
//               addFuelEntry={addFuelEntry}
//             />
//           )}

//           <Table className="mt-3">
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Reg No</TableHead>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Qty</TableHead>
//                 <TableHead>HMR</TableHead>
//                 <TableHead>Consumption</TableHead>
//                 <TableHead>Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {fuelEntries.map((f) => (
//                 <TableRow key={f.id}>
//                   <TableCell>{f.registrationName}</TableCell>
//                   <TableCell>{f.date}</TableCell>
//                   <TableCell>{f.fuelQty}</TableCell>
//                   <TableCell>{f.current_hmrkms}</TableCell>
//                   <TableCell>{f.fuelConsumption}</TableCell>
//                   <TableCell>
//                     {isEditMode && (
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => removeFuelEntry(f.id)}
//                       >
//                         <Trash2 className="text-red-500" />
//                       </Button>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>

//         <DialogFooter className="gap-2 flex justify-end">
//           <Button variant="outline" onClick={onClose} disabled={isBusy}>
//             Close
//           </Button>

//           {docStatus === 0 && (
//             <Button onClick={handleSave} disabled={isBusy}>
//               {currentName ? "Update" : "Save"}
//             </Button>
//           )}

//           {currentName && docStatus === 0 && (
//             <Button
//               onClick={handleSubmit}
//               disabled={isBusy}
//               className="bg-green-600 hover:bg-green-700"
//             >
//               Submit
//             </Button>
//           )}


//           {docStatus === 1 && (
//             <Button
//               onClick={handleStatusAction}
//               disabled={isBusy}
//               className="bg-red-600 text-white"
//             >
//               Cancel
//             </Button>
//           )}

//           {docStatus === 2 && (
//             <Button
//               onClick={handleStatusAction}
//               disabled={isBusy}
//               className="bg-yellow-600 text-white"
//             >
//               Draft
//             </Button>
//           )}
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }
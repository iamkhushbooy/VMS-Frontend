"use client"
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import axios from "axios"
import { GeneralDetailsSection } from './GeneralDetailsSection'
import { ProblemJobDetailSection } from './ProblemJobDetailsSection'
import { PartsDetailSection } from './PartsDetailsSection'
import { LubeDetailSection } from './LubeDetailsSection'
import { getApiUrl, config } from "@/lib/config"
import {
  MAINTENANCE_DOCTYPE,
  VEHICLE_DOCTYPE,
  EMPLOYEE_DOCTYPE,
  ITEM_DOCTYPE,
  priorityOptions,
  statusOptions,
  seriesOptions,
  jobCardTypeOptions,
  jsaOptions,
  housekeepingOptions,
  fetchFrappeDoctype,
  type FrappeDoc,
  type VehicleDoc,
  type ItemDoc,
  type ProblemEntry,
  type WorkDoneEntry,
  type PendingJobEntry,
  type PartEntry,
  type LubeEntry,
  type MaintenanceFormModalProps
} from "./MaintenanceShared"
export function MaintenanceFormModal({
  isOpen,
  onClose,
  log,
  onSuccess
}: MaintenanceFormModalProps) {
  const [formData, setFormData] = useState({
    series: seriesOptions[0]?.name || "",
    issuer_name: "",
    job_card_type: "",
    current_odometer_value: "" as number | string,
    registration_no: "",
    priority: "Medium",
    date_of_initiation: new Date().toISOString().slice(0, 16),
    ptw_no: "",
    status: "Pending",
    date_of_completion: "",
    jsa_jra_tool_box_task: "",
    house_keeping: "",
    working_employees: [] as string[],
    make: "",
    model: "",
    warehouse: "",
  })

  const [problemEntries, setProblemEntries] = useState<ProblemEntry[]>([])
  const [workDoneEntries, setWorkDoneEntries] = useState<WorkDoneEntry[]>([])
  const [pendingJobEntries, setPendingJobEntries] = useState<PendingJobEntry[]>([])
  const [partEntries, setPartEntries] = useState<PartEntry[]>([])
  const [lubeEntries, setLubeEntries] = useState<LubeEntry[]>([])
  const [newProblem, setNewProblem] = useState("")
  const [newWorkDone, setNewWorkDone] = useState("")
  const [newPendingJob, setNewPendingJob] = useState("")

  const [newPart, setNewPart] = useState<Omit<PartEntry, "id">>({
    item_name: "",
    item_display: "",
    item_group: "",
    uom: "",
    stock_qty: "",
    rate: "",
    qty: "",
    expense: "",
    remark: "",
  })

  const [newLube, setNewLube] = useState<Omit<LubeEntry, "id">>({
    item_name: "",
    item_display: "",
    item_group: "",
    uom: "",
    stock_qty: "",
    rate: "",
    qty: "",
    expense: "",
    remark: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vehicleOptions, setVehicleOptions] = useState<VehicleDoc[]>([])
  const [employeeOptions, setEmployeeOptions] = useState<FrappeDoc[]>([])
  const [itemOptions, setItemOptions] = useState<ItemDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])

  const [docStatus, setDocStatus] = useState<number>(0)          
  const [currentName, setCurrentName] = useState<string | null>(null)

  const fetchAvailableQty = async (itemCode: string, uom: string) => {
    try {
      const res = await axios.get(
        getApiUrl(config.api.method("vms.api.get_available_qty")),
        {
          params: { item_code: itemCode, uom },
          withCredentials: true,
        }
      );
      return res.data.message ? Number(res.data.message) : 0;
    } catch (error) {
      console.error("Stock qty fetch error:", error);
      return 0;
    }
  };

  const fetchValuationRate = async (itemCode: string, selectedWarehouse: string) => {
    if (!selectedWarehouse) {
      console.warn("No warehouse selected, cannot fetch rate");
      return 0;
    }
    try {
      console.log(`Fetching rate for: ${itemCode} in ${selectedWarehouse}`);

      const res = await axios.get(
        getApiUrl(config.api.method("vms.api.get_item_valuation_rate")),
        {
          params: { item_code: itemCode, warehouse: selectedWarehouse },
          withCredentials: true,
        }
      )
      console.log("API Response Rate:", res.data.message);
      return res.data.message ? Number(res.data.message) : 0;
    } catch (error) {
      console.error("Valuation rate fetch error:", error);
      return 0;
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

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        series: seriesOptions[0]?.name || "",
        issuer_name: "",
        job_card_type: "",
        current_odometer_value: "",
        registration_no: "",
        priority: "Medium",
        date_of_initiation: new Date().toISOString().slice(0, 16),
        ptw_no: "",
        status: "Pending",
        date_of_completion: "",
        jsa_jra_tool_box_task: "",
        house_keeping: "",
        working_employees: [],
        make: "",
        model: "",
        warehouse: "",
      })
      setProblemEntries([])
      setWorkDoneEntries([])
      setPendingJobEntries([])
      setPartEntries([])
      setLubeEntries([])
      setNewProblem("")
      setNewWorkDone("")
      setNewPendingJob("")
      setNewPart({
        item_name: "",
        item_display: "",
        item_group: "",
        uom: "",
        stock_qty: "",
        rate: "",
        qty: "",
        expense: "",
        remark: "",
      })
      setNewLube({
        item_name: "",
        item_display: "",
        item_group: "",
        uom: "",
        stock_qty: "",
        rate: "",
        qty: "",
        expense: "",
        remark: "",
      })
      setDocStatus(0)
      setCurrentName(null)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const loadDropdowns = async () => {
      try {
        const [
          vehicles,
          employees,
          items,
          warehouses
        ] = await Promise.all([
          fetchFrappeDoctype(VEHICLE_DOCTYPE, ["name", "make", "model"]) as Promise<VehicleDoc[]>,
          fetchFrappeDoctype(EMPLOYEE_DOCTYPE, ["name", "employee_name"]),
          fetchFrappeDoctype(ITEM_DOCTYPE, ["name", "item_name", "item_group", "stock_uom"]) as Promise<ItemDoc[]>,
          fetchFrappeDoctype("Warehouse", ["name"])
        ])

        if (cancelled) return
        setVehicleOptions(vehicles)
        setEmployeeOptions(employees)
        setWarehouseOptions(warehouses)
        setItemOptions(items.map(i => ({
          ...i,
          total_projected_qty: i.total_projected_qty ? Number(i.total_projected_qty) : 0,
          standard_rate: i.standard_rate ? Number(i.standard_rate) : 0,
        })))

      } catch (e) {
        console.error("loadDropdowns error:", e)
      }
    }

    const loadFullRecord = async (name: string) => {
      try {
        const url = getApiUrl(`${config.api.resource(MAINTENANCE_DOCTYPE)}/${encodeURIComponent(name)}`)
        const resp = await fetch(url, { credentials: "include" })
        if (!resp.ok) throw new Error("Failed to fetch record")

        const result = await resp.json()
        const doc = result.data || {}

        if (cancelled) return

        const findItemDisplay = (itemId: string) => {
          const item = itemOptions.find((i) => i.name === itemId)
          return item?.item_name || itemId
        }

        const loadedEmployees = (doc.working_employee || []).map((row: any) => row.employee);

        setCurrentName(doc.name || null)
        setDocStatus(typeof doc.docstatus === "number" ? doc.docstatus : 0)

        setFormData({
          series: doc.naming_series || "",
          issuer_name: doc.issuer_name,
          job_card_type: doc.job_cards_type || "",
          current_odometer_value: doc.current_odometer_value || "",
          registration_no: doc.license_plate || "",
          priority: doc.priority_level || "Medium",
          date_of_initiation: doc.date_of_initiation || new Date().toISOString().slice(0, 16),
          ptw_no: doc.ptw_no || "",
          status: doc.status || "Pending",
          date_of_completion: doc.date_and_time_of_job_completion || "",
          jsa_jra_tool_box_task: doc.jsajratool_box_task || "",
          house_keeping: doc.house_keeping_after_shift_work || "",
          working_employees: loadedEmployees,
          make: doc.make || "",
          model: doc.model || "",
          warehouse: doc.warehouse || "",
        })

        setPartEntries(
          (doc.part_details || doc.parts_details || []).map((p: any) => ({
            id: p.name,
            item_name: p.item_name || "",
            item_display: findItemDisplay(p.item_name || ""),
            item_group: p.item_group,
            uom: p.uom,
            stock_qty: p.stock_qty,
            rate: p.rate,
            qty: p.qty,
            expense: p.expense,
            remark: p.remark,
          })),
        )

        const lubeSource = doc.lube_details || [];
        setLubeEntries(
          lubeSource.map((l: any) => ({
            id: l.name,
            item_name: l.item_name || "",
            item_display: findItemDisplay(l.item_name || ""),
            item_group: l.item_group,
            uom: l.uom,
            stock_qty: l.stock_qty,
            rate: l.rate,
            qty: l.qty,
            expense: l.expense,
            remark: l.remark,
          })),
        )

        setProblemEntries((doc.problem_details || []).map((j: any) => ({ id: j.name, problem_detail: j.problem_details || "" })))
        setWorkDoneEntries((doc.work_done_details || []).map((j: any) => ({ id: j.name, work_done_detail: j.work_done_details || "" })))
        setPendingJobEntries((doc.pending_jobs_backlog_details || []).map((j: any) => ({ id: j.name, pending_job_detail: j.pending_jobsbacklog_details || "" })))

      } catch (e) {
        console.error("loadFullRecord error:", e)
        onClose()
      }
    }

    loadDropdowns().then(() => {
      if (log) {
        loadFullRecord(log.name).finally(() => { if (!cancelled) setIsLoading(false) })
      } else {
        setDocStatus(0)
        setCurrentName(null)
        if (!cancelled) setIsLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [isOpen, log])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const finalValue = type === "number" ? (value === "" ? "" : Number(value)) : value
    setFormData((prev) => ({ ...prev, [name]: finalValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMultiSelectChange = (name: string, values: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: values }))
  }

  const handleVehicleSelect = (vehicleName: string) => {
    const selectedVehicle = vehicleOptions.find((v) => v.name === vehicleName)
    setFormData((prev) => ({
      ...prev,
      registration_no: vehicleName,
      make: selectedVehicle?.make || "",
      model: selectedVehicle?.model || "",
    }))
  }

  const addProblemEntry = () => {
    if (newProblem.trim()) { setProblemEntries((prev) => [...prev, { id: Date.now().toString(), problem_detail: newProblem }]); setNewProblem("") }
  }

  const addWorkDoneEntry = () => {
    if (newWorkDone.trim()) { setWorkDoneEntries((prev) => [...prev, { id: Date.now().toString(), work_done_detail: newWorkDone }]); setNewWorkDone("") }
  }

  const addPendingJobEntry = () => {
    if (newPendingJob.trim()) { setPendingJobEntries((prev) => [...prev, { id: Date.now().toString(), pending_job_detail: newPendingJob }]); setNewPendingJob("") }
  }


  const handleNewPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setNewPart((prev) => {
      let updated = { ...prev, [name]: value };

      if (name === "qty") {
        const qtyNum = Number(value);
        const stockNum = Number(prev.stock_qty);
        if (qtyNum > stockNum) {
          alert("Quantity cannot exceed available stock!");
          updated.qty = "";
          updated.expense = "";
          return updated;
        }
        if (qtyNum > 0 && Number(prev.rate) > 0) {
          updated.expense = qtyNum * Number(prev.rate);
        }
      }

      return updated;
    });
  };

  const handlePartItemSelect = async (itemId: string) => {
    if (!formData.warehouse) {
      alert("Please select a Warehouse first!");
      return;
    }

    const selectedItem = itemOptions.find((i) => i.name === itemId);
    setNewPart((prev) => ({
      ...prev,
      item_name: itemId,
      item_display: selectedItem?.item_name || itemId,
      item_group: selectedItem?.item_group || "",
      uom: selectedItem?.stock_uom || "",
      stock_qty: "",
      rate: "",
      qty: "",
      expense: "",
      remark: "",
    }));

    if (itemId && selectedItem?.stock_uom) {
      const [vRate, availableQty] = await Promise.all([
        fetchValuationRate(itemId, formData.warehouse),
        fetchAvailableQty(itemId, selectedItem.stock_uom),
      ]);
      setNewPart((prev) => ({
        ...prev,
        rate: vRate,
        stock_qty: availableQty,
      }));
    }
  };

  const addPartEntry = () => {
    if (newPart.item_name.trim()) {
      setPartEntries((prev) => [...prev, { id: Date.now().toString(), ...newPart, expense: newPart.expense === "" ? 0 : newPart.expense }])
      setNewPart({ item_name: "", item_display: "", item_group: "", uom: "", stock_qty: "", rate: "", qty: "", expense: "", remark: "" })
    }
  }

  const handleNewLubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setNewLube((prev) => {
      let updated: any = { ...prev, [name]: value }

      if (name === "qty") {
        const qtyNum = Number(value)
        const stockNum = Number(prev.stock_qty)

        if (qtyNum > stockNum) {
          alert("Quantity cannot be more than available stock!")
          updated.qty = ""
          updated.expense = ""
          return updated
        }

        if (qtyNum > 0 && Number(prev.rate) > 0) {
          updated.expense = qtyNum * Number(prev.rate)
        } else {
          updated.expense = ""
        }
      }

      return updated
    })
  }

  const handleLubeItemSelect = async (itemId: string) => {
    if (!formData.warehouse) {
      alert("Please select a Warehouse first to fetch the correct rate and stock.")
      return
    }
    const selectedItem = itemOptions.find((i) => i.name === itemId)
    setNewLube((prev) => ({
      ...prev,
      item_name: itemId,
      item_display: selectedItem?.item_name || itemId,
      item_group: selectedItem?.item_group || "",
      uom: selectedItem?.stock_uom || "",
      stock_qty: "",
      rate: "",
      qty: "",
      remark: "",
      expense: "",
    }))

    if (itemId && selectedItem?.stock_uom) {
      const [vRate, availableQty] = await Promise.all([
        fetchValuationRate(itemId, formData.warehouse),
        fetchAvailableQty(itemId, selectedItem.stock_uom),
      ])

      setNewLube((prev) => ({
        ...prev,
        rate: vRate,
        stock_qty: availableQty,
        expense: prev.qty ? Number(prev.qty) * vRate : prev.expense,
      }))
    }
  }

  const addLubeEntry = () => {
    if (newLube.item_name.trim()) {
      setLubeEntries((prev) => [...prev, { id: Date.now().toString(), ...newLube, expense: newLube.expense === "" ? 0 : newLube.expense }])
      setNewLube({ item_name: "", item_display: "", item_group: "", uom: "", stock_qty: "", rate: "", qty: "", expense: "", remark: "" })
    }
  }
  const buildPayload = () => {
    const nameToUse = currentName || log?.name

    const payload: any = {
      ...formData,
      current_odometer_value: formData.current_odometer_value || 0,
      ...(nameToUse && { name: nameToUse }),
      naming_series: formData.series,
      job_cards_type: formData.job_card_type,
      license_plate: formData.registration_no,
      priority_level: formData.priority,
      date_and_time_of_job_completion: formData.date_of_completion,
      jsajratool_box_task: formData.jsa_jra_tool_box_task,
      house_keeping_after_shift_work: formData.house_keeping,
      warehouse: formData.warehouse,

      working_employee: formData.working_employees.map(emp => ({ employee: emp })),

      problem_details: problemEntries.map((p) => ({
        ...(!/^\d+$/.test(p.id) && { name: p.id }),
        problem_details: p.problem_detail
      })),
      work_done_details: workDoneEntries.map((w) => ({
        ...(!/^\d+$/.test(w.id) && { name: w.id }),
        work_done_details: w.work_done_detail
      })),
      pending_jobs_backlog_details: pendingJobEntries.map((pj) => ({
        ...(!/^\d+$/.test(pj.id) && { name: pj.id }),
        pending_jobsbacklog_details: pj.pending_job_detail
      })),

      part_details: partEntries.map((p) => ({
        ...(!/^\d+$/.test(p.id) && { name: p.id }),
        item_name: p.item_name,
        item_group: p.item_group,
        uom: p.uom,
        stock_qty: p.stock_qty,
        rate: p.rate,
        qty: p.qty,
        expense: p.expense,
        remark: p.remark,
      })),

      lube_details: lubeEntries.map((l) => ({
        ...(!/^\d+$/.test(l.id) && { name: l.id }),
        item_name: l.item_name,
        item_group: l.item_group,
        uom: l.uom,
        stock_qty: l.stock_qty,
        rate: l.rate,
        qty: l.qty,
        expense: l.expense,
        remark: l.remark,
      })),
    }
    delete payload.working_employees
    delete payload.registration_no
    delete payload.series
    delete payload.job_card_type
    delete payload.priority
    delete payload.date_of_completion
    delete payload.jsa_jra_tool_box_task
    delete payload.house_keeping
    delete payload.date_of_initiation

    return payload
  }
  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      const formDataToSend = new FormData()
      formDataToSend.append("data", JSON.stringify(payload))

      const csrf = await getCSRF()

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.save_vehicle_log_master")),
        formDataToSend,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrf }
        }
      )


      const msg = res.data.message || res.data
      const name = msg.name || msg?.message?.name
      const status = msg.docstatus ?? msg?.message?.docstatus ?? 0

      if (name) setCurrentName(name)
      setDocStatus(status)
      onSuccess?.()


      alert(currentName ? "Updated successfully." : "Saved successfully.")
    } catch (err) {
      console.error("Save error:", err)
      alert("Failed to save draft.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitFinal = async () => {
    if (!formData.registration_no || formData.working_employees.length === 0) {
      alert("Validation Error: Please select Registration No and at least one Working Employee.");
      return;
    }

    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      const formDataToSend = new FormData()
      formDataToSend.append("data", JSON.stringify(payload))

      const csrf = await getCSRF()

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.submit_vehicle_log_master")),
        formDataToSend,
        {
          withCredentials: true,
          headers: {
            Accept: "*/*",
            "X-Frappe-CSRF-Token": csrf
          }
        }
      )


      const msg = res.data.message || res.data
      const name = msg.name || msg?.message?.name
      if (name) setCurrentName(name)
      setDocStatus(1)
      onSuccess?.()

      console.log("Success:", res.data)
      alert("Maintenance Log submitted successfully.")
      onClose()
    } catch (err) {
      console.error("Submit error:", err)
      if (axios.isAxiosError(err)) {
        alert(`Submission Failed: ${err.response?.data?.message || err.message}`)
      } else {
        alert("An unexpected error occurred during submission.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!currentName) return;

    setIsSubmitting(true);
    try {
      // ⭐ CSRF token fetch
      const csrf = await getCSRF();

      const fd = new FormData();
      fd.append("name", currentName);

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.cancel_vehicle_log_master")),
        fd,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrf }
        }
      );

      const msg = res.data.message || res.data;
      const status = msg.docstatus ?? 2;
      setDocStatus(status);

      alert("Maintenance Log cancelled.");
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel Maintenance Log.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleAmend = async () => {
    if (!currentName) return

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name", currentName)

      const csrf = await getCSRF()

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.amend_vehicle_log_master")),
        fd,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrf }
        }
      )


      const msg = res.data.message || res.data
      const newName = msg.name || msg?.message?.name

      if (newName) {
        setCurrentName(newName)
        onSuccess?.()

        setDocStatus(0)
        alert("You can now edit and submit again.")
      } else {
        alert("Amendment created but new document name not returned.")
      }
    } catch (err) {
      console.error("Amend error:", err)
      alert("Failed to create amendment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isLoading || isSubmitting
  const showTimeField = ["Completed"].includes(formData.status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {log ? "Show" : "Create"} Maintenance Log
          </DialogTitle>
          <DialogDescription className="hidden">Form to create or view vehicle maintenance details</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        <div className={`space-y-6 ${isLoading ? "opacity-50" : ""}`}>

          {/* --- GENERAL DETAILS --- */}
          <GeneralDetailsSection
            formData={formData}
            handleSelectChange={handleSelectChange}
            handleInputChange={handleInputChange}
            handleVehicleSelect={handleVehicleSelect}
            handleMultiSelectChange={handleMultiSelectChange}
            seriesOptions={seriesOptions}
            employeeOptions={employeeOptions}
            jobCardTypeOptions={jobCardTypeOptions}
            vehicleOptions={vehicleOptions}
            priorityOptions={priorityOptions}
            warehouseOptions={warehouseOptions}
            statusOptions={statusOptions}
            jsaOptions={jsaOptions}
            housekeepingOptions={housekeepingOptions}
            isBusy={isBusy}
            showTimeField={showTimeField}
          />

          {/* Problem/Job Details Section */}
          <ProblemJobDetailSection
            problemEntries={problemEntries}
            newProblem={newProblem}
            setNewProblem={setNewProblem}
            addProblemEntry={addProblemEntry}
            workDoneEntries={workDoneEntries}
            newWorkDone={newWorkDone}
            setNewWorkDone={setNewWorkDone}
            addWorkDoneEntry={addWorkDoneEntry}
            pendingJobEntries={pendingJobEntries}
            newPendingJob={newPendingJob}
            setNewPendingJob={setNewPendingJob}
            addPendingJobEntry={addPendingJobEntry}
            isBusy={isBusy}
          />

          {/* Parts Details Section */}
          <PartsDetailSection
            partEntries={partEntries}
            newPart={newPart}
            itemOptions={itemOptions}
            handleNewPartChange={handleNewPartChange}
            handlePartItemSelect={handlePartItemSelect}
            addPartEntry={addPartEntry}
            isBusy={isBusy}
          />

          {/* Lube Details Section */}
          <LubeDetailSection
            lubeEntries={lubeEntries}
            newLube={newLube}
            itemOptions={itemOptions}
            handleNewLubeChange={handleNewLubeChange}
            handleLubeItemSelect={handleLubeItemSelect}
            addLubeEntry={addLubeEntry}
            isBusy={isBusy}
          />
        </div>

        <DialogFooter className="gap-2 flex justify-end pt-6">
          {/* Close */}
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Close
          </Button>

          {/* NEW DOCUMENT → SAVE DRAFT */}
          {!currentName && docStatus === 0 && (
            <Button onClick={handleSave} disabled={isBusy}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          )}

          {/*EXISTING DRAFT (docstatus=0) → UPDATE + SUBMIT */}
          {currentName && docStatus === 0 && (
            <>
              <Button onClick={handleSave} disabled={isBusy}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update
              </Button>

              <Button
                onClick={handleSubmitFinal}
                disabled={isBusy}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit
              </Button>
            </>
          )}

          {/*SUBMITTED (docstatus=1) → CANCEL */}
          {currentName && docStatus === 1 && (
            <Button
              onClick={handleCancel}
              disabled={isBusy}
              className="bg-red-600 text-white"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel
            </Button>
          )}

          {/*CANCELLED (docstatus=2) → CREATE AMENDMENT */}
          {currentName && docStatus === 2 && (
            <Button
              onClick={handleAmend}
              disabled={isBusy}
              className="bg-yellow-600 text-white"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Draft
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

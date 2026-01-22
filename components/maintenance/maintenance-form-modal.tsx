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
import { useAuthStore } from '@/context/auth_store'

const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export function MaintenanceFormModal({
  isOpen,
  onClose,
  log,
  onSuccess
}: MaintenanceFormModalProps) {
  const [formData, setFormData] = useState({
    series: seriesOptions[0]?.name || "",
    issuer_name: "",
    job_cards_type: "",
    current_odometer_value: "" as number | string,
    last_odometer_value: "" as number | string,
    registration_no: "",
    priority: "Medium",
   date_and_time_of_job_initiation: getLocalISOString(),
    ptw_no: "",
    status: "Pending",
    date_and_time_of_job_completion: "",
    jsa_jra_tool_box_task: "",
    house_keeping: "",
    working_employees: [] as string[],
    make: "",
    model: "",
    warehouse: "",
    company: ""
  })

  const [problemEntries, setProblemEntries] = useState<ProblemEntry[]>([])
  const [workDoneEntries, setWorkDoneEntries] = useState<WorkDoneEntry[]>([])
  const [pendingJobEntries, setPendingJobEntries] = useState<PendingJobEntry[]>([])
  const [partEntries, setPartEntries] = useState<PartEntry[]>([])
  const [lubeEntries, setLubeEntries] = useState<LubeEntry[]>([])
  const [newProblem, setNewProblem] = useState("")
  const [newWorkDone, setNewWorkDone] = useState("")
  const [newPendingJob, setNewPendingJob] = useState("")
  const { user } = useAuthStore()

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
  const [companyOptions, setCompanyOptions] = useState<FrappeDoc[]>([])
  const [docStatus, setDocStatus] = useState<number>(0)
  const [currentName, setCurrentName] = useState<string | null>(null)
  const [allEmployeeOptions, setAllEmployeeOptions] = useState<FrappeDoc[]>([])
  const [allWarehouseOptions, setAllWarehouseOptions] = useState<FrappeDoc[]>([])
  

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

      const res = await axios.get(
        getApiUrl(config.api.method("vms.api.get_item_valuation_rate")),
        {
          params: { item_code: itemCode, warehouse: selectedWarehouse },
          withCredentials: true,
        }
      )


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
        job_cards_type: "",
        current_odometer_value: "",
           last_odometer_value: "",
        registration_no: "",
        priority: "Medium",
        date_and_time_of_job_initiation: getLocalISOString(),
        ptw_no: "",
        status: "Pending",
        date_and_time_of_job_completion: "",
        jsa_jra_tool_box_task: "",
        house_keeping: "",
        working_employees: [],
        make: "",
        model: "",
        warehouse: "",
        company: ""
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
        const url = getApiUrl(
          `/api/resource/Company?fields=${encodeURIComponent(JSON.stringify(["name"]))}`
        );
        const x = await fetch(url, {
          method: "GET",
          credentials: "include",
        });
        const companyData = await x.json();
        const assignedCompanies =
          companyData?.data?.map((c: { name: string }) => c.name) || [];

        const [
          vehicles,
          items,
          warehousesAll,
          allCompanies
        ] = await Promise.all([
          fetchFrappeDoctype(VEHICLE_DOCTYPE, ["name", "make", "model","last_odometer"]) as Promise<VehicleDoc[]>,
          fetchFrappeDoctype(ITEM_DOCTYPE, ["name", "item_name", "item_group", "stock_uom"]) as Promise<ItemDoc[]>,
          fetchFrappeDoctype("Warehouse", ["name", "company", "cost_center"]),
          fetchFrappeDoctype("Company", ["name"])
        ]);

        console.log("odometer",vehicles);
        
        const filteredCompanies = allCompanies.filter(item =>
          assignedCompanies.includes(item.name)
        );

        const url1 = getApiUrl("/api/method/vms.api.get_all_employees");

        const employeesAll = await fetch(url1, {
          method: "GET",
          credentials: "include"
        });

        const eAll = await employeesAll.json();

        if (cancelled) return;
        setCompanyOptions(filteredCompanies)
        setVehicleOptions(vehicles);
        setAllEmployeeOptions(eAll.message);
        setAllWarehouseOptions(warehousesAll);
        if (!log && filteredCompanies.length > 0) {
          setFormData(prev => ({
            ...prev,
            company: prev.company || filteredCompanies[0].name
          }))
        }
        setEmployeeOptions([])
        setWarehouseOptions([])
        setItemOptions(
          items.map((i) => ({
            ...i,
            total_projected_qty: Number(i.total_projected_qty || 0),
            standard_rate: Number(i.standard_rate || 0),
          }))
        );
      } catch (e) {
        console.error("loadDropdowns error:", e);
      }
    };

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
          job_cards_type: doc.job_cards_type || "",
          current_odometer_value: doc.current_odometer_value || "",
          last_odometer_value: doc.last_odometer_value || "",
          registration_no: doc.license_plate || "",
          priority: doc.priority_level || "Medium",
          date_and_time_of_job_initiation: doc.date_and_time_of_job_initiation || new Date().toISOString().slice(0, 16),
          ptw_no: doc.ptw_no || "",
          status: doc.status || "Pending",
          date_and_time_of_job_completion: doc.date_and_time_of_job_completion || "",
          jsa_jra_tool_box_task: doc.jsajratool_box_task || "",
          house_keeping: doc.house_keeping_after_shift_work || "",
          working_employees: loadedEmployees,
          make: doc.make || "",
          model: doc.model || "",
          warehouse: doc.warehouse || "",
          company: doc.company || "",
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

  // useEffect(() => {
  //   console.log("Company Changed To: ", formData.company);   

  //   if (!formData.company) {
  //     console.log("No company selected → clearing options");
  //     setEmployeeOptions([]);
  //     setWarehouseOptions([]);
  //     return;
  //   }

  //   const filteredEmployees = allEmployeeOptions.filter(
  //     emp => emp.company === formData.company
  //   );
  //   const filteredWarehouses = allWarehouseOptions.filter(
  //     wh => wh.company === formData.company
  //   );

  //   console.log("Filtered Employees: ", filteredEmployees);   
  //   console.log("Filtered Warehouses: ", filteredWarehouses);

  //   setEmployeeOptions(filteredEmployees);
  //   setWarehouseOptions(filteredWarehouses);
  // }, [formData.company, allEmployeeOptions, allWarehouseOptions]);



  const checkWarehouseSelection = () => {
    if (!formData.warehouse) {
      alert("Please select a Source Warehouse first to filter the Working Employees and Issuer Name.");
      return false;
    }
    return true;
  };
  useEffect(() => {
    const fetchFilteredEmployees = async () => {
      if (!formData.company) {
        setEmployeeOptions([]);
        setWarehouseOptions([]);
        return;
      }
      const filteredWarehouses = allWarehouseOptions.filter(
        wh => wh.company === formData.company
      );
      setWarehouseOptions(filteredWarehouses);
      if (formData.warehouse) {
        setIsLoading(true); 
        try {
          const selectedWhDoc = allWarehouseOptions.find(w => w.name === formData.warehouse);
          const targetCostCenter = selectedWhDoc?.cost_center;

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

            const fetchedEmployees = result.data || [];

            if (fetchedEmployees.length > 0) {
              setEmployeeOptions(fetchedEmployees);
            } else {
              console.warn("No employees found on backend for this Cost Center.");
              setEmployeeOptions([]);
            }
          }
        } catch (error) {
          console.error("Failed to fetch filtered employees:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        const companyEmployees = allEmployeeOptions.filter(emp => emp.company === formData.company);
        setEmployeeOptions(companyEmployees);
      }
    };

    fetchFilteredEmployees();
  }, [formData.company, formData.warehouse, allWarehouseOptions]);


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
      last_odometer_value: selectedVehicle?.last_odometer || 0,
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


  // const handleNewPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;

  //   setNewPart((prev) => {
  //     let updated = { ...prev, [name]: value };

  //     if (name === "qty") {
  //       const qtyNum = Number(value);
  //       const stockNum = Number(prev.stock_qty);
  //       if (qtyNum > stockNum) {
  //         alert("Quantity cannot exceed available stock!");
  //         updated.qty = "";
  //         updated.expense = "";
  //         return updated;
  //       }
  //       if (qtyNum > 0 && Number(prev.rate) > 0) {
  //         updated.expense = qtyNum * Number(prev.rate);
  //       }
  //     }
  //     console.log("ecpence",updated);
      
  //     return updated;
  //   });
  // };

const handleNewPartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  setNewPart((prev) => {
    let updated = { ...prev, [name]: value };

    // Debugging ke liye values nikalna
    const currentQty = name === "qty" ? Number(value) : Number(prev.qty);
    const currentRate = Number(prev.rate);

    if (name === "qty") {
      const stockNum = Number(prev.stock_qty);
      
      if (currentQty > stockNum) {
        alert("Quantity cannot exceed available stock!");
        updated.qty = "";
        updated.expense = "";
        return updated;
      }

      // Calculation logic
    if (currentQty > 0 && currentRate > 0) {
        let rawExpense = currentQty * currentRate;
        updated.expense = Math.floor(rawExpense); 
      } else {
        updated.expense = 0;
      }
    }

    // --- Console Logs ---
    console.group("Part Change Debug");
    console.log("Field Updated:", name);
    console.log("Current Qty:", currentQty);
    console.log("Current Rate:", currentRate);
    console.log("Calculated Expense:", updated.expense);
    console.log("Full Object:", updated);
    console.groupEnd();
    
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

  // const handleNewLubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target

  //   setNewLube((prev) => {
  //     let updated: any = { ...prev, [name]: value }

  //     if (name === "qty") {
  //       const qtyNum = Number(value)
  //       const stockNum = Number(prev.stock_qty)

  //       if (qtyNum > stockNum) {
  //         alert("Quantity cannot be more than available stock!")
  //         updated.qty = ""
  //         updated.expense = ""
  //         return updated
  //       }

  //       if (qtyNum > 0 && Number(prev.rate) > 0) {
  //         updated.expense = qtyNum * Number(prev.rate)
  //       } else {
  //         updated.expense = ""
  //       }
  //     }

  //     return updated
  //   })
  // }

  const handleNewLubeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target

  setNewLube((prev) => {
    let updated: any = { ...prev, [name]: value }
    const qtyNum = name === "qty" ? Number(value) : Number(prev.qty);
    const rateNum = Number(prev.rate);

    if (name === "qty") {
      const stockNum = Number(prev.stock_qty)

      if (qtyNum > stockNum) {
        alert("Quantity cannot be more than available stock!")
        updated.qty = ""
        updated.expense = ""
        return updated
      }
      if (qtyNum > 0 && rateNum > 0) {
        let totalExpense = qtyNum * rateNum;
        updated.expense = Math.floor(totalExpense);
      } else {
        updated.expense = 0; 
      }
    }


    console.log("--- Lube Calculation Debug ---");
    console.log("Quantity (Qty):", qtyNum);
    console.log("Rate:", rateNum);
    console.log("Final Expense (Bina Decimal):", updated.expense);
    console.log("------------------------------");

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
      job_cards_type: formData.job_cards_type,
      license_plate: formData.registration_no,
      priority_level: formData.priority,
      date_and_time_of_job_initiation: formData.date_and_time_of_job_initiation,
      date_and_time_of_job_completion: formData.date_and_time_of_job_completion,
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
    delete payload.jsa_jra_tool_box_task
    delete payload.house_keeping

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
    } catch (err: any) {
      
      const errorMsg = getErrorMessage(err);
      alert(errorMsg);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl hidden md:inline">
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
            companyOptions={companyOptions}
            isBusy={isBusy}
            showTimeField={showTimeField}
            onEmployeeFieldClick={checkWarehouseSelection}
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

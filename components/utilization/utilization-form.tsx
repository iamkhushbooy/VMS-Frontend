"use client"
import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import axios from "axios"
import { useAuthStore } from "@/context/auth_store"
import { getApiUrl, config } from "@/lib/config"
import { UtilizationLogEventForm } from "./utilization-log-event-form"
import { VEHICLE_DOCTYPE } from "../maintenance/MaintenanceShared"
import { getErrorMessage } from "@/lib/errorMessage"
const DOCTYPE_NAME = "Utilization Report"
interface FrappeDoc {
  name: string
  [key: string]: any
}

interface UtilizationFormProps {
  isOpen: boolean
  onClose: () => void
  record: { name: string } | null
}

const formatDateTimeForInput = (d?: string) =>
  d ? d.replace(" ", "T").substring(0, 16) : ""
const fetchFrappeDoctype = async (
  doctype: string,
  fields: string[] = ["name"],
  filters: any[] = []
): Promise<FrappeDoc[]> => {
  let url = `${getApiUrl(config.api.resource(doctype))}?fields=${encodeURIComponent(
    JSON.stringify(fields)
  )}&limit_page_length=2000`

  if (filters && filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`
  }

  try {
    const response = await fetch(url, { credentials: "include" })
    if (!response.ok) throw new Error(response.statusText)
    const data = await response.json()
    return data.data || []
  } catch (e) {
    console.error("fetch error:", e)
    return []
  }
}

export function UtilizationReportModal({ isOpen, onClose, record }: UtilizationFormProps) {
  const loggedUser = useAuthStore((s) => s.user)
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
    status: "Running",
    company: ""
  })
  const emptyForm = {
    date: new Date().toISOString().split("T")[0],
    fromDate: "",
    toDate: "",
    shift: "A",
    plant: "",
    costCenter: "",
    warehouse: "",
    vehicle: "",
    supervisorName: loggedUser?.email || "",
    hmr: "",
    status: "Running",
    company: ""
  }

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [plantOptions, setPlantOptions] = useState<FrappeDoc[]>([])
  const [costCenterOptions, setCostCenterOptions] = useState<FrappeDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
  const [companyOptions, setCompanyOptions] = useState<FrappeDoc[]>([])
  const [vehicleOptions, setVehicleOptions] = useState<FrappeDoc[]>([])
  const [supervisorOptions, setSupervisorOptions] = useState<FrappeDoc[]>([])
  const { user } = useAuthStore()
  const [allWarehouseOptions, setAllWarehouseOptions] = useState<FrappeDoc[]>([])
  const shiftOptions = [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "G" }]
  const statusOptions = [{ name: "Running" }, { name: "Breakdown" }, { name: "Idle" }]
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

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    const load = async () => {
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
        const [branches, costCenters, warehousesAll, companies] = await Promise.all([
          fetchFrappeDoctype("Branch", ["name"]),
          fetchFrappeDoctype("Cost Center", ["name"]),
          fetchFrappeDoctype("Warehouse", ["name", "company"],[["is_group", "=", 0]]),
          fetchFrappeDoctype("Company", ["name"])
        ])
        const filteredCompanies = companies.filter((item: { name: string }) =>
          assignedCompanies.includes(item.name)
        );

        setPlantOptions(branches)
        setCostCenterOptions(costCenters)
        setAllWarehouseOptions(warehousesAll);
        setWarehouseOptions([])
        setCompanyOptions(filteredCompanies)
        if (!record && filteredCompanies.length > 0) {
          setFormData(prev => ({
            ...prev,
            company: prev.company || filteredCompanies[0].name
          }))
        }
        setSupervisorOptions([
          {
            name: loggedUser?.email || "",
            full_name: loggedUser?.full_name || loggedUser?.email,
          },
        ])

        if (record) {
          // load existing
          const resp = await fetch(
            getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${record.name}`),
            { credentials: "include" }
          )
          const result = await resp.json()
          const doc = result.data

          setFormData({
            date: doc.date?.split(" ")[0],
            fromDate: formatDateTimeForInput(doc.from_date),
            toDate: formatDateTimeForInput(doc.to_date),
            shift: doc.shift || "A",
            plant: doc.plant || "",
            costCenter: doc.cost_center || "",
            warehouse: doc.warehouse || "",
            vehicle: doc.vehicle || "",
            supervisorName: doc.supervisor_name || loggedUser?.email || "",
            hmr: doc.hmr || "",
            status: doc.status || "Running",
            company: doc.company || ""
          })
        } else {
          setFormData({
            ...emptyForm,
            company: filteredCompanies.length > 0 ? filteredCompanies[0].name : "",
            supervisorName: loggedUser?.email || ""
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [isOpen, record, loggedUser])

  useEffect(() => {

    if (!formData.company) {
      setWarehouseOptions([]);
      return;
    }
    const filteredWarehouses = allWarehouseOptions.filter(
      wh => wh.company === formData.company
    );


    setWarehouseOptions(filteredWarehouses);
  }, [formData.company, allWarehouseOptions]);

  useEffect(() => {
    if (!formData.warehouse) return;

    let cancelled = false;

    const autoFillFromWarehouse = async () => {
      const w = await fetchWarehouseMeta(formData.warehouse);
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
  }, [formData.warehouse]);
  useEffect(() => {
    if (!isOpen || !formData.warehouse) {
      setVehicleOptions([]);
      return;
    }

    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const vehicles = await fetchFrappeDoctype(
          VEHICLE_DOCTYPE,
          ["name"],
          [["warehouse", "=", formData.warehouse]]
        ) as FrappeDoc[];

        console.log("Fetched vehicles for", formData.warehouse, vehicles);
        setVehicleOptions(vehicles);
      } catch (e) {
        console.error("Vehicle fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [formData.warehouse, isOpen]);

  const checkWarehouseSelection = () => {
    if (!formData.warehouse) {
      alert("Please select a Source Warehouse first to filter Registration No.");
      return false;
    }
    return true;
  };



  const handleSelectChange = (key: string, value: string) =>
    setFormData((p) => ({ ...p, [key]: value }))

  const handleInputChange = (e: any) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const token = await (
        await fetch(getApiUrl(config.api.getCsrfToken), { credentials: "include" })
      ).json()

      const fd = new FormData()
      fd.append("data", JSON.stringify({
        date: formData.date,
        from_date: formData.fromDate,
        to_date: formData.toDate,
        shift: formData.shift,
        plant: formData.plant,
        cost_center: formData.costCenter,
        company: formData.company,
        warehouse: formData.warehouse,
        vehicle: formData.vehicle,
        supervisor_name: formData.supervisorName,
        hmr: formData.hmr,
        status: formData.status,
      }))

      const res=await axios.post(
        getApiUrl(config.api.method("vms.api.submit_utilization_report")),
        fd,
        { withCredentials: true, headers: { "X-Frappe-CSRF-Token": token.message } }
      )
      if (res.status === 200) {
        alert("Vehicle Updated Successfully!");
        window.location.reload()
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      alert(errorMsg);
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleUpdate = async () => {
    if (!record) return alert("Record missing")

    setIsSubmitting(true)

    try {
      const token = await (
        await fetch(getApiUrl(config.api.getCsrfToken), { credentials: "include" })
      ).json()

      const res=await axios.put(
        getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${record.name}`),
        {
          date: formData.date,
          from_date: formData.fromDate,
          to_date: formData.toDate,
          shift: formData.shift,
          plant: formData.plant,
          cost_center: formData.costCenter,
          company: formData.company,
          warehouse: formData.warehouse,
          vehicle: formData.vehicle,
          supervisor_name: formData.supervisorName,
          hmr: formData.hmr,
          status: formData.status,
        },
        { withCredentials: true, headers: { "X-Frappe-CSRF-Token": token.message } }
      )

      if (res.status === 200) {
        alert("Utilization Updated Successfully!");
        window.location.reload()
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      alert(errorMsg);
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isLoading || isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-white">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {record ? "Edit Utilization Event" : "Log Utilization Event"}
            </DialogTitle>
          </DialogHeader>
        </div>
        <UtilizationLogEventForm
          formData={formData}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
          plantOptions={plantOptions}
          costCenterOptions={costCenterOptions}
          companyOptions={companyOptions}
          warehouseOptions={warehouseOptions}
          vehicleOptions={vehicleOptions}
          supervisorOptions={supervisorOptions}
          shiftOptions={shiftOptions}
          statusOptions={statusOptions}
          isBusy={isBusy}
          isLoading={isLoading}
          onEmployeeFieldClick={checkWarehouseSelection}

        />

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>

          {!record ? (
            <Button className="bg-orange-500 text-white" disabled={isBusy} onClick={handleSubmit}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Save Utilization Log"}
            </Button>
          ) : (
            <Button className="bg-blue-600 text-white" disabled={isBusy} onClick={handleUpdate}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Update Utilization Log"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

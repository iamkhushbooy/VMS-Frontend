// "use client"
// import React, { useState, useEffect } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Loader2 } from "lucide-react"
// import axios from "axios"
// import { useAuthStore } from "@/context/auth_store"
// import { getApiUrl, config } from "@/lib/config"
// import { UtilizationLogEventForm } from "./utilization-log-event-form"
// import { VEHICLE_DOCTYPE } from "../maintenance/MaintenanceShared"
// import { getErrorMessage } from "@/lib/errorMessage"
// import CustomAlert from "../alert/alert"
// import { AlertButton } from "../alert/types"
// const DOCTYPE_NAME = "Utilization Report"
// interface FrappeDoc {
//   name: string
//   [key: string]: any
// }

// interface UtilizationFormProps {
//   isOpen: boolean
//   onClose: () => void
//   record: { name: string } | null
// }

// const formatDateTimeForInput = (d?: string) =>
//   d ? d.replace(" ", "T").substring(0, 16) : ""
// const fetchFrappeDoctype = async (
//   doctype: string,
//   fields: string[] = ["name"],
//   filters: any[] = []
// ): Promise<FrappeDoc[]> => {
//   let url = `${getApiUrl(config.api.resource(doctype))}?fields=${encodeURIComponent(
//     JSON.stringify(fields)
//   )}&limit_page_length=2000`

//   if (filters && filters.length > 0) {
//     url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`
//   }

//   try {
//     const response = await fetch(url, { credentials: "include" })
//     if (!response.ok) throw new Error(response.statusText)
//     const data = await response.json()
//     return data.data || []
//   } catch (e) {
//     console.error("fetch error:", e)
//     return []
//   }
// }

// export function UtilizationReportModal({ isOpen, onClose, record }: UtilizationFormProps) {
//   const loggedUser = useAuthStore((s) => s.user)
//   const [formData, setFormData] = useState({
//     date: new Date().toISOString().split("T")[0],
//     fromDate: "",
//     toDate: "",
//     shift: "A",
//     plant: "",
//     costCenter: "",
//     warehouse: "",
//     vehicle: "",
//     supervisorName: "",
//     hmr: "",
//     status: "Breakdown",
//     company: "",
//     timeHours: "",
//     timeMinutes: "",
//   })
//   const emptyForm = {
//     date: new Date().toISOString().split("T")[0],
//     fromDate: "",
//     toDate: "",
//     shift: "A",
//     plant: "",
//     costCenter: "",
//     warehouse: "",
//     vehicle: "",
//     supervisorName: loggedUser?.email || "",
//     hmr: "",
//     status: "Breakdown",
//     company: "",
//     timeHours: "",
//     timeMinutes: "",
//   }

//   const [isLoading, setIsLoading] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [plantOptions, setPlantOptions] = useState<FrappeDoc[]>([])
//   const [costCenterOptions, setCostCenterOptions] = useState<FrappeDoc[]>([])
//   const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
//   const [companyOptions, setCompanyOptions] = useState<FrappeDoc[]>([])
//   const [vehicleOptions, setVehicleOptions] = useState<FrappeDoc[]>([])
//   const [supervisorOptions, setSupervisorOptions] = useState<FrappeDoc[]>([])
//   const { user } = useAuthStore()
//   const [allWarehouseOptions, setAllWarehouseOptions] = useState<FrappeDoc[]>([])

//   const [alertState, setAlertState] = useState<{
//     visible: boolean;
//     title?: string;
//     message?: string;
//     buttons: AlertButton[];
//   }>({
//     visible: false,
//     title: "",
//     message: "",
//     buttons: [],
//   });
//   const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
//     setAlertState({
//       visible: true,
//       title,
//       message,
//       buttons: buttons || [{ text: "OK", style: "cancel" }],
//     });
//   };
//   const closeAlert = () => {
//     setAlertState((p) => ({ ...p, visible: false }));
//   };

//   const shiftOptions = [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "G" }]
//   const statusOptions = [{ name: "Breakdown" }, { name: "Idle" }]

//   const fetchWarehouseMeta = async (warehouseName: string) => {
//     if (!warehouseName) return null;

//     const fieldsParam = encodeURIComponent(
//       JSON.stringify(["name", "cost_center"])
//     );

//     try {
//       const res = await fetch(
//         `${getApiUrl(config.api.resource("Warehouse"))}/${encodeURIComponent(
//           warehouseName
//         )}?fields=${fieldsParam}`,
//         { credentials: "include" }
//       );

//       const json = await res.json();

//       return json.data || null;
//     } catch (error) {
//       console.error("Error fetching Warehouse meta", error);
//       return null;
//     }
//   };

//   useEffect(() => {
//     if (!isOpen) return
//     setIsLoading(true)
//     const load = async () => {
//       try {
//         const url = getApiUrl(
//           `/api/resource/Company?fields=${encodeURIComponent(JSON.stringify(["name"]))}`
//         );
//         const x = await fetch(url, {
//           method: "GET",
//           credentials: "include",
//         });
//         const companyData = await x.json();
//         const assignedCompanies =
//           companyData?.data?.map((c: { name: string }) => c.name) || [];
//         const [branches, costCenters, warehousesAll, companies] = await Promise.all([
//           fetchFrappeDoctype("Branch", ["name"]),
//           fetchFrappeDoctype("Cost Center", ["name"]),
//           fetchFrappeDoctype("Warehouse", ["name", "company"], [["is_group", "=", 0]]),
//           fetchFrappeDoctype("Company", ["name"])
//         ])
//         const filteredCompanies = companies.filter((item: { name: string }) =>
//           assignedCompanies.includes(item.name)
//         );

//         setPlantOptions(branches)
//         setCostCenterOptions(costCenters)
//         setAllWarehouseOptions(warehousesAll);
//         setWarehouseOptions([])
//         setCompanyOptions(filteredCompanies)
//         if (!record && filteredCompanies.length > 0) {
//           setFormData(prev => ({
//             ...prev,
//             company: prev.company || filteredCompanies[0].name
//           }))
//         }
//         setSupervisorOptions([
//           {
//             name: loggedUser?.email || "",
//             full_name: loggedUser?.full_name || loggedUser?.email,
//           },
//         ])

//         if (record) {
//           // load existing
//           const resp = await fetch(
//             getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${record.name}`),
//             { credentials: "include" }
//           )
//           const result = await resp.json()
//           const doc = result.data
//           // 2. REVERSE CALCULATION: Seconds ko Hours:Minutes mein todna
//           const totalSecs = parseInt(doc.time) || 0;
//           const h = Math.floor(totalSecs / 3600);
//           const m = Math.floor((totalSecs % 3600) / 60);

//           setFormData({
//             date: doc.date?.split(" ")[0],
//             fromDate: formatDateTimeForInput(doc.from_date),
//             toDate: formatDateTimeForInput(doc.to_date),
//             shift: doc.shift || "A",
//             plant: doc.plant || "",
//             costCenter: doc.cost_center || "",
//             warehouse: doc.warehouse || "",
//             vehicle: doc.vehicle || "",
//             supervisorName: doc.supervisor_name || loggedUser?.email || "",
//             hmr: doc.hmr || "",
//             status: doc.status || "Breakdown",
//             company: doc.company || "",
//             timeHours: h.toString(),
//             timeMinutes: m.toString()
//           })
//         } else {
//           setFormData({
//             ...emptyForm,
//             company: filteredCompanies.length > 0 ? filteredCompanies[0].name : "",
//             supervisorName: loggedUser?.email || ""
//           })
//         }
//       } catch (e) {
//         console.error(e)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     load()
//   }, [isOpen, record, loggedUser])

//   const getProcessedData = () => {
//     const hmrValue = parseFloat(formData.hmr);
//   if (!formData.hmr || hmrValue <= 0) {
//     showAlert("Validation Error", "Current HMR/Kms must be greater than 0.");
//     return null;
//   }
//     const h = parseInt(formData.timeHours) || 0;
//     const m = parseInt(formData.timeMinutes) || 0;

//     // Validation: Minutes 59 se zyada nahi hone chahiye
//     if (m > 59) {
//       showAlert("Validation Error", "Minutes 59 se zyada nahi ho sakte.");
//       return null;
//     }

//     // Total Seconds Calculation: (Hours * 3600) + (Minutes * 60)
//     const totalSeconds = (h * 3600) + (m * 60);

//     // Backend friendly object return karna
//     return {
//       date: formData.date,
//       from_date: formData.fromDate,
//       to_date: formData.toDate,
//       shift: formData.shift,
//       plant: formData.plant,
//       cost_center: formData.costCenter,
//       company: formData.company,
//       warehouse: formData.warehouse,
//       vehicle: formData.vehicle,
//       supervisor_name: formData.supervisorName,
//       hmr: formData.hmr,
//       status: formData.status,
//       time: totalSeconds.toString(), // Database mein seconds jayenge
//     };
//   };

//   useEffect(() => {

//     if (!formData.company) {
//       setWarehouseOptions([]);
//       return;
//     }
//     const filteredWarehouses = allWarehouseOptions.filter(
//       wh => wh.company === formData.company
//     );


//     setWarehouseOptions(filteredWarehouses);
//   }, [formData.company, allWarehouseOptions]);

//   useEffect(() => {
//     if (!formData.warehouse) return;

//     let cancelled = false;

//     const autoFillFromWarehouse = async () => {
//       const w = await fetchWarehouseMeta(formData.warehouse);
//       if (!w || cancelled) return;

//       const costCenter =
//         w.cost_center ||
//         w.default_cost_center ||
//         w.parent_cost_center ||
//         w.costcenter ||
//         "";

//       setFormData((prev) => ({
//         ...prev,
//         costCenter: costCenter || prev.costCenter,
//       }));
//     };

//     autoFillFromWarehouse();

//     return () => {
//       cancelled = true;
//     };
//   }, [formData.warehouse]);
//   useEffect(() => {
//     if (!isOpen || !formData.warehouse) {
//       setVehicleOptions([]);
//       return;
//     }

//     const fetchVehicles = async () => {
//       setIsLoading(true);
//       try {
//         const vehicles = await fetchFrappeDoctype(
//           VEHICLE_DOCTYPE,
//           ["name"],
//           [["warehouse", "=", formData.warehouse]]
//         ) as FrappeDoc[];

//         console.log("Fetched vehicles for", formData.warehouse, vehicles);
//         setVehicleOptions(vehicles);
//       } catch (e) {
//         console.error("Vehicle fetch error:", e);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchVehicles();
//   }, [formData.warehouse, isOpen]);

//   const checkWarehouseSelection = () => {
//     if (!formData.warehouse) {
//       showAlert("Missing Warehouse", "Please select a Source Warehouse first to filter Registration No.");
//       return false;
//     }
//     return true;
//   };



//   const handleSelectChange = (key: string, value: string) =>
//     setFormData((p) => ({ ...p, [key]: value }))

//   const handleInputChange = (e: any) =>
//     setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

//   const handleSubmit = async () => {
//     const dataToSubmit = getProcessedData();
//     if (!dataToSubmit) return; // Agar validation fail hui toh ruk jao

//     setIsSubmitting(true);
//     try {
//       const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), { credentials: "include" });
//       const tokenResult = await tokenResp.json();
//       const csrfToken = tokenResult.message;

//       const fd = new FormData();
//       // dataToSubmit mein 'time' field ab calculated seconds hai
//       fd.append("data", JSON.stringify(dataToSubmit));

//       const res = await axios.post(
//         getApiUrl(config.api.method("vms.api.submit_utilization_report")),
//         fd,
//         {
//           withCredentials: true,
//           headers: { "X-Frappe-CSRF-Token": csrfToken }
//         }
//       );

//       if (res.status === 200) {
//         showAlert("Success", "Utilization Log Saved Successfully!", [
//           {
//             text: "OK",
//             style: "default",
//             onPress: () => window.location.reload(),
//           },
//         ]);
//       }
//     } catch (err) {
//       const errorMsg = getErrorMessage(err);
//       showAlert("Error", errorMsg, [{ text: "OK", style: "destructive" }]);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
//   const handleUpdate = async () => {
//     const dataToSubmit = getProcessedData();
//     if (!dataToSubmit) return; // Validation failed

//     if (!record) {
//       showAlert("Error", "Record missing");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), { credentials: "include" });
//       const tokenResult = await tokenResp.json();
//       const csrfToken = tokenResult.message;

//       const res = await axios.put(
//         getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${record.name}`),
//         dataToSubmit, // Seedha cleaned object bhej rahe hain
//         {
//           withCredentials: true,
//           headers: { "X-Frappe-CSRF-Token": csrfToken }
//         }
//       );

//       if (res.status === 200) {
//         showAlert("Success", "Utilization Updated Successfully!", [
//           {
//             text: "OK",
//             style: "default",
//             onPress: () => window.location.reload(),
//           },
//         ]);
//       }
//     } catch (err) {
//       const errorMsg = getErrorMessage(err);
//       showAlert("Error", errorMsg, [{ text: "OK", style: "destructive" }]);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const isBusy = isLoading || isSubmitting

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl p-0 bg-white max-h-[90vh] flex flex-col overflow-hidden">
//         <div className="p-6 pb-2 flex-none">
//           <DialogHeader>
//             <DialogTitle className="text-2xl font-bold">
//               {record ? "Edit Utilization Event" : "Log Utilization Event"}
//             </DialogTitle>
//           </DialogHeader>
//         </div>
//         <UtilizationLogEventForm
//           formData={formData}
//           onInputChange={handleInputChange}
//           onSelectChange={handleSelectChange}
//           plantOptions={plantOptions}
//           costCenterOptions={costCenterOptions}
//           companyOptions={companyOptions}
//           warehouseOptions={warehouseOptions}
//           vehicleOptions={vehicleOptions}
//           supervisorOptions={supervisorOptions}
//           shiftOptions={shiftOptions}
//           statusOptions={statusOptions}
//           isBusy={isBusy}
//           isLoading={isLoading}
//           onEmployeeFieldClick={checkWarehouseSelection}

//         />

//         <DialogFooter className="p-6 pt-2">
//           <Button variant="outline" onClick={onClose} disabled={isBusy}>
//             Cancel
//           </Button>

//           {!record ? (
//             <Button className="bg-orange-500 text-white" disabled={isBusy} onClick={handleSubmit}>
//               {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Save Utilization Log"}
//             </Button>
//           ) : (
//             <Button className="bg-blue-600 text-white" disabled={isBusy} onClick={handleUpdate}>
//               {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Update Utilization Log"}
//             </Button>
//           )}
//         </DialogFooter>
//       </DialogContent>
//       <CustomAlert
//         visible={alertState.visible}
//         title={alertState.title}
//         message={alertState.message}
//         buttons={alertState.buttons}
//         onClose={closeAlert}
//       />
//     </Dialog>
//   )
// }



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
import CustomAlert from "../alert/alert"
import { AlertButton } from "../alert/types"

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
    status: "Breakdown",
    company: "",
    timeHours: "",
    timeMinutes: "",
    remarks: [],
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
    status: "Breakdown",
    company: "",
    timeHours: "",
    timeMinutes: "",
    remarks: [],
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

  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: "OK", style: "cancel" }],
    });
  };

  const closeAlert = () => {
    setAlertState((p) => ({ ...p, visible: false }));
  };

  const shiftOptions = [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "G" }]
  const statusOptions = [{ name: "Breakdown" }, { name: "Idle" }]

  const fetchWarehouseMeta = async (warehouseName: string) => {
    if (!warehouseName) return null;

    const fieldsParam = encodeURIComponent(
      JSON.stringify(["name", "cost_center"])
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
          fetchFrappeDoctype("Warehouse", ["name", "company"], [["is_group", "=", 0]]),
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
          const resp = await fetch(
            getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${record.name}`),
            { credentials: "include" }
          )
          const result = await resp.json()
          const doc = result.data

          if (doc.supervisor_name) {
            setSupervisorOptions(prev => {
              const exists = prev.some(opt => opt.name === doc.supervisor_name);
              if (!exists) {
                return [...prev, { name: doc.supervisor_name, full_name: doc.supervisor_name }];
              }
              return prev;
            });
          }
          // REVERSE CALCULATION: Seconds ko Hours:Minutes mein todna
          const totalSecs = parseInt(doc.time) || 0;
          const h = Math.floor(totalSecs / 3600);
          const m = Math.floor((totalSecs % 3600) / 60);

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
            status: doc.status || "Breakdown",
            company: doc.company || "",
            timeHours: h.toString(),
            timeMinutes: m.toString(),
            remarks: doc.remark ? doc.remark.split(", ") : [],
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

  // NAYA LOGIC: fromDate aur toDate ke basis par timeHours & timeMinutes nikalna

  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end >= start) {
          const diffMs = end.getTime() - start.getTime();
          const totalMins = Math.floor(diffMs / 60000); 
          const h = Math.floor(totalMins / 60);
          const m = totalMins % 60;

          setFormData((prev) => ({
            ...prev,
            timeHours: h.toString(),
            timeMinutes: m.toString(),
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            timeHours: "0",
            timeMinutes: "0",
          }));
        }
      }
    }
  }, [formData.fromDate, formData.toDate]);


  const getProcessedData = () => {
    const hmrValue = parseFloat(formData.hmr);
    if (!formData.hmr || hmrValue <= 0) {
      showAlert("Validation Error", "Current HMR/Kms must be greater than 0.");
      return null;
    }
    const h = parseInt(formData.timeHours) || 0;
    const m = parseInt(formData.timeMinutes) || 0;

    // Validation: Minutes 59 se zyada nahi hone chahiye
    if (m > 59) {
      showAlert("Validation Error", "Minutes 59 se zyada nahi ho sakte.");
      return null;
    }

    // Total Seconds Calculation: (Hours * 3600) + (Minutes * 60)
    const totalSeconds = (h * 3600) + (m * 60);

    // Backend friendly object return karna
    return {
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
      time: totalSeconds.toString(), // Database mein seconds jayenge
      remark: formData.remarks && formData.remarks.length > 0 
            ? formData.remarks.join(", ") 
            : "",
    };
  };

  const checkWarehouseSelection = () => {
    if (!formData.warehouse) {
      showAlert("Missing Warehouse", "Please select a Source Warehouse first to filter Registration No.");
      return false;
    }
    return true;
  };

  const handleSelectChange = (key: string, value: string) =>
    setFormData((p) => ({ ...p, [key]: value }))

  const handleInputChange = (e: any) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

const handleAddRemark = (newRemark: string) => {
  if (!newRemark.trim()) return;
  setFormData(prev => ({
    ...prev,
    remarks: [...prev.remarks, newRemark.trim()]
  }));
};

const handleRemoveRemark = (index: number) => {
  setFormData(prev => ({
    ...prev,
    remarks: prev.remarks.filter((_, i) => i !== index)
  }));
};

  const handleSubmit = async () => {
    const dataToSubmit = getProcessedData();
    if (!dataToSubmit) return; 

    setIsSubmitting(true);
    try {
      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), { credentials: "include" });
      const tokenResult = await tokenResp.json();
      const csrfToken = tokenResult.message;

      const fd = new FormData();
      fd.append("data", JSON.stringify(dataToSubmit));

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.submit_utilization_report")),
        fd,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrfToken }
        }
      );

      if (res.status === 200) {
        showAlert("Success", "Utilization Log Saved Successfully!", [
          {
            text: "OK",
            style: "default",
            onPress: () => window.location.reload(),
          },
        ]);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      showAlert("Error", errorMsg, [{ text: "OK", style: "destructive" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    const dataToSubmit = getProcessedData();
    if (!dataToSubmit) return; 

    if (!record) {
      showAlert("Error", "Record missing");
      return;
    }

    setIsSubmitting(true);
    try {
      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), { credentials: "include" });
      const tokenResult = await tokenResp.json();
      const csrfToken = tokenResult.message;

      const res = await axios.put(
        getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${record.name}`),
        dataToSubmit, 
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrfToken }
        }
      );

      if (res.status === 200) {
        showAlert("Success", "Utilization Updated Successfully!", [
          {
            text: "OK",
            style: "default",
            onPress: () => window.location.reload(),
          },
        ]);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      showAlert("Error", errorMsg, [{ text: "OK", style: "destructive" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isLoading || isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-white max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 pb-2 flex-none">
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
          onAddRemark={handleAddRemark}
          onRemoveRemark={handleRemoveRemark}
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
            <Button disabled={isBusy} onClick={handleUpdate}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Update Utilization Log"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={closeAlert}
      />
    </Dialog>
  )
}

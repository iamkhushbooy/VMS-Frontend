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
import { fetchFrappeDoctype, VEHICLE_DOCTYPE } from "../maintenance/MaintenanceShared"
import { getErrorMessage } from "@/lib/errorMessage"
import { Pagination } from "./Pagination"
import CustomAlert from "../alert/alert"
import { AlertButton } from "../alert/types"
const DOCTYPE = "Vehicle Refueling"

interface FrappeDoc {
  name: string
  [key: string]: any

}

interface VehicleDoc extends FrappeDoc {
  last_odometer?: number
}

export interface FuelEntry {
  fuel_qty_in_ltrs?: number
  id: string
  vehicle: string
  registrationName: string
  date: string
  current_hmrkms?: number
  fuel_consumption?: number
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
    fuel_qty_in_ltrs: undefined,
    current_hmrkms: undefined,
    fuel_consumption: undefined,
  })
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      issuerName: "",
      company: companyOptions.length > 0 ? companyOptions[0].name : "",
      sourceWarehouse: "",
      fuelItem: "",
      costCenter: "",
    });
    setFuelEntries([]);
    setCurrentName(null);
    setDocStatus(0);
    setIsEditMode(true);
    setNewEntry({
      vehicle: "",
      registrationName: "",
      date: new Date().toISOString().split("T")[0],
      fuel_qty_in_ltrs: undefined,
      current_hmrkms: undefined,
      fuel_consumption: undefined,
    });
  };

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
  const [itemLoading, setItemLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const itemsPerPage = 5;
  const totalPages = Math.ceil(fuelEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = fuelEntries.slice(startIndex, startIndex + itemsPerPage);
  const handleAddEntry = () => {
    addFuelEntry();
    const newTotalPages = Math.ceil((fuelEntries.length + 1) / itemsPerPage);
    setCurrentPage(newTotalPages);
  };

  const fetchFilteredItems = useCallback(async (query: string) => {
    setItemLoading(true);
    try {
      const filters = [["disabled", "=", 0]];
      if (query) {
        filters.push(["name", "like", `%${query}%`]);
      }

      const fieldsParam = encodeURIComponent(JSON.stringify(["name", "item_name"]));
      const filtersParam = encodeURIComponent(JSON.stringify(filters));
      const url = `${getApiUrl(config.api.resource("Item"))}?fields=${fieldsParam}&filters=${filtersParam}&limit_page_length=20`;

      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      setItemOptions(json.data || []);
    } catch (err) {
      console.error("Item fetch error", err);
    } finally {
      setItemLoading(false);
    }
  }, []);
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isOpen) {
        fetchFilteredItems(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isOpen, fetchFilteredItems]);
  useEffect(() => {
    if (isOpen) {
      fetchFilteredItems("");
    }
  }, [isOpen, fetchFilteredItems]);

  const fetchOptions = async (doctype: string, fields = ["name"], filters: any[] = []) => {
    const fieldsParam = encodeURIComponent(JSON.stringify(fields))
    let url = `${getApiUrl(config.api.resource(doctype))}?fields=${fieldsParam}&limit_page_length=None`

    if (filters && filters.length > 0) {
      url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`
    }

    try {
      const res = await fetch(url, { credentials: "include" })
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
      JSON.stringify(["name", "cost_center", "is_group"])
    );
    const filtersParam = encodeURIComponent(
      JSON.stringify([
        ["name", "=", warehouseName],
        ["is_group", "=", 0]
      ])
    );

    try {
      const url = `${getApiUrl(config.api.resource("Warehouse"))}?fields=${fieldsParam}&filters=${filtersParam}`;

      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return json.data[0];
      }

      return null;
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
          fuel_qty_in_ltrs: d.fuel_qty_in_ltrs ?? d.fuel_qty_in_ltrs ?? 0,
          current_hmrkms: d.current_hmrkms,
          fuel_consumption: d.fuel_consumption,
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
    if (!record) {
      resetForm();
    }
    let cancelled = false
    const loadDropdowns = async () => {
      try {
        setIsLoading(true);
        const companyUrl = getApiUrl(
          `/api/resource/Company?fields=${encodeURIComponent(JSON.stringify(["name"]))}`
        );
        const companyRes = await fetch(companyUrl, { method: "GET", credentials: "include" });
        const companyData = await companyRes.json();
        const assignedCompanies = companyData?.data?.map((c: { name: string }) => c.name) || [];
        const [allCompanies, warehousesAll, centers] = await Promise.all([
          fetchOptions("Company"),
          fetchOptions("Warehouse", ["name", "company"]),
          fetchOptions("Cost Center"),
        ]);
        const empUrl = getApiUrl("/api/method/vms.api.get_all_employees");
        const empRes = await fetch(empUrl, { method: "GET", credentials: "include" });
        const eAll = await empRes.json();

        if (cancelled) return;
        const filteredCompanies = allCompanies.filter((item: { name: string }) =>
          assignedCompanies.includes(item.name)
        );


        const empsWithCombinedLabel = (eAll.message || []).map((emp: any) => ({
          ...emp,
          combined_label: `${emp.name} - ${emp.employee_name}`
        }));


        setCompanyOptions(filteredCompanies);
        setCostCenterOptions(centers);
        setAllEmployeeOptions(empsWithCombinedLabel);
        setAllWarehouseOptions(warehousesAll);
        fetchFilteredItems("");
        if (!record && filteredCompanies.length > 0) {
          setFormData(prev => ({
            ...prev,
            company: prev.company || filteredCompanies[0].name
          }));
        }

        if (record?.name) {
          await loadRecord(record.name);
        } else {
          setCurrentName(null);
          setDocStatus(0);
          setIsEditMode(true);
          setFuelEntries([]);
          setFormData(p => ({
            ...p,
            date: new Date().toISOString().split("T")[0],
          }));
        }
      } catch (err) {
        console.error("loadDropdowns error", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDropdowns()
    return () => {
      cancelled = true
    }
  }, [isOpen, record, loadRecord])

  const checkWarehouseSelection = () => {
    if (!formData.costCenter) {
      showAlert("Error", "Please select a Source Warehouse first to filter the Issuer Name.");
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
            const filteredWithLabels = (result.data || []).map((emp: any) => ({
              ...emp,
              combined_label: `${emp.name} - ${emp.employee_name}`
            }));
            setIssuerOptions(filteredWithLabels);
          }
        } catch (error) {
          console.error("Failed to fetch filtered employees:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
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

  useEffect(() => {
    if (!isOpen || !formData.sourceWarehouse) {
      setVehicleOptions([]);
      return;
    }

    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const vehicles = await fetchFrappeDoctype(
          VEHICLE_DOCTYPE,
          ["name"],
          [["warehouse", "=", formData.sourceWarehouse]]
        ) as VehicleDoc[];

        console.log("Fetched vehicles for", formData.sourceWarehouse, vehicles);
        setVehicleOptions(vehicles);
      } catch (e) {
        console.error("Vehicle fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [formData.sourceWarehouse, isOpen]);

  const checkWarehouseForVehicle = () => {
    if (!formData.sourceWarehouse) {
      showAlert("Error", "Please select a Source Warehouse first to filter Registration No.");
      return false;
    }
    return true;
  };


  const addFuelEntry = () => {
    if (!newEntry.vehicle || !newEntry.fuel_qty_in_ltrs) return

    const entry: FuelEntry = {
      id: `${Date.now()}`,
      vehicle: newEntry.vehicle!,
      registrationName: newEntry.registrationName || newEntry.vehicle!,
      date: newEntry.date!,
      fuel_qty_in_ltrs: newEntry.fuel_qty_in_ltrs!,
      current_hmrkms: newEntry.current_hmrkms,
      fuel_consumption: newEntry.fuel_consumption,
    }

    setFuelEntries((prev) => [...prev, entry])
    setNewEntry({
      vehicle: "",
      registrationName: "",
      date: new Date().toISOString().split("T")[0],
      fuel_qty_in_ltrs: undefined,
      current_hmrkms: undefined,
      fuel_consumption: undefined,
    })
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
      console.log("Saving Payload Data:", JSON.stringify(payload, null, 2));

      const fd = new FormData()
      fd.append("data", JSON.stringify(payload))

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.save_vehicle_refueling")),
        fd,
        { withCredentials: true, headers: { "X-Frappe-CSRF-Token": csrf } }
      )

      if (res.status >= 200 && res.status < 300 && res.data.message) {
        const responseData = res.data.message.message || res.data.message;
        const docName = responseData.name;
        const status = responseData.docstatus ?? 0;
        if (docName) {
          setCurrentName(docName);
          setDocStatus(status);
          setIsEditMode(true);
          showAlert(
            "Success",
            currentName ? "Record updated successfully." : "Record saved successfully.",
            [{
              text: "Continue",
              style: "default",
              onPress: () => { if (onSuccess) onSuccess(); }
            }]
          );
          if (onSuccess) onSuccess();
        } else {
          console.error("Doc Name still null after extraction attempt");
        }
      }

    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      showAlert("Submission Failed", errorMsg, [
        { text: "Close", style: "cancel" }
      ]);
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const csrf = await getCSRF();
      const payload: any = {
        ...(currentName ? { name: currentName } : {}),
        date: formData.date,
        issuer_name: formData.issuerName,
        company: formData.company,
        source_warehouse: formData.sourceWarehouse,
        fuel_item: formData.fuelItem,
        cost_center: formData.costCenter,
        submit: 1,
        vehicle_refueling_details: fuelEntries.map((f) => ({
          vehicle: f.vehicle,
          date: f.date,
          fuel_qty_in_ltrs: f.fuel_qty_in_ltrs,
          current_hmrkms: f.current_hmrkms,
          fuel_consumption: f.fuel_consumption,
        })),
      };
      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.submit_vehicle_refueling")),
        fd,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrf },
        }
      );
      if (res.status >= 200 && res.status < 300 && res.data.message) {
        const docName = res.data.message.name || currentName;
        setCurrentName(docName);
        setDocStatus(1);
        setIsEditMode(false);
        showAlert(
          "Submitted Successfully",
          `Record ${docName} has been Submitted.`,
          [{ text: "Finish", style: "default", onPress: () => { onSuccess?.(); onClose?.(); } }]
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error("The server acknowledged the request but did not return a valid document.");
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Submission Error:", err);
      showAlert("Submission Failed", getErrorMessage(err), [{ text: "Close", style: "cancel" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusAction = async () => {
    setIsSubmitting(true)
    try {
      const csrf = await getCSRF()
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
       showAlert("Cancelled", "The record has been successfully cancelled.", [
      { text: "OK", style: "default", onPress: () => onSuccess?.() }
    ]);
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

        showAlert("Draft Created", "You are now editing a new draft version of this record.", [
      { text: "Start Editing", style: "default", onPress: () => onSuccess?.() }
    ]);
        if (onSuccess) onSuccess()
      }
    } catch (e) {
      console.error("status action error", e)
      showAlert("Error", "Failed to create an amendment draft.", [{ text: "Close", style: "cancel" }]);
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBusy = isLoading || isSubmitting

  const handleFuelItemSelect = (val: string) => {
    setFormData((prev) => ({ ...prev, fuelItem: val }));
    setSearchTerm("");
  };

  const removeFuelEntry = (id: string) => {
    setFuelEntries((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      const maxPage = Math.ceil(updated.length / itemsPerPage) || 1;
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
      return updated;
    });
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-y-auto">
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
            onItemSearch={setSearchTerm}
            onFuelItemSelect={handleFuelItemSelect}
            itemLoading={itemLoading}
          />

          <h3 className="font-semibold text-lg mt-4">Fuel Entry</h3>

          {isEditMode && (
            <FuelEntryForm
              newEntry={newEntry}
              setNewEntry={setNewEntry}
              vehicleOptions={vehicleOptions}
              addFuelEntry={handleAddEntry}
              onVehicleFieldClick={checkWarehouseForVehicle}
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
              {paginatedEntries.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.registrationName}</TableCell>
                  <TableCell>{f.date}</TableCell>
                  <TableCell>{f.fuel_qty_in_ltrs}</TableCell>
                  <TableCell>{f.current_hmrkms}</TableCell>
                  <TableCell>{f.fuel_consumption}</TableCell>
                  <TableCell>
                    {isEditMode && (
                      <Button variant="ghost" size="sm" onClick={() => removeFuelEntry(f.id)}>
                        <Trash2 className="text-red-500 h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            disabled={isBusy}
          />
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

































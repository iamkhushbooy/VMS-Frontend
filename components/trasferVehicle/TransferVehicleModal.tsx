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
import { User } from "lucide-react"
import axios from "axios"

import { getErrorMessage } from "@/lib/errorMessage"
import { getApiUrl, config } from "@/lib/config"
import CustomAlert from "../alert/alert"
import { AlertButton } from "../alert/types"

import { InputGroup } from "@/components/vehicleMaster/FormLayout"
import ReusableCombobox from "@/components/vehicleMaster/ReusableCombobox"
import { CustomDatePicker } from "../ui/CustomDatePicker"

const DOCTYPE_NAME = "Transfer Vehicle"

interface FrappeDoc {
  name: string
  [key: string]: any
}

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
}

const fetchFrappeDoctype = async (
  doctype: string,
  fields: string[] = ["name"],
  filters: any[] = []
): Promise<FrappeDoc[]> => {
  const fieldsParam = encodeURIComponent(JSON.stringify(fields))
  let url = `${getApiUrl(config.api.resource(doctype))}?fields=${fieldsParam}&limit_page_length=2000`
  if (filters.length > 0)
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`

  try {
    const response = await fetch(url, { credentials: "include" })
    if (!response.ok) throw new Error()
    return (await response.json()).data || []
  } catch {
    return []
  }
}

export function TransferVehicleModal({ isOpen, onClose }: TransferModalProps) {
  const [formData, setFormData] = useState({
    registrationNo: "",
    fromWarehouse: "",
    toWarehouse: "",
    date: new Date().toISOString().split('T')[0],
    employee: "",
  })

  const [vehicleOptions, setVehicleOptions] = useState<FrappeDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
  const [employeeOptions, setEmployeeOptions] = useState<FrappeDoc[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const closeAlert = () => setAlertState((p) => ({ ...p, visible: false }));

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        registrationNo: "",
        fromWarehouse: "",
        toWarehouse: "",
        date: new Date().toISOString().split('T')[0],
        employee: "",
      });
      return;
    }

    let cancel = false;
    setIsLoading(true);

    const loadData = async () => {
      const [vehicles, warehouses, employees] = await Promise.all([
        fetchFrappeDoctype("Vehicle Master", ["name", "license_plate", "warehouse"]),
        fetchFrappeDoctype("Warehouse", ["name"], [["is_group", "=", 0]]),
        fetchFrappeDoctype("Employee", ["name", "employee_name"]),
      ])

      if (cancel) return

      const vehiclesWithLabel = vehicles.map((v) => ({
        ...v,
        display_label: v.license_plate ? `${v.license_plate} (${v.name})` : v.name
      }));
      setVehicleOptions(vehiclesWithLabel)

      setWarehouseOptions(warehouses)

      const empsWithCombinedLabel = employees.map((emp) => ({
        ...emp,
        combined_label: `${emp.name} - ${emp.employee_name}`
      }));
      setEmployeeOptions(empsWithCombinedLabel);
    }

    loadData().finally(() => setIsLoading(false))
    return () => { cancel = true }
  }, [isOpen])

  const handleSelectChange = (field: string, value: string) => {
    if (field === "registrationNo") {
      const selectedVehicle = vehicleOptions.find(v => v.name === value);
      setFormData(prev => ({
        ...prev,
        registrationNo: value,
        fromWarehouse: selectedVehicle?.warehouse || ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }

  const handleSubmit = async () => {
    if (!formData.registrationNo || !formData.toWarehouse || !formData.date) {
      return showAlert("Validation Error", "Please complete all required fields.");
    }

    if (formData.fromWarehouse === formData.toWarehouse) {
      return showAlert("Validation Error", "Target warehouse cannot be the same as the current warehouse.");
    }

    setIsSubmitting(true)

    try {
      const csrfRes = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include"
      })
      const csrfToken = (await csrfRes.json()).message

      const payload = {
        registration_no: formData.registrationNo,
        from_warehouse: formData.fromWarehouse,
        to_warehouse: formData.toWarehouse,
        date: formData.date,
        employee: formData.employee,
      }

      const res = await axios.post(
        getApiUrl(config.api.resource(DOCTYPE_NAME)),
        payload,
        {
          withCredentials: true,
          headers: {
            "X-Frappe-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        }
      )

      if (res.status === 200) {

        // Update Vehicle Master warehouse
        await axios.put(
          getApiUrl(config.api.resource(`Vehicle Master/${formData.registrationNo}`)),
          {
            warehouse: formData.toWarehouse,
            employee: formData.employee,
          },
          {
            withCredentials: true,
            headers: {
              "X-Frappe-CSRF-Token": csrfToken,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
          }
        )

        showAlert("Success", "Vehicle transferred successfully!", [
          {
            text: "OK",
            style: "cancel",
            onPress: () => {
              onClose();
              window.location.reload();
            },
          },
        ]);
      }

    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      showAlert("Transfer Failed", errorMsg, [{ text: "OK", style: "destructive" }]);
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-visible flex flex-col bg-white max-w-4xl">
        <div className="p-6 border-b bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Transfer Vehicle</DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            {/* Left Column */}
            <div className="space-y-4">
              <InputGroup label="Registration no." required>
                <ReusableCombobox
                  options={vehicleOptions}
                  value={formData.registrationNo}
                  onValueChange={(v: string) => handleSelectChange("registrationNo", v)}
                  placeholder="Select Vehicle"
                  displayField="display_label"
                  searchPlaceholder="Search vehicle..."
                  isLoading={isLoading}
                />
              </InputGroup>

              <InputGroup label="From Warehouse">
                <Input
                  name="fromWarehouse"
                  value={formData.fromWarehouse}
                  readOnly
                  className="bg-white cursor-not-allowed text-muted-foreground ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Auto-fetched on vehicle selection"
                />
              </InputGroup>

              <InputGroup label="Employee">
                <ReusableCombobox
                  icon={User}
                  options={employeeOptions}
                  value={formData.employee}
                  onValueChange={(v: string) => handleSelectChange("employee", v)}
                  placeholder="Select Employee"
                  displayField="combined_label"
                  searchPlaceholder="Search employee..."
                  isLoading={isLoading}
                />
              </InputGroup>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <InputGroup label="Date" required>
                <div className="[&>button]:h-10 [&>button]:w-full">
                  <CustomDatePicker
                  value={formData.date}
                  onChange={(newDateString) => handleSelectChange("date", newDateString)}
                />
                </div>
              </InputGroup>

              <InputGroup label="To Warehouse" required>
                <ReusableCombobox
                  options={warehouseOptions}
                  value={formData.toWarehouse}
                  onValueChange={(v: string) => handleSelectChange("toWarehouse", v)}
                  placeholder="Select Target Warehouse"
                  searchPlaceholder="Search warehouse..."
                  isLoading={isLoading}
                />
              </InputGroup>
            </div>

          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-muted/10">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
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
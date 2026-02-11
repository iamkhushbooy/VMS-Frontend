"use client"
import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { FormSection } from "./FormLayout"
import { Image as ImageIcon } from "lucide-react"
import VehicleIdentitySection from "./VehicleIdentitySection"
import VehicleDetailsSection from "./DetailsSection"
import VehicleInsuranceSection from "./InsuranceSection"
import VehicleAdditionalSection from "./AdditionalDetailsSection"
import { getErrorMessage } from "@/lib/errorMessage"
import { getApiUrl, config } from "@/lib/config"
const DOCTYPE_NAME = "Vehicle Master"

interface FrappeDoc {
  name: string
  [key: string]: any
}

interface VehicleModalProps {
  isOpen: boolean
  onClose: () => void
  record: { name: string } | null
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

const getImageUrl = (path?: string) => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return getApiUrl(path)
}

export function VehicleMasterModal({ isOpen, onClose, record }: VehicleModalProps) {
  const [formData, setFormData] = useState({
    licensePlate: "",
    make: "",
    model: "",
    image: "",
    lastOdometer: "",
    acquisitionDate: "",
    warehouse: "",
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

  const [vehicleImage, setVehicleImage] = useState<File | null>(null)
  const [employeeOptions, setEmployeeOptions] = useState<FrappeDoc[]>([])
  const [uomOptions, setUomOptions] = useState<FrappeDoc[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<FrappeDoc[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentName, setCurrentName] = useState("");

  const fuelTypeOptions = [
    { name: "Petrol" },
    { name: "Diesel" },
    { name: "Natural Gas" },
    { name: "Electric" },
    { name: "CNG" }
  ]

  useEffect(() => {
    if (!isOpen) return
    let cancel = false
    setIsLoading(true)

    const loadData = async () => {
      const [emps, uom, warehouseOptions] = await Promise.all([
        fetchFrappeDoctype("Employee", ["name", "employee_name"]),
        fetchFrappeDoctype("UOM", ["name"]),
        fetchFrappeDoctype("Warehouse", ["name"], [["is_group", "=", 0]]),
      ])
      const empsWithCombinedLabel = emps.map((emp) => ({
        ...emp,
        combined_label: `${emp.name} - ${emp.employee_name}`
      }));

      const uoms = uom.filter((item, index) => (item.name === "Litre"))
      if (cancel) return
      setEmployeeOptions(empsWithCombinedLabel);
      setUomOptions(uoms)
      setWarehouseOptions(warehouseOptions)

      if (record) {
        const result = await fetch(
          getApiUrl(`${config.api.resource(DOCTYPE_NAME)}/${record.name}`),
          { credentials: "include" }
        ).then(r => r.json())

        const doc = result.data
        setFormData({
          licensePlate: doc.license_plate || "",
          make: doc.make || "",
          model: doc.model || "",
          image: doc.image || "",
          lastOdometer: doc.last_odometer || "",
          acquisitionDate: doc.acquisition_date || "",
          warehouse: doc.warehouse || "",
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
      }
    }

    loadData().finally(() => setIsLoading(false))
    return () => { cancel = true }
  }, [isOpen, record])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    if (name === "licensePlate" || name === "chassisNo") {
      const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");
      setFormData({
        ...formData,
        [name]: alphanumericValue.toUpperCase()
      });
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Only image files (JPG, PNG, Jpeg) are allowed.");
      e.target.value = "";
      return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Error: Image size should be less than 2MB.");
      e.target.value = "";
      return;
    }

    // Agar validation pass ho jaye, toh aage ka logic (e.g., state update)
    console.log("File accepted:", file.name);
    // setVehicleImage(file); // Aapka state update logic yahan aayega
  };
  const uploadImageToFrappe = async (file: File) => {
    const csrfRes = await fetch(getApiUrl(config.api.getCsrfToken), {
      credentials: "include"
    })
    const csrfToken = (await csrfRes.json()).message

    const fd = new FormData()
    fd.append("file", file, file.name)
    fd.append("is_private", "0")
    fd.append("folder", "Home")

    const res = await axios.post(
      getApiUrl("/api/method/upload_file"),
      fd,
      {
        withCredentials: true,
        headers: { "X-Frappe-CSRF-Token": csrfToken }
      }
    )
    return res.data.message.file_url
  }

  const handleSubmit = async () => {
    if (!formData.licensePlate)
      return alert("License Plate is required")

    setIsSubmitting(true)
    const existingVehicles = await fetchFrappeDoctype(
      DOCTYPE_NAME,
      ["name"],
      [["license_plate", "=", formData.licensePlate]]
    );

    if (existingVehicles.length > 0) {
      alert("Already registered with this license plate");
      setIsSubmitting(false);
      return;
    }
    try {
      let uploadedImage = formData.image
      if (vehicleImage) {
        uploadedImage = await uploadImageToFrappe(vehicleImage)
      }

      const csrfRes = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include"
      })
      const csrfToken = (await csrfRes.json()).message

      const payload = {
        license_plate: formData.licensePlate,
        make: formData.make,
        model: formData.model,
        image: uploadedImage,
        last_odometer: formData.lastOdometer,
        acquisition_date: formData.acquisitionDate,
        warehouse: formData.warehouse,
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
        doors: formData.doors,
      }
      console.log("Payload to submit:", payload);

      const fd = new FormData()
      fd.append("data", JSON.stringify(payload))

      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.submit_vehicle_master")),
        fd,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrfToken }
        }
      )
      if (res.status === 200) {
        alert("Vehicle Updated Successfully!");
        window.location.reload()
      }

    } catch (err: any) {
      console.error("Backend Error Response:", err.response?.data);
      const errorMsg = getErrorMessage(err);
      alert(errorMsg);
    }

    setIsSubmitting(false)
  }

  const handleUpdate = async () => {
    setIsSubmitting(true)

    try {
      let uploadedImage = formData.image
      if (vehicleImage) {
        uploadedImage = await uploadImageToFrappe(vehicleImage)
      }

      const csrfRes = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include"
      })
      const csrfToken = (await csrfRes.json()).message

      const payload = {
        name: record?.name,
        license_plate: formData.licensePlate,
        make: formData.make,
        model: formData.model,
        image: uploadedImage,
        last_odometer: formData.lastOdometer,
        acquisition_date: formData.acquisitionDate,
        warehouse: formData.warehouse,
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
      }

      const fd = new FormData()
      fd.append("data", JSON.stringify(payload))

      const res = await axios.put(
        getApiUrl(config.api.method("vms.api.update_vehicle_master")),
        fd,
        {
          withCredentials: true,
          headers: { "X-Frappe-CSRF-Token": csrfToken }
        }
      )
      console.log("update:", res);

      if (res.status === 200) {
        alert("Vehicle Updated Successfully!");
        window.location.reload()
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      alert(errorMsg);
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">

        <div className="p-6 border-b bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {record ? "Full Vehicle Record" : "Register New Vehicle"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {record && formData.image && (
            <FormSection title="Vehicle Photo" icon={ImageIcon}>
              <div className="md:col-span-2 flex flex-col items-center gap-3 w-full">
                <div className="border rounded-2xl overflow-hidden bg-background/80 max-w-3xl w-full shadow-md">
                  <img
                    src={getImageUrl(formData.image)}
                    alt="Vehicle"
                    className="w-full max-w-3xl h-[350px] object-cover bg-muted"
                  />
                </div>

                {formData.licensePlate && (
                  <p className="text-sm font-medium text-muted-foreground mt-2">
                    {formData.licensePlate}
                  </p>
                )}
              </div>
            </FormSection>
          )}

          <VehicleIdentitySection
            formData={formData}
            handleInputChange={handleInputChange}
            handleImageChange={handleImageChange}
            isViewMode={!!record}
          />

          <VehicleDetailsSection
            formData={formData}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            employeeOptions={employeeOptions}
            warehouseOptions={warehouseOptions}
            isViewMode={!!record}
          />

          <VehicleInsuranceSection
            formData={formData}
            handleInputChange={handleInputChange}

          />

          <VehicleAdditionalSection
            formData={formData}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            fuelTypeOptions={fuelTypeOptions}
            uomOptions={uomOptions}

          />
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <Button onClick={onClose}>
            Cancel
          </Button>

          {!record && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Vehicle"}
            </Button>
          )}
          {record && (
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Vehicle"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

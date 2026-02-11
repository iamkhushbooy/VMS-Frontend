"use client"
import React from "react"
import { Input } from "@/components/ui/input"
import { FormSection, InputGroup } from "./FormLayout"
import ReusableCombobox from "./ReusableCombobox"
import { Gauge, MapPin, User } from "lucide-react"

interface VehicleDetailsSectionProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSelectChange: (field: string, value: string) => void
  employeeOptions: any[]
  warehouseOptions: any[]
  isViewMode: boolean
}

const VehicleDetailsSection: React.FC<VehicleDetailsSectionProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  employeeOptions,
  warehouseOptions,
  isViewMode
}) => {
  const maxDate = "2099-12-31"
  return (
    <FormSection title="Details" icon={Gauge}>
      <InputGroup label="Odometer Value (Last)" required>
        <div className="relative">
          <Input
            name="lastOdometer"
            type="number"
            min="0"
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            placeholder="Enter last odometer value"
            value={formData.lastOdometer}
            onChange={handleInputChange}
            disabled={isViewMode}
            className="mt-1 bg-input border-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </InputGroup>

      <InputGroup label="Acquisition Date">
        <Input
          name="acquisitionDate"

          type="date"
          value={formData.acquisitionDate}
          onChange={handleInputChange}
          max={maxDate}
        />
      </InputGroup>

      <InputGroup label="Source Warehouse" required>
        <ReusableCombobox
          options={warehouseOptions}
          value={formData.warehouse}
          onValueChange={(v: string) => handleSelectChange("warehouse", v)}
          placeholder="Select Warehouse"
          searchPlaceholder="Search..."
          isLoading={false}
        />
      </InputGroup>

      <InputGroup label="Chassis No" required>
        <Input
          name="chassisNo"
          value={formData.chassisNo}
          onChange={handleInputChange}
          placeholder="Enter Chassis No"
        />
      </InputGroup>

      <InputGroup label="Vehicle Value" required>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
          <Input
            name="vehicleValue"
            type="number"
            value={formData.vehicleValue}
            onChange={handleInputChange}
            min="0"
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            className="pl-8"
          />
        </div>
      </InputGroup>

      <InputGroup label="Employee" required>
        {/* <ReusableCombobox
          icon={User}
          options={employeeOptions}
          value={formData.employee}
          onValueChange={(v: string) => handleSelectChange("employee", v)}
          placeholder="Select Employee"
          displayField="employee_name"
          isLoading={false}
        />
        */}


        <ReusableCombobox
          icon={User}
          options={employeeOptions}
          value={formData.employee}
          onValueChange={(v: string) => handleSelectChange("employee", v)}
          placeholder="Select Employee"
          displayField="combined_label"
          isLoading={false}
        />
      </InputGroup>
    </FormSection>
  )
}

export default VehicleDetailsSection

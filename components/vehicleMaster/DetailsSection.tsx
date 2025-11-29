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
  isViewMode:boolean
}

const VehicleDetailsSection: React.FC<VehicleDetailsSectionProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  employeeOptions,
  isViewMode
}) => {
  return (
    <FormSection title="Details" icon={Gauge}>
      <InputGroup label="Odometer Value (Last)" required>
        <div className="relative">
          <Input
            name="lastOdometer"
            type="number"
            value={formData.lastOdometer}
            onChange={handleInputChange}
            disabled={isViewMode}
            className="pl-9"
          />
          <Gauge className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
      </InputGroup>

      <InputGroup label="Acquisition Date">
        <Input
          name="acquisitionDate"
          type="date"
          value={formData.acquisitionDate}
          onChange={handleInputChange}
        />
      </InputGroup>

      <InputGroup label="Location">
        <div className="relative">
          <MapPin className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            name="location"
            value={formData.location}
            onChange={handleInputChange}

            placeholder="Enter Location"
            className="pl-9"
          />
        </div>
      </InputGroup>

      <InputGroup label="Chassis No">
        <Input
          name="chassisNo"
          value={formData.chassisNo}
          onChange={handleInputChange}
          className="uppercase"
        />
      </InputGroup>

      <InputGroup label="Vehicle Value">
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₹</span>
          <Input
            name="vehicleValue"
            type="number"
            value={formData.vehicleValue}
            onChange={handleInputChange}

            className="pl-8"
          />
        </div>
      </InputGroup>

      <InputGroup label="Employee">
        <ReusableCombobox
          icon={User}
          options={employeeOptions}
          value={formData.employee}
          onValueChange={(v: string) => handleSelectChange("employee", v)}
          placeholder="Select Employee"
          displayField="employee_name"
          isLoading={false}
        />
      </InputGroup>
    </FormSection>
  )
}

export default VehicleDetailsSection

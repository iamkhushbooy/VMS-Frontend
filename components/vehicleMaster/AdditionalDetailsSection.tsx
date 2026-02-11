"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { FormSection, InputGroup } from "./FormLayout"
import ReusableCombobox from "./ReusableCombobox"
import { Fuel } from "lucide-react"

interface VehicleAdditionalSectionProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSelectChange: (field: string, value: string) => void
  fuelTypeOptions: any[]
  uomOptions: any[]
}

const VehicleAdditionalSection: React.FC<VehicleAdditionalSectionProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
  fuelTypeOptions,
  uomOptions,
}) => {
  return (
    <FormSection title="Additional Details" icon={Fuel}>
      <InputGroup label="Fuel Type" required>
        <ReusableCombobox
          options={fuelTypeOptions}
          value={formData.fuelType}
          onValueChange={(v: string) => handleSelectChange("fuelType", v)}
          placeholder="Select Type"
          isLoading={false}
        />
      </InputGroup>

      <InputGroup label="Fuel UOM" required>
        <ReusableCombobox
          options={uomOptions}
          value={formData.fuelUOM}
          onValueChange={(v: string) => handleSelectChange("fuelUOM", v)}
          placeholder="Select UOM"
          isLoading={false}
        />
      </InputGroup>

      <InputGroup label="Last Carbon Check">
        <Input
          name="carbonCheckDate"
          type="date"
          value={formData.carbonCheckDate}
          onChange={handleInputChange}
        />
      </InputGroup>

      <InputGroup label="Color">
        <Input
          name="color"
          value={formData.color}
          onChange={handleInputChange}
          placeholder="e.g. Metallic Silver"
        />
      </InputGroup>

      <InputGroup label="Wheels">
        <Input
          name="wheels"
          type="number"
          min={0}
          onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
               }
          }}
          value={formData.wheels}
          onChange={handleInputChange}
        />
      </InputGroup>

      <InputGroup label="Doors">
        <Input
          name="doors"
          type="number"
          min={0}
          onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
               }
          }}
          value={formData.doors}
          onChange={handleInputChange}
        />
      </InputGroup>
    </FormSection>
  )
}

export default VehicleAdditionalSection

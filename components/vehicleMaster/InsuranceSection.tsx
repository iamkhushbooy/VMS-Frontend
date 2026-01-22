"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { FormSection, InputGroup } from "./FormLayout"
import { ShieldCheck, CreditCard, Calendar } from "lucide-react"

interface VehicleInsuranceSectionProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const VehicleInsuranceSection: React.FC<VehicleInsuranceSectionProps> = ({
  formData,
  handleInputChange,
}) => {
   const maxDate = "2099-12-31"
  return (
    <FormSection title="Insurance Details" icon={ShieldCheck}>
      <InputGroup label="Insurance Company">
        <Input
          name="insuranceCompany"
          value={formData.insuranceCompany}
          onChange={handleInputChange}
          placeholder="e.g. HDFC ERGO"
        />
      </InputGroup>

      <InputGroup label="Policy No">
        <div className="relative">
          <Input
            name="policyNo"
            value={formData.policyNo}
            onChange={handleInputChange}

            className="pl-9"
          />
          <CreditCard className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
      </InputGroup>

      <InputGroup label="Start Date">
        <div className="relative">
          <Input
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            max={maxDate}
            className="pl-9"
          />
          <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
      </InputGroup>

      <InputGroup label="End Date">
        <div className="relative">
          <Input
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleInputChange}
            min={formData.startDate}
            max={maxDate}
            className="pl-9"
          />
          <Calendar className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
      </InputGroup>
    </FormSection>
  )
}

export default VehicleInsuranceSection

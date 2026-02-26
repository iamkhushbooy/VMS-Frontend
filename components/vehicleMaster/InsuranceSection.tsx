"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { FormSection, InputGroup } from "./FormLayout"
import { ShieldCheck, CreditCard, Calendar } from "lucide-react"
import { CustomDatePicker } from "../ui/CustomDatePicker"

interface VehicleInsuranceSectionProps {
  formData: any
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const VehicleInsuranceSection: React.FC<VehicleInsuranceSectionProps> = ({
  formData,
  handleInputChange,
}) => {
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
            placeholder="Enter policy no."
            value={formData.policyNo}
            onChange={handleInputChange}

            className="pl-9"
          />
          <CreditCard className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
      </InputGroup>

      <InputGroup label="Start Date">
          <CustomDatePicker
            value={formData.startDate}
            onChange={(newDateString) => {
              handleInputChange({
                target: { name: 'startDate', value: newDateString }
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }}
          />
      </InputGroup>

      <InputGroup label="End Date">
          <CustomDatePicker
            value={formData.endDate}
            onChange={(newDateString) => {
              handleInputChange({
                target: { name: 'endDate', value: newDateString }
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }}
          />
      </InputGroup>
    </FormSection>
  )
}

export default VehicleInsuranceSection

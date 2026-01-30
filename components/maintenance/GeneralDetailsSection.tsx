"use client"
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ReusableCombobox,
  MultiSelectCombobox,
  type FrappeDoc,
  type VehicleDoc,
} from "./MaintenanceShared"

interface GeneralDetailsProps {
  formData: any
  handleSelectChange: (name: string, value: string) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleVehicleSelect: (vehicleName: string) => void
  handleMultiSelectChange: (name: string, values: string[]) => void

  seriesOptions: any[]
  employeeOptions: FrappeDoc[]
  jobCardTypeOptions: any[]
  vehicleOptions: VehicleDoc[]
  warehouseOptions: FrappeDoc[]
  priorityOptions: any[]
  statusOptions: any[]
  jsaOptions: any[]
  housekeepingOptions: any[]
  companyOptions: FrappeDoc[]
  isBusy: boolean
  showTimeField: boolean
  onEmployeeFieldClick: () => void
}

export function GeneralDetailsSection({
  formData,
  handleSelectChange,
  handleInputChange,
  handleVehicleSelect,
  handleMultiSelectChange,
  employeeOptions,
  jobCardTypeOptions,
  vehicleOptions,
  warehouseOptions,
  priorityOptions,
  statusOptions,
  jsaOptions,
  housekeepingOptions,
  companyOptions,
  isBusy,
  showTimeField,
  onEmployeeFieldClick,
}: GeneralDetailsProps) {
  formData.registration_no !== ""
  return (
    <div className="space-y-4 bg-slate-100/50 p-5 rounded-lg border border-slate-100">
      <h3 className="text-lg font-semibold text-foreground mb-4">General Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* <div>
          <Label htmlFor="series" className="text-foreground mb-1">Series</Label>
          <ReusableCombobox options={seriesOptions} value={formData.series} onValueChange={(v: string) => handleSelectChange("series", v)} placeholder="Select series" searchPlaceholder="Search..." isLoading={isBusy} disabled={isBusy || !!log} />
        </div> */}
        <div>
          <Label htmlFor="company" className="text-foreground mb-1">Company <span className="text-red-800">*</span></Label>
          <ReusableCombobox
            options={companyOptions}
            value={formData.company}
            onValueChange={(v: string) => handleSelectChange("company", v)}
            placeholder="Select Company"
            searchPlaceholder="Search..."
            isLoading={isBusy}
          />
        </div>

        <div>
          <Label htmlFor="warehouse" className="text-foreground mb-1">Source Warehouse <span className="text-red-800">*</span></Label>
          <ReusableCombobox
            options={warehouseOptions}
            value={formData.warehouse}
            onValueChange={(v: string) => handleSelectChange("warehouse", v)}
            placeholder="Select Warehouse"
            searchPlaceholder="Search..."
            isLoading={isBusy}
          />
        </div>
        <div onPointerDown={onEmployeeFieldClick}>
          <Label htmlFor="issuer_name" className="text-foreground mb-1">Issuer Name <span className="text-red-800">*</span></Label>
          <ReusableCombobox options={employeeOptions} value={formData.issuer_name} onValueChange={(v: string) => handleSelectChange("issuer_name", v)} placeholder="Select issuer" searchPlaceholder="Search..." displayField="employee_name" isLoading={isBusy} />
        </div>

        <div>
          <Label htmlFor="job_cards_type" className="text-foreground mb-1">Job Card Type <span className="text-red-800">*</span></Label>
          <ReusableCombobox
            options={jobCardTypeOptions}
            value={formData.job_cards_type}
            onValueChange={(v: string) => handleSelectChange("job_cards_type", v)}
            placeholder="Select Job Card Type"
            searchPlaceholder="Search types..."
            isLoading={isBusy}
          />
        </div>

        <div>
          <Label htmlFor="priority" className="text-foreground mb-1">Priority</Label>
          <ReusableCombobox options={priorityOptions} value={formData.priority} onValueChange={(v: string) => handleSelectChange("priority", v)} placeholder="Select priority" searchPlaceholder="Search..." isLoading={isBusy} />
        </div>

        <div onMouseDown={onEmployeeFieldClick}>
          <Label htmlFor="registration_no" className="text-foreground mb-1">Registration No <span className="text-red-800">*</span></Label>
          <ReusableCombobox options={vehicleOptions} value={formData.registration_no} onValueChange={handleVehicleSelect} placeholder="Select vehicle" searchPlaceholder="Search..." displayField="name" isLoading={isBusy} />
        </div>
        {formData.registration_no && (
          <>
            <div>
              <Label htmlFor="make" className="text-foreground">Make</Label>
              <Input id="make" name="make" value={formData.make} readOnly className="mt-1 bg-input" disabled />
            </div>
            <div>
              <Label htmlFor="model" className="text-foreground">Model</Label>
              <Input id="model" name="model" value={formData.model} readOnly className="mt-1 bg-input" disabled />
            </div>
            <div>
              <Label htmlFor="last_odometer_value" className="text-foreground">Last Odometer Value</Label>
              <Input
                id="last_odometer_value"
                name="last_odometer_value"
                type="number"
                value={formData.last_odometer_value}
                onChange={handleInputChange}
                readOnly
                className="mt-1 bg-input border-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled
              />
            </div>
          </>
        )}

        <div>
          <Label htmlFor="current_odometer_value" className="text-foreground">
            Current Odometer Value <span className="text-red-800">*</span>
          </Label>
          <Input
            id="current_odometer_value"
            name="current_odometer_value"
            type="number"
            min="0"
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
            }}
            value={formData.current_odometer_value}
            onChange={handleInputChange}
            className="mt-1 bg-input border-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            disabled={isBusy}
            placeholder="Enter reading"
          />
        </div>


        <div>
          <Label htmlFor="status" className="text-foreground mb-1">Status <span className="text-red-800">*</span></Label>
          <ReusableCombobox options={statusOptions} value={formData.status} onValueChange={(v: string) => handleSelectChange("status", v)} placeholder="Select status" searchPlaceholder="Search..." isLoading={isBusy} />
        </div>

        <div>
          <Label htmlFor="date_and_time_of_job_initiation" className="text-foreground">Date and Time of Job Initiation <span className="text-red-800">*</span></Label>
          <Input id="date_and_time_of_job_initiation" name="date_and_time_of_job_initiation" type="datetime-local" value={formData.date_and_time_of_job_initiation} onChange={handleInputChange} className="mt-1 bg-input" disabled={isBusy} />
        </div>

        {showTimeField &&
          <div>
            <Label htmlFor="date_and_time_of_job_completion" className="text-foreground">Date and Time of Job Completion</Label>
            <Input id="date_and_time_of_job_completion" name="date_and_time_of_job_completion" type="datetime-local" value={formData.date_and_time_of_job_completion} onChange={handleInputChange} className="mt-1 bg-input" disabled={isBusy} />
          </div>
        }

        <div>
          <Label htmlFor="ptw_no" className="text-foreground">PTW No</Label>
          <Input id="ptw_no" name="ptw_no" value={formData.ptw_no} onChange={handleInputChange} className="mt-1 bg-input" disabled={isBusy} />
        </div>

        <div>
          <Label htmlFor="jsa_jra_tool_box_task" className="text-foreground mb-1">JSA/JRA Task</Label>
          <ReusableCombobox options={jsaOptions} value={formData.jsa_jra_tool_box_task} onValueChange={(v: string) => handleSelectChange("jsa_jra_tool_box_task", v)} placeholder="Select status" searchPlaceholder="Search..." isLoading={isBusy} />
        </div>
        <div>
          <Label htmlFor="house_keeping" className="text-foreground mb-1">House Keeping</Label>
          <ReusableCombobox options={housekeepingOptions} value={formData.house_keeping} onValueChange={(v: string) => handleSelectChange("house_keeping", v)} placeholder="Select option" searchPlaceholder="Search..." isLoading={isBusy} />
        </div>

        <div onMouseDown={onEmployeeFieldClick}>
          <Label htmlFor="working_employees" className="text-foreground mb-1">Working Employees <span className="text-red-800">*</span></Label>
          <MultiSelectCombobox options={employeeOptions} value={formData.working_employees} onValueChange={(v: string[]) => handleMultiSelectChange("working_employees", v)} placeholder="Select employees..." searchPlaceholder="Search..." displayField="employee_name" isLoading={isBusy} />
        </div>
      </div>
    </div>
  )
}

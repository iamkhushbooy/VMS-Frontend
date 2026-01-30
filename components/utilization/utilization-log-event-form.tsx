"use client"
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { ReusableCombobox } from "./ReusableCombobox"
import { on } from "events"

interface FrappeDoc {
  name: string
  [key: string]: any
}

interface UtilizationLogEventFormProps {
  formData: any
  onInputChange: (e: any) => void
  onSelectChange: (key: string, value: string) => void
  onEmployeeFieldClick: () => void
  plantOptions: FrappeDoc[]
  costCenterOptions: FrappeDoc[]
  warehouseOptions: FrappeDoc[]
  vehicleOptions: FrappeDoc[]
  supervisorOptions: FrappeDoc[]
  companyOptions:FrappeDoc[]
  shiftOptions: { name: string }[]
  statusOptions: { name: string }[]

  isBusy: boolean
  isLoading: boolean
}

export function UtilizationLogEventForm({
  formData,
  onInputChange,
  onSelectChange,
  plantOptions,
  costCenterOptions,
  companyOptions,
  warehouseOptions,
  vehicleOptions,
  supervisorOptions,
  shiftOptions,
  statusOptions,
  isBusy,
  isLoading,
  onEmployeeFieldClick
}: UtilizationLogEventFormProps) {
  const showTimeField = ["Breakdown", "Idle"].includes(formData.status)

  return (
    <div className="p-6 pt-2 space-y-6 overflow-y-auto max-h-[80vh]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* --- TOP SECTION: GENERAL INFO --- */}
      <div className="bg-slate-100/50 p-5 rounded-lg border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">Posting Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={onInputChange}
              disabled={isBusy}
              className="bg-white border-gray-200 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Supervisor */}
          <div className="space-y-1.5">
            <Label htmlFor="supervisorName" className="text-sm font-medium text-gray-700">Supervisor Name</Label>
            <ReusableCombobox
              options={supervisorOptions}
              value={formData.supervisorName}
              onValueChange={(v: string) => onSelectChange("supervisorName", v)}
              placeholder="Select Supervisor"
              searchPlaceholder="Search user..."
              displayField="full_name"
              isLoading={isBusy}
            />
          </div>

          {/* From / To Date & Time (only for Breakdown / Idle) */}
          {showTimeField && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">From Date & Time</Label>
                <Input
                  id="fromDate"
                  name="fromDate"
                  type="datetime-local"
                  value={formData.fromDate}
                  onChange={onInputChange}
                  disabled={isBusy}
                  className="bg-white border-gray-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">To Date & Time</Label>
                <Input
                  id="toDate"
                  name="toDate"
                  type="datetime-local"
                  value={formData.toDate}
                  onChange={onInputChange}
                  disabled={isBusy}
                  className="bg-white border-gray-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">Company</Label>
            <ReusableCombobox
              options={companyOptions}
              value={formData.company}
              onValueChange={(v: string) => onSelectChange("company", v)}
              placeholder="Select company"
              searchPlaceholder="Search company..."
              isLoading={isBusy}
            />
          </div>

          {/* Warehouse */}
          <div className="space-y-1.5">
            <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">Source Warehouse</Label>
            <ReusableCombobox
              options={warehouseOptions}
              value={formData.warehouse}
              onValueChange={(v: string) => onSelectChange("warehouse", v)}
              placeholder="Select warehouse"
              searchPlaceholder="Search warehouse..."
              isLoading={isBusy}
            />
          </div>

          {/* Cost Center */}
          <div className="space-y-1.5">
            <Label htmlFor="costCenter" className="text-sm font-medium text-gray-700">Cost Center</Label>
            <ReusableCombobox
              options={costCenterOptions}
              value={formData.costCenter}
              onValueChange={(v: string) => onSelectChange("costCenter", v)}
              placeholder="Select cost center"
              searchPlaceholder="Search cost center..."
              isLoading={isBusy}
            />
          </div>

          {/* Plant */}
          <div className="space-y-1.5">
            <Label htmlFor="plant" className="text-sm font-medium text-gray-700">Plant</Label>
            <ReusableCombobox
              options={plantOptions}
              value={formData.plant}
              onValueChange={(v: string) => onSelectChange("plant", v)}
              placeholder="Select Plant"
              searchPlaceholder="Search plant..."
              isLoading={isBusy}
            />
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <Label htmlFor="shift" className="text-sm font-medium text-gray-700">Shift</Label>
            <ReusableCombobox
              options={shiftOptions}
              value={formData.shift}
              onValueChange={(v: string) => onSelectChange("shift", v)}
              placeholder="Select shift"
              searchPlaceholder="Search shift..."
              isLoading={isBusy}
            />
          </div>

        </div>
      </div>

      {/* --- BOTTOM SECTION: DETAILS --- */}
      <div className="bg-slate-100/50 p-5 rounded-lg border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

          {/* Vehicle */}
          <div onMouseDown={onEmployeeFieldClick} className="space-y-1.5">
            <Label htmlFor="vehicle" className="text-sm font-medium text-gray-700">Registration No</Label>
            <ReusableCombobox
              options={vehicleOptions}
              value={formData.vehicle}
              onValueChange={(v: string) => onSelectChange("vehicle", v)}
              placeholder="Select vehicle"
              searchPlaceholder="Search vehicle..."
              isLoading={isBusy}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
            <ReusableCombobox
              options={statusOptions}
              value={formData.status}
              onValueChange={(v: string) => onSelectChange("status", v)}
              placeholder="Select status"
              searchPlaceholder="Search status..."
              isLoading={isBusy}
            />
          </div>

          {/* HMR */}
          <div className="space-y-1.5">
            <Label htmlFor="hmr" className="text-sm font-medium text-gray-700">Current HMR/Kms</Label>
            <Input
              id="hmr"
              name="hmr"
              type="number"
              min={0}
              value={formData.hmr}
              onChange={onInputChange}
              placeholder="e.g., 125430.5"
              disabled={isBusy}
              className="bg-white border-gray-200"
              required
            />
          </div>

        </div>
      </div>
    </div>
  )
}

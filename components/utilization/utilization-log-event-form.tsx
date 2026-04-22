"use client"
import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { ReusableCombobox } from "./ReusableCombobox"
import { on } from "events"
import { CustomDatePicker } from "@/components/ui/CustomDatePicker"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
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
  companyOptions: FrappeDoc[]
  shiftOptions: { name: string }[]
  statusOptions: { name: string }[]
  isBusy: boolean
  isLoading: boolean
  onAddRemark: (remark: string) => void;
  onRemoveRemark: (index: number) => void;
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
  onEmployeeFieldClick,
  onAddRemark, 
  onRemoveRemark
}: UtilizationLogEventFormProps) {

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
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">Posting Date*</Label>
            <CustomDatePicker
              value={formData.date}
              onChange={(newDateString) => {
                onInputChange({ target: { name: 'date', value: newDateString } })
              }}
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

          <div className="space-y-1.5">
            <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">From Date & Time</Label>
            <CustomDatePicker
              value={formData.fromDate}
              showTime={true} 
              onChange={(newDateString) => {
                onInputChange({ target: { name: 'fromDate', value: newDateString } })
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">To Date & Time</Label>
            <CustomDatePicker
              value={formData.toDate}
              showTime={true} 
              onChange={(newDateString) => {
                onInputChange({ target: { name: 'toDate', value: newDateString } })
              }}
            />
          </div>

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
            <Label htmlFor="warehouse" className="text-sm font-medium text-gray-700">Source Warehouse*</Label>
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
            <Label htmlFor="shift" className="text-sm font-medium text-gray-700">Shift*</Label>
            <ReusableCombobox
              options={shiftOptions}
              value={formData.shift}
              onValueChange={(v: string) => onSelectChange("shift", v)}
              placeholder="Select shift"
              searchPlaceholder="Search shift..."
              isLoading={isBusy}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Utilization Run Time</Label>
            <Input
              type="text"
              // Ye automatically "Xh Ym" format me dikhayega (e.g., "2h 30m")
              value={`${formData.timeHours || "0"}h ${formData.timeMinutes || "0"}m`}
              readOnly
              tabIndex={-1}
              className="bg-gray-100 cursor-not-allowed text-gray-600 focus-visible:ring-0 w-full"
            />
          </div>

        </div>
      </div>

      {/* --- BOTTOM SECTION: DETAILS --- */}
      <div className="bg-slate-100/50 p-5 rounded-lg border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

          {/* Vehicle */}
          <div onMouseDown={onEmployeeFieldClick} className="space-y-1.5">
            <Label htmlFor="vehicle" className="text-sm font-medium text-gray-700">Registration No*</Label>
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
            <Label htmlFor="hmr" className="text-sm font-medium text-gray-700">Current HMR/Kms*</Label>
            <Input
              id="hmr"
              name="hmr"
              type="number"
              min={1}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                  e.preventDefault();
                }
              }}
              value={formData.hmr}
              onChange={onInputChange}
              placeholder="e.g., 125430.5"
              disabled={isBusy}
              className="bg-white border-gray-200"
              required
            />
          </div>

         <div className="space-y-3 md:col-span-3 border-t pt-4 mt-2">
  <Label className="text-sm font-semibold text-gray-800">Remarks List</Label>
  
  {/* Input Area with Add Button */}
  <div className="flex gap-2">
    <Input
      id="currentRemark"
      placeholder="Type a remark..."
      className="bg-white border-gray-200"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = e.currentTarget.value;
          if(val) {
            onAddRemark(val);
            e.currentTarget.value = "";
          }
        }
      }}
    />
    <Button 
      type="button" 
      variant="secondary"
      className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
      onClick={(e) => {
        const input = document.getElementById('currentRemark') as HTMLInputElement;
        if (input.value) {
          onAddRemark(input.value);
          input.value = "";
        }
      }}
    >
      <Plus className="w-4 h-4 mr-1" /> Add
    </Button>
  </div>

  {/* Display Added Remarks */}
  <div className="flex flex-wrap gap-2 mt-3">
    {formData.remarks && formData.remarks.map((item: string, index: number) => (
      <div 
        key={index} 
        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md border border-slate-200 text-sm animate-in fade-in zoom-in duration-200"
      >
        <span>{item}</span>
        <button
          type="button"
          onClick={() => onRemoveRemark(index)}
          className="text-slate-400 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
</div>
        </div>
      </div>
    </div>
  )
}

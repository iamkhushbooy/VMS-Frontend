"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { vmsApi, VehicleMaster } from "@/lib/vms-api"

export interface FilterState {
  fromDate: Date | undefined
  toDate: Date | undefined
  vehicle: string
  costCenter: string
  status: string
  shift: string
}

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onReset: () => void
}

export function FilterBar({ filters, onFiltersChange, onReset }: FilterBarProps) {
  const [vehicles, setVehicles] = useState<VehicleMaster[]>([])
  const [costCenters, setCostCenters] = useState<string[]>([])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const vehiclesData = await vmsApi.getVehicleMasters()
        setVehicles(vehiclesData)

        // Get unique cost centers from utilization reports
        const utilizations = await vmsApi.getUtilizationReports()
        const uniqueCostCenters = [
          ...new Set(utilizations.map((u) => u.cost_center).filter(Boolean)),
        ] as string[]
        setCostCenters(uniqueCostCenters)
      } catch (error) {
        console.error("Error fetching filter options:", error)
      }
    }

    fetchOptions()
  }, [])

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "" && v !== "all" && v !== undefined)

  return (
    <Card className="sticky top-16 z-10 shadow-md">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* From Date */}
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.fromDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.fromDate ? format(filters.fromDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.fromDate}
                  onSelect={(date) => updateFilter("fromDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.toDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.toDate ? format(filters.toDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.toDate}
                  onSelect={(date) => updateFilter("toDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Vehicle */}
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Select value={filters.vehicle} onValueChange={(value) => updateFilter("vehicle", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.name} value={vehicle.license_plate}>
                    {vehicle.license_plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Center */}
          <div className="space-y-2">
            <Label>Cost Center</Label>
            <Select
              value={filters.costCenter}
              onValueChange={(value) => updateFilter("costCenter", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cost Centers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cost Centers</SelectItem>
                {costCenters.map((cc) => (
                  <SelectItem key={cc} value={cc}>
                    {cc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Running">Running</SelectItem>
                <SelectItem value="Idle">Idle</SelectItem>
                <SelectItem value="Breakdown">Breakdown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shift */}
          <div className="space-y-2">
            <Label>Shift</Label>
            <Select value={filters.shift} onValueChange={(value) => updateFilter("shift", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="G">G</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={onReset}>
              <X className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


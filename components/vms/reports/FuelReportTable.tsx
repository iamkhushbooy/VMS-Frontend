"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleRefueling } from "@/lib/vms-api"
import { FilterState } from "./FilterBar"
import { Download } from "lucide-react"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface FuelReportTableProps {
  data: VehicleRefueling[]
  filters: FilterState
  isLoading?: boolean
}

export function FuelReportTable({ data, filters, isLoading }: FuelReportTableProps) {
  const filteredData = useMemo(() => {
    return data.filter((refueling) => {
      if (filters.fromDate && refueling.date) {
        const refuelDate = new Date(refueling.date)
        if (refuelDate < filters.fromDate) return false
      }
      if (filters.toDate && refueling.date) {
        const refuelDate = new Date(refueling.date)
        if (refuelDate > filters.toDate) return false
      }
      if (filters.vehicle && filters.vehicle !== "all") {
        const hasVehicle = refueling.vehicle_refueling_details?.some(
          (detail) => detail.registration_no === filters.vehicle,
        )
        if (!hasVehicle) return false
      }
      if (filters.costCenter && filters.costCenter !== "all" && refueling.cost_center !== filters.costCenter) return false
      return true
    })
  }, [data, filters])

  const chartData = useMemo(() => {
    const grouped = filteredData.reduce((acc, refueling) => {
      const date = refueling.date || ""
      if (!date) return acc

      if (!acc[date]) {
        acc[date] = { date, fuelQty: 0, avgEfficiency: 0, count: 0, totalEfficiency: 0 }
      }

      refueling.vehicle_refueling_details?.forEach((detail) => {
        acc[date].fuelQty += detail.fuel_qty_in_ltrs || 0
        if (detail.fuel_consumption) {
          acc[date].totalEfficiency += detail.fuel_consumption
          acc[date].count += 1
        }
      })

      return acc
    }, {} as Record<string, { date: string; fuelQty: number; avgEfficiency: number; count: number; totalEfficiency: number }>)

    return Object.values(grouped)
      .map((item) => ({
        date: item.date,
        "Fuel Qty (L)": item.fuelQty,
        "Fuel Efficiency (km/l)": item.count > 0 ? item.totalEfficiency / item.count : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredData])

  const tableData = useMemo(() => {
    return filteredData.flatMap((refueling) =>
      refueling.vehicle_refueling_details?.map((detail) => ({
        refueling,
        detail,
      })) || [],
    )
  }, [filteredData])

  const handleExport = () => {
    const csv = [
      ["Date", "Vehicle", "Fuel Qty", "Fuel Consumption", "HMR", "Remarks"].join(","),
      ...tableData.map((row) =>
        [
          row.refueling.date || "",
          row.detail.registration_no || "",
          row.detail.fuel_qty_in_ltrs || 0,
          row.detail.fuel_consumption || 0,
          row.detail.current_hmrkms || 0,
          "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fuel-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fuel Report / Refueling Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fuel Report / Refueling Analysis</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Fuel Efficiency Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Fuel Efficiency (km/l)"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Fuel Qty Per Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Fuel Qty (L)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Fuel Qty</TableHead>
                <TableHead>Fuel Consumption (km/l)</TableHead>
                <TableHead>HMR</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row: any, idx: number) => (
                  <TableRow key={`${row.refueling?.name || idx}-${idx}`}>
                    <TableCell>
                      {row.refueling?.date ? format(new Date(row.refueling.date), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.detail?.registration_no || "N/A"}
                    </TableCell>
                    <TableCell>{row.detail?.fuel_qty_in_ltrs || 0} L</TableCell>
                    <TableCell>
                      {row.detail?.fuel_consumption
                        ? `${row.detail.fuel_consumption.toFixed(2)} km/l`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{row.detail?.current_hmrkms || 0}</TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


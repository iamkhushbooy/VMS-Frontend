"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleLogMaster } from "@/lib/vms-api"
import { useMemo } from "react"
import { useVmsFilters } from "@/lib/store/vms-filters-store"

interface BreakdownCountChartProps {
  data: VehicleLogMaster[]
  isLoading?: boolean
}

export function BreakdownCountChart({ data, isLoading }: BreakdownCountChartProps) {
  const { filters } = useVmsFilters()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Apply filters
    let filtered = data.filter((log) => {
      if (filters.fromDate && log.date_of_initiation) {
        const logDate = new Date(log.date_of_initiation)
        if (logDate < filters.fromDate) return false
      }
      if (filters.toDate && log.date_of_initiation) {
        const logDate = new Date(log.date_of_initiation)
        if (logDate > filters.toDate) return false
      }
      if (filters.vehicle && filters.vehicle !== "all" && log.license_plate !== filters.vehicle)
        return false
      return true
    })

    // Count breakdowns by vehicle
    const vehicleCounts = filtered.reduce((acc, log) => {
      const vehicle = log.license_plate || "Unknown"
      const isBreakdown =
        (log as any).job_cards_type?.toLowerCase() === "breakdown" ||
        log.status?.toLowerCase().includes("breakdown")

      if (isBreakdown) {
        acc[vehicle] = (acc[vehicle] || 0) + 1
      }

      return acc
    }, {} as Record<string, number>)

    return Object.entries(vehicleCounts)
      .map(([vehicle, count]) => ({ vehicle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10
  }, [data, filters])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Breakdown Count by Vehicle</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Breakdown Count by Vehicle</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="vehicle"
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
            />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#333" }} iconType="circle" />
            <Bar dataKey="count" fill="#ef4444" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

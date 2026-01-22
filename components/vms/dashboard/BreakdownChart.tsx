"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleLogMaster } from "@/lib/vms-api"
import { useMemo } from "react"

interface BreakdownChartProps {
  data: VehicleLogMaster[]
  isLoading?: boolean
}

export function BreakdownChart({ data, isLoading }: BreakdownChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Count breakdowns by vehicle - use job_cards_type field
    const vehicleCounts = data.reduce((acc, log) => {
      const vehicle = log.license_plate || "Unknown"
      // Check if job_cards_type is "Breakdown" (case-insensitive)
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
      .slice(0, 5) // Top 5
  }, [data])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Breakdown Hotspots (Top 5 Vehicles)</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Breakdown Hotspots (Top 5 Vehicles)</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              type="number"
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
            />
            <YAxis
              dataKey="vehicle"
              type="category"
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              width={100}
            />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#333" }} iconType="circle" />
            <Bar dataKey="count" fill="#ef4444" radius={[0, 12, 12, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

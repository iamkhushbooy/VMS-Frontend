"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { UtilizationReport } from "@/lib/vms-api"
import { useMemo } from "react"

interface VehicleStatusChartProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

const COLORS = ["#0ea5e9", "#facc15", "#ef4444", "#6b7280"]

export function VehicleStatusChart({ data, isLoading }: VehicleStatusChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const statusCounts = data.reduce((acc, report) => {
      const status = report.status || "Unknown"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }, [data])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Vehicle Status Distribution</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Vehicle Status Distribution</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              stroke="#e5e7eb"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ color: "#333" }} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

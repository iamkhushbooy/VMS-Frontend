"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { UtilizationReport } from "@/lib/vms-api"
import { useMemo } from "react"

interface CostCenterPieChartProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

const COLORS = ["#0ea5e9", "#2563eb", "#7c3aed", "#ef4444", "#facc15", "#10b981"]

export function CostCenterPieChart({ data, isLoading }: CostCenterPieChartProps) {
  const chartData = useMemo(() => {

    if (!data || data.length === 0) {
      return []
    }

    // ✅ Correct Logic → Count records per cost center
    const grouped = data.reduce((acc: Record<string, number>, report) => {
      const costCenter = report.cost_center || "Unknown"

      acc[costCenter] = (acc[costCenter] || 0) + 1

      return acc
    }, {})

    const finalData = Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }))


    return finalData
  }, [data])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Cost Center Utilization</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Cost Center Utilization</h3>
        <div className="w-full h-[250px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Cost Center Utilization</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={90}
              innerRadius={40}
              dataKey="value"
              stroke="#fff"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value} records`, "Count"]}
            />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

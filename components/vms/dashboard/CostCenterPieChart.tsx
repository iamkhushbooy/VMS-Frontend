"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { UtilizationReport } from "@/lib/vms-api"
import { useMemo } from "react"

interface CostCenterPieChartProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export function CostCenterPieChart({ data, isLoading }: CostCenterPieChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = data.reduce((acc, report) => {
      const costCenter = report.cost_center || "Unknown"
      const hmr = report.hmr || 0

      acc[costCenter] = (acc[costCenter] || 0) + hmr
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped).map(([name, value]) => ({ name, value }))
  }, [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Center Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Center Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


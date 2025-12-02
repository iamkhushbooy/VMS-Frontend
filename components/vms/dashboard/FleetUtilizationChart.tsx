"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { UtilizationReport } from "@/lib/vms-api"
import { useMemo } from "react"

interface FleetUtilizationChartProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

export function FleetUtilizationChart({ data, isLoading }: FleetUtilizationChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group by date and count statuses
    const grouped = data.reduce((acc, report) => {
      const date = report.date || report.from_date || ""
      if (!date) return acc

      if (!acc[date]) {
        acc[date] = { date, Running: 0, Idle: 0, Breakdown: 0 }
      }

      const status = report.status || "Idle"
      if (status === "Running" || status === "running") {
        acc[date].Running += 1
      } else if (status === "Breakdown" || status === "breakdown") {
        acc[date].Breakdown += 1
      } else {
        acc[date].Idle += 1
      }

      return acc
    }, {} as Record<string, { date: string; Running: number; Idle: number; Breakdown: number }>)

    return Object.values(grouped)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  }, [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fleet Utilization Trend</CardTitle>
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
        <CardTitle>Fleet Utilization Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Running" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="Idle" stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="Breakdown" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


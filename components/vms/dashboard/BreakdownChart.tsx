"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

    // Count breakdowns by vehicle
    const vehicleCounts = data.reduce((acc, log) => {
      const vehicle = log.license_plate || "Unknown"
      // Consider it a breakdown if status is "Breakdown" or has problem details
      const isBreakdown =
        log.status?.toLowerCase().includes("breakdown") ||
        (log.problem_details && log.problem_details.length > 0)

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
      <Card>
        <CardHeader>
          <CardTitle>Breakdown Hotspots (Top 5 Vehicles)</CardTitle>
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
        <CardTitle>Breakdown Hotspots (Top 5 Vehicles)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="vehicle" type="category" tick={{ fontSize: 12 }} width={100} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


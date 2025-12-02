"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleRefueling } from "@/lib/vms-api"
import { useMemo } from "react"

interface FuelTrendChartProps {
  data: VehicleRefueling[]
  isLoading?: boolean
}

export function FuelTrendChart({ data, isLoading }: FuelTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const grouped = data.reduce((acc, refueling) => {
      const date = refueling.date || ""
      if (!date) return acc

      if (!acc[date]) {
        acc[date] = { date, fuelQty: 0, avgEfficiency: 0, count: 0, totalEfficiency: 0 }
      }

      if (refueling.vehicle_refueling_details) {
        refueling.vehicle_refueling_details.forEach((detail) => {
          acc[date].fuelQty += detail.fuel_qty_in_ltrs || 0
          if (detail.fuel_consumption) {
            acc[date].totalEfficiency += detail.fuel_consumption
            acc[date].count += 1
          }
        })
      }

      return acc
    }, {} as Record<string, { date: string; fuelQty: number; avgEfficiency: number; count: number; totalEfficiency: number }>)

    return Object.values(grouped)
      .map((item) => ({
        date: item.date,
        "Fuel Qty (L)": item.fuelQty,
        "Fuel Efficiency (km/l)": item.count > 0 ? item.totalEfficiency / item.count : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  }, [data])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Refueling & Fuel Trends</CardTitle>
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
        <CardTitle>Refueling & Fuel Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="Fuel Qty (L)" fill="#3b82f6" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Fuel Efficiency (km/l)"
              stroke="#10b981"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}


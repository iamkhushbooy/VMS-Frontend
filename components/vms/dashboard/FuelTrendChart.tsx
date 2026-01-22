"use client"

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
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Refueling & Fuel Trends</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Refueling & Fuel Trends</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
            />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#333" }} iconType="circle" />
            <Bar
              yAxisId="left"
              dataKey="Fuel Qty (L)"
              fill="#7c3aed"
              radius={[12, 12, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Fuel Efficiency (km/l)"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

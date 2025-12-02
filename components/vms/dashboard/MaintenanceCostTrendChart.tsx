"use client"

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
import { VehicleLogMaster } from "@/lib/vms-api"
import { useMemo } from "react"
import { format } from "date-fns"

interface MaintenanceCostTrendChartProps {
  data: VehicleLogMaster[]
  isLoading?: boolean
}

export function MaintenanceCostTrendChart({ data, isLoading }: MaintenanceCostTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group by date and calculate total expense
    const grouped = data.reduce((acc, log) => {
      const date = log.date_of_initiation || (log.creation || "")
      if (!date) return acc

      const dateKey = format(new Date(date), "yyyy-MM-dd")

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalExpense: 0, count: 0 }
      }

      // Calculate total expense
      const partsExpense = log.part_details?.reduce((sum, p) => sum + (p.expense || 0), 0) || 0
      const lubeExpense = log.lube_details?.reduce((sum, l) => sum + (l.expense || 0), 0) || 0
      const totalExpense = partsExpense + lubeExpense

      acc[dateKey].totalExpense += totalExpense
      acc[dateKey].count += 1

      return acc
    }, {} as Record<string, { date: string; totalExpense: number; count: number }>)

    return Object.values(grouped)
      .map((item) => ({
        date: format(new Date(item.date), "MMM dd"),
        "Total Expense": item.totalExpense,
        "Maintenance Count": item.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  }, [data])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Maintenance Cost Trend</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Maintenance Cost Trend</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="Total Expense"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Maintenance Count"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

"use client"

import {
  AreaChart,
  Area,
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
import { format } from "date-fns"

interface HMRTrendChartProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

export function HMRTrendChart({ data, isLoading }: HMRTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group by date and sum HMR
    const grouped = data.reduce((acc, report) => {
      const date = report.date || report.from_date || ""
      if (!date) return acc

      const dateKey = format(new Date(date), "yyyy-MM-dd")

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalHMR: 0, count: 0 }
      }

      acc[dateKey].totalHMR += report.hmr || 0
      acc[dateKey].count += 1

      return acc
    }, {} as Record<string, { date: string; totalHMR: number; count: number }>)

    return Object.values(grouped)
      .map((item) => ({
        date: format(new Date(item.date), "MMM dd"),
        HMR: item.totalHMR,
        "Avg HMR": item.count > 0 ? item.totalHMR / item.count : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  }, [data])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">HMR Trend (Last 30 Days)</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">HMR Trend (Last 30 Days)</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
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
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
            />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#333" }} iconType="circle" />
            <Area
              type="monotone"
              dataKey="HMR"
              stroke="#2563eb"
              strokeWidth={3}
              fill="#2563eb"
              fillOpacity={0.2}
            />
            <Area
              type="monotone"
              dataKey="Avg HMR"
              stroke="#0ea5e9"
              strokeWidth={3}
              fill="#0ea5e9"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

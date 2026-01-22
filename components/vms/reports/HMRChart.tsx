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
import { UtilizationReport } from "@/lib/vms-api"
import { useMemo } from "react"
import { format } from "date-fns"
import { useVmsFilters } from "@/lib/store/vms-filters-store"

interface HMRChartProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

export function HMRChart({ data, isLoading }: HMRChartProps) {
  const { filters } = useVmsFilters()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Apply filters
    let filtered = data.filter((report) => {
      if (filters.fromDate && report.date) {
        const reportDate = new Date(report.date)
        if (reportDate < filters.fromDate) return false
      }
      if (filters.toDate && report.date) {
        const reportDate = new Date(report.date)
        if (reportDate > filters.toDate) return false
      }
      if (filters.vehicle && filters.vehicle !== "all" && report.vehicle !== filters.vehicle)
        return false
      if (filters.costCenter && filters.costCenter !== "all" && report.cost_center !== filters.costCenter)
        return false
      if (filters.status && filters.status !== "all" && report.status !== filters.status) return false
      if (filters.shift && filters.shift !== "all" && report.shift !== filters.shift) return false
      return true
    })

    // Group by date and sum HMR
    const grouped = filtered.reduce((acc, report) => {
      const date = report.date || report.from_date || ""
      if (!date) return acc

      const dateKey = format(new Date(date), "yyyy-MM-dd")

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalHMR: 0 }
      }

      acc[dateKey].totalHMR += report.hmr || 0

      return acc
    }, {} as Record<string, { date: string; totalHMR: number }>)

    return Object.values(grouped)
      .map((item) => ({
        date: format(new Date(item.date), "MMM dd, yyyy"),
        HMR: item.totalHMR,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, filters])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">HMR Trend by Day</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">HMR Trend by Day</h3>
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
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
            />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#333" }} iconType="circle" />
            <Line
              type="monotone"
              dataKey="HMR"
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

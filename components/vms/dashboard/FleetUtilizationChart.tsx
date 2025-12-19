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

interface FleetUtilizationChartProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

export function FleetUtilizationChart({ data, isLoading }: FleetUtilizationChartProps) {
const chartData = useMemo(() => {
  if (!data || data.length === 0) return []

  // Convert dd-mm-yyyy to yyyy-mm-dd
  const parseDate = (raw: string | undefined) => {
    if (!raw) return null
    const onlyDate = raw.split(" ")[0]
    const parts = onlyDate.split("-") // dd-mm-yyyy
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts
      return `${yyyy}-${mm}-${dd}` // ISO format
    }
    return raw
  }

  // Group by actual dates only (no auto-generated days)
  const grouped = data.reduce((acc, report) => {
    const formattedDate = parseDate(report.date)
    if (!formattedDate) return acc

    if (!acc[formattedDate]) {
      acc[formattedDate] = {
        date: formattedDate,
        Running: 0,
        Idle: 0,
        Breakdown: 0,
      }
    }

    const status = (report.status || "").trim()
    if (status === "Running") acc[formattedDate].Running++
    else if (status === "Breakdown") acc[formattedDate].Breakdown++
    else acc[formattedDate].Idle++

    return acc
  }, {} as Record<string, { date: string; Running: number; Idle: number; Breakdown: number }>)

  // Convert to array & sort
  return Object.values(grouped).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}, [data])




  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Fleet Utilization Trend</h3>
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Fleet Utilization Trend</h3>
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
              dataKey="Running"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Idle"
              stroke="#facc15"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Breakdown"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

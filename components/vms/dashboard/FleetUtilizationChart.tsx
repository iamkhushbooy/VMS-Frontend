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
  totalVehicles: number; // 1. Total vehicles prop add kiya
  isLoading?: boolean
}

export function FleetUtilizationChart({ data, totalVehicles, isLoading }: FleetUtilizationChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const parseDate = (raw: string | undefined) => {
      if (!raw) return null
      const onlyDate = raw.split(" ")[0]
      const parts = onlyDate.split("-") 
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts
        return `${yyyy}-${mm}-${dd}` 
      }
      return raw
    }

    // 2. Grouping logic
    const grouped = data.reduce((acc, report) => {
      const formattedDate = parseDate(report.date)
      if (!formattedDate) return acc

      if (!acc[formattedDate]) {
        acc[formattedDate] = {
          date: formattedDate,
          Idle: 0,
          Breakdown: 0,
        }
      }

      const status = (report.status || "").trim().toLowerCase()
      if (status === "breakdown") acc[formattedDate].Breakdown++
      else if (status === "idle") acc[formattedDate].Idle++
      
      return acc
    }, {} as Record<string, { date: string; Idle: number; Breakdown: number }>)

    // 3. Final Calculation: Running = Total - (Breakdown + Idle)
    return Object.values(grouped)
      .map(item => ({
        ...item,
        // Har date ke liye running calculate karein
        Running: Math.max(0, totalVehicles - (item.Breakdown + item.Idle))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15) // Sirf last 15 days dikhane ke liye (optional)
  }, [data, totalVehicles])

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Fleet Utilization Trend</h3>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#888"
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              stroke="#888"
              tick={{ fill: "#555", fontSize: 12 }}
              axisLine={{ stroke: "#ccc" }}
              tickLine={false}
              domain={[0, totalVehicles + 10]} // Takki chart range sahi rahe
            />
            <Tooltip />
            <Legend wrapperStyle={{ color: "#333", paddingTop: '20px' }} iconType="circle" />
            <Line
              type="monotone"
              dataKey="Running"
              name="Running"
              stroke="#10b981" // Green color for running
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Idle"
              stroke="#facc15"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="Breakdown"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
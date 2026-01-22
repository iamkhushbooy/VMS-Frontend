"use client"

import { LucideIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  isLoading?: boolean
}

export function KpiCard({
  title,
  value,
  subtitle = "Updated today",
  icon: Icon,
  iconColor = "text-blue-500",
  isLoading = false,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="mt-2">
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="mt-2">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

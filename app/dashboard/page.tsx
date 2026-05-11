"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Car,
  CheckCircle2,
  Fuel,
  Gauge,
  IndianRupee,
  RefreshCcw,
  TrendingUp,
  Wrench,
  Filter
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AppLayout } from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { vmsApi, type UtilizationReport, type VehicleLogMaster, type VehicleMaster, type VehicleRefueling, type VmsDashboardData } from "@/lib/vms-api"

type DashboardState = {
  vehicles: VehicleMaster[]
  logs: VehicleLogMaster[]
  refuelings: VehicleRefueling[]
  utilizations: UtilizationReport[]
}

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{ color?: string; name?: string; value?: number | string }>
  label?: string
}

const emptyState: DashboardState = {
  vehicles: [],
  logs: [],
  refuelings: [],
  utilizations: [],
}

const statusColors: Record<string, string> = {
  running: "#059669",
  active: "#059669",
  idle: "#d97706",
  breakdown: "#dc2626",
  maintenance: "#2563eb",
  unknown: "#64748b",
}

const formatNumber = (value: number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits }).format(Number.isFinite(value) ? value : 0)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

const parseDashboardDate = (raw?: string) => {
  if (!raw) return null
  const datePart = raw.split(" ")[0]
  const parts = datePart.split("-")
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    const [day, month, year] = parts
    return new Date(`${year}-${month}-${day}T00:00:00`)
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const dateKey = (raw?: string) => {
  const date = parseDashboardDate(raw)
  if (!date) return null
  return date.toISOString().slice(0, 10)
}

const shortDate = (raw?: string) => {
  const date = parseDashboardDate(raw)
  if (!date) return "N/A"
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

const fullDate = (raw?: string) => {
  const date = parseDashboardDate(raw)
  if (!date) return "N/A"
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

const normalizeStatus = (status?: string) => {
  const value = (status || "").trim().toLowerCase()
  if (!value) return "unknown"
  if (value.includes("break")) return "breakdown"
  if (value.includes("idle")) return "idle"
  if (value.includes("maint") || value.includes("repair")) return "maintenance"
  if (value.includes("run") || value.includes("active") || value.includes("working")) return "running"
  return value
}

const getVehicleKey = (value?: string) => (value || "Unknown").trim() || "Unknown"

const getMaintenanceCost = (log: VehicleLogMaster) => {
  if (typeof log.total_maintenance_cost === "number") {
    return log.total_maintenance_cost
  }
  const partCost = log.part_details?.reduce((sum, item) => sum + Number(item.expense || 0), 0) || 0
  const lubeCost = log.lube_details?.reduce((sum, item) => sum + Number(item.expense || 0), 0) || 0
  return partCost + lubeCost
}

// NEW: Helper to get Today's start and end times dynamically
const getTodayDates = () => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return {
    start: `${yyyy}-${mm}-${dd}T00:00`,
    end: `${yyyy}-${mm}-${dd}T23:59`
  }
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <div className="mb-1 font-medium text-slate-900">{label}</div>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={`${item.name}-${item.value}`} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-slate-900">
              {typeof item.value === "number" ? formatNumber(item.value, 2) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      {label}
    </div>
  )
}

function MetricCard({
  title, value, description, icon: Icon, tone, isLoading,
}: {
  title: string, value: string, description: string, icon: typeof Car, tone: string, isLoading: boolean
}) {
  return (
    <Card className="gap-4 rounded-lg border-slate-200 bg-white py-5 shadow-sm">
      <CardContent className="px-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">{value}</p>
              </div>
              <div className={`rounded-md p-2 ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = normalizeStatus(status)
  const classes =
    normalized === "breakdown" ? "border-red-200 bg-red-50 text-red-700"
      : normalized === "idle" ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "maintenance" ? "border-blue-200 bg-blue-50 text-blue-700"
          : normalized === "running" || normalized === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-50 text-slate-600"

  return <Badge variant="outline" className={classes}>{status || "Unknown"}</Badge>
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardState>(emptyState)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  // INITIALIZE with today's dates so it immediately filters to Today
  const { start: defaultStart, end: defaultEnd } = useMemo(() => getTodayDates(), [])

  const [fromDate, setFromDate] = useState(defaultStart)
  const [toDate, setToDate] = useState(defaultEnd)

  // Track applied filters so the UI only recalculates on "Apply"
  const [appliedFrom, setAppliedFrom] = useState(defaultStart)
  const [appliedTo, setAppliedTo] = useState(defaultEnd)

  const loadDashboard = async (overrideFrom?: string, overrideTo?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Use override if we click quick buttons, otherwise use whatever is in the input boxes
      const targetFrom = overrideFrom !== undefined ? overrideFrom : fromDate
      const targetTo = overrideTo !== undefined ? overrideTo : toDate

      setAppliedFrom(targetFrom)
      setAppliedTo(targetTo)

      let dashboardData: VmsDashboardData | null = null

      let fetchUrl = "/api/method/vms.api.get_dashboard_data"
      if (targetFrom && targetTo) {
        const sqlFromDate = targetFrom.replace("T", " ") + ":00"
        const sqlToDate = targetTo.replace("T", " ") + ":00"
        fetchUrl += `?from_datetime=${sqlFromDate}&to_datetime=${sqlToDate}`
      }

      try {
        const response = await fetch(fetchUrl)
        if (!response.ok) throw new Error("Fetch failed")
        const result = await response.json()
        dashboardData = result.message as VmsDashboardData

        if (!dashboardData) throw new Error("Invalid response format")
      } catch (fetchError) {
        console.warn("Direct fetch with parameters failed, falling back to standard vmsApi", fetchError)
        try {
          dashboardData = await vmsApi.getDashboardData()
        } catch (dashboardError) {
          const [vehicles, logs, refuelings, utilizations] = await Promise.all([
            vmsApi.getVehicleMasters(), vmsApi.getVehicleLogMasters(), vmsApi.getVehicleRefuelings(), vmsApi.getUtilizationReports(),
          ])
          dashboardData = { vehicles, logs, refuelings, utilizations }
        }
      }

      if (dashboardData) {
        setData({
          vehicles: Array.isArray(dashboardData.vehicles) ? dashboardData.vehicles : [],
          logs: Array.isArray(dashboardData.logs) ? dashboardData.logs : [],
          refuelings: Array.isArray(dashboardData.refuelings) ? dashboardData.refuelings : [],
          utilizations: Array.isArray(dashboardData.utilizations) ? dashboardData.utilizations : [],
        })
      }
      setLastUpdated(new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load dashboard data."
      setError(message)
      if (message.includes("Session expired") || message.includes("403")) {
        localStorage.removeItem("isLoggedIn")
        router.push("/Login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const analytics = useMemo(() => {
    const filterStart = appliedFrom ? new Date(appliedFrom.replace("T", " ") + ":00").getTime() : 0;
    const filterEnd = appliedTo ? new Date(appliedTo.replace("T", " ") + ":00").getTime() : Number.MAX_SAFE_INTEGER;
    const getTime = (raw?: string) => parseDashboardDate(raw)?.getTime() || 0;

    const filteredUtilizations = data.utilizations.filter(report => {
      if (!filterStart && filterEnd === Number.MAX_SAFE_INTEGER) return true;
      const rFrom = getTime(report.from_date || report.date);
      const rTo = report.to_date ? getTime(report.to_date) : rFrom;
      return rFrom <= filterEnd && rTo >= filterStart;
    });

    const filteredRefuelings = data.refuelings.filter(entry => {
      if (!filterStart && filterEnd === Number.MAX_SAFE_INTEGER) return true;
      const t = getTime(entry.date);
      return t >= filterStart && t <= filterEnd;
    });

    const filteredLogs = data.logs.filter(log => {
      if (!filterStart && filterEnd === Number.MAX_SAFE_INTEGER) return true;
      const t = getTime(log.date_of_initiation || log.creation);
      return t >= filterStart && t <= filterEnd;
    });

    const utilizationByVehicle = new Map<string, UtilizationReport>()

    filteredUtilizations.forEach((report) => {
      const key = getVehicleKey(report.vehicle)
      const existing = utilizationByVehicle.get(key)
      const currentTime = parseDashboardDate(report.date || report.to_date || report.from_date)?.getTime() || 0
      const existingTime = parseDashboardDate(existing?.date || existing?.to_date || existing?.from_date)?.getTime() || 0

      if (!existing || currentTime >= existingTime) {
        utilizationByVehicle.set(key, report)
      }
    })

    const latestUtilizations = Array.from(utilizationByVehicle.values())
    const statusCounts = latestUtilizations.reduce<Record<string, number>>((acc, report) => {
      const status = normalizeStatus(report.status)
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const totalVehicles = data.vehicles.length
    const breakdownVehicles = statusCounts.breakdown || 0
    const idleVehicles = statusCounts.idle || 0
    const maintenanceVehicles = statusCounts.maintenance || 0
    const trackedVehicles = latestUtilizations.length

    const runningVehicles = Math.max(0, totalVehicles - breakdownVehicles - idleVehicles - maintenanceVehicles)

    const refuelingDetails = filteredRefuelings.flatMap((entry) =>
      (entry.vehicle_refueling_details || entry.details || []).map((detail) => ({
        parent: entry, detail, date: detail.date || entry.date,
      })),
    )

    const totalFuel = refuelingDetails.reduce((sum, item) => sum + Number(item.detail.fuel_qty_in_ltrs || 0), 0)
    const efficiencies = refuelingDetails.map((item) => Number(item.detail.fuel_consumption || 0)).filter((value) => value > 0)
    const avgEfficiency = efficiencies.length ? efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length : 0
    const totalHmr = filteredUtilizations.reduce((sum, item) => sum + Number(item.hmr || 0), 0)
    const totalMaintenanceCost = filteredLogs.reduce((sum, log) => sum + getMaintenanceCost(log), 0)

    const utilizationTrendMap = filteredUtilizations.reduce<Record<string, { date: string; Running: number; Idle: number; Breakdown: number; Maintenance: number }>>((acc, report) => {
      const key = dateKey(report.date || report.to_date || report.from_date)
      if (!key) return acc

      acc[key] ||= { date: key, Running: 0, Idle: 0, Breakdown: 0, Maintenance: 0 }
      const status = normalizeStatus(report.status)

      if (status === "breakdown") acc[key].Breakdown += 1
      else if (status === "idle") acc[key].Idle += 1
      else if (status === "maintenance") acc[key].Maintenance += 1
      else acc[key].Running += 1

      return acc
    }, {})

    const utilizationTrend = Object.values(utilizationTrendMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({ ...item, date: shortDate(item.date) }))

    const fuelTrendMap = refuelingDetails.reduce<Record<string, { date: string; Fuel: number; Efficiency: number; count: number }>>((acc, item) => {
      const key = dateKey(item.date)
      if (!key) return acc

      acc[key] ||= { date: key, Fuel: 0, Efficiency: 0, count: 0 }
      acc[key].Fuel += Number(item.detail.fuel_qty_in_ltrs || 0)

      const efficiency = Number(item.detail.fuel_consumption || 0)
      if (efficiency > 0) {
        acc[key].Efficiency += efficiency
        acc[key].count += 1
      }

      return acc
    }, {})

    const fuelTrend = Object.values(fuelTrendMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({
        date: shortDate(item.date),
        Fuel: Number(item.Fuel.toFixed(2)),
        Efficiency: item.count ? Number((item.Efficiency / item.count).toFixed(2)) : 0,
      }))

    const maintenanceTrendMap = filteredLogs.reduce<Record<string, { date: string; Jobs: number; Cost: number }>>((acc, log) => {
      const key = dateKey(log.date_of_initiation || log.creation)
      if (!key) return acc

      acc[key] ||= { date: key, Jobs: 0, Cost: 0 }
      acc[key].Jobs += 1
      acc[key].Cost += getMaintenanceCost(log)
      return acc
    }, {})

    const maintenanceTrend = Object.values(maintenanceTrendMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({ ...item, date: shortDate(item.date) }))

    const statusMix = Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: statusColors[name] || statusColors.unknown,
    }))

    const costCenterMap = filteredUtilizations.reduce<Record<string, { costCenter: string; HMR: number; Records: number }>>((acc, item) => {
      const costCenter = item.cost_center || "Unassigned"
      acc[costCenter] ||= { costCenter, HMR: 0, Records: 0 }
      acc[costCenter].HMR += Number(item.hmr || 0)
      acc[costCenter].Records += 1
      return acc
    }, {})

    const costCenters = Object.values(costCenterMap)
      .sort((a, b) => b.HMR - a.HMR)
      .slice(0, 8)

    const recentLogs = [...filteredLogs]
      .sort((a, b) => (parseDashboardDate(b.date_of_initiation || b.creation)?.getTime() || 0) - (parseDashboardDate(a.date_of_initiation || a.creation)?.getTime() || 0))
      .slice(0, 8)

    const recentRefueling = refuelingDetails
      .sort((a, b) => (parseDashboardDate(b.date)?.getTime() || 0) - (parseDashboardDate(a.date)?.getTime() || 0))
      .slice(0, 8)

    const vehicleHealth = data.vehicles.slice(0, 8).map((vehicle) => {
      const utilization = utilizationByVehicle.get(getVehicleKey(vehicle.license_plate)) || utilizationByVehicle.get(getVehicleKey(vehicle.name))
      const status = utilization?.status || "Unknown"
      const hmr = Number(utilization?.hmr || 0)
      const odometer = Number(vehicle.last_odometer || 0)
      const utilizationPercent = totalHmr ? Math.min(100, Math.round((hmr / totalHmr) * 100)) : 0

      return {
        name: vehicle.license_plate || vehicle.name,
        model: [vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.location || "Vehicle",
        status, hmr, odometer, utilizationPercent,
      }
    })

    return {
      totalVehicles, trackedVehicles, runningVehicles, idleVehicles, breakdownVehicles,
      maintenanceVehicles, totalFuel, avgEfficiency, totalHmr, totalMaintenanceCost,
      utilizationTrend, fuelTrend, maintenanceTrend, statusMix, costCenters,
      recentLogs, recentRefueling, vehicleHealth, refuelingCount: refuelingDetails.length,
    }
  }, [data, appliedFrom, appliedTo])

  const healthPercent = analytics.totalVehicles
    ? Math.round(((analytics.totalVehicles - analytics.breakdownVehicles - analytics.maintenanceVehicles) / analytics.totalVehicles) * 100) : 0

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {/* Unified Toolbar */}
            <div className="flex flex-wrap items-end gap-3">

              {/* From Date - Width increased to 240px */}
              <div className="space-y-1.5 w-full sm:w-[240px]">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Filter className="h-3.5 w-3.5" /> From Date
                </label>
                <Input
                  type="datetime-local"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-9 w-full bg-white text-xs border-slate-200 shadow-sm"
                />
              </div>

              {/* To Date - Width increased to 240px */}
              <div className="space-y-1.5 w-full sm:w-[240px]">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  To Date
                </label>
                <Input
                  type="datetime-local"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-9 w-full bg-white text-xs border-slate-200 shadow-sm"
                />
              </div>

              {/* Actions */}
              <Button
                onClick={() => loadDashboard()}
                disabled={isLoading || (!fromDate && !!toDate) || (!!fromDate && !toDate)}
                className="h-9 w-full sm:w-auto text-xs px-4"
              >
                {isLoading ? (
                  <><RefreshCcw className="mr-2 h-3.5 w-3.5 animate-spin" /> Loading...</>
                ) : (
                  "Apply"
                )}
              </Button>

              <Button
                onClick={() => {
                  const { start, end } = getTodayDates();
                  setFromDate(start);
                  setToDate(end);
                  loadDashboard(start, end);
                }}
                variant="outline"
                className="h-9 w-full sm:w-auto px-3 text-xs text-slate-700"
              >
                Today
              </Button>

              {(fromDate || toDate) && (
                <Button
                  onClick={() => {
                    setFromDate("")
                    setToDate("")
                    loadDashboard("", "")
                  }}
                  variant="outline"
                  className="h-9 w-full sm:w-auto px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                >
                  Clear
                </Button>
              )}

              {/* Last Updated */}
              {lastUpdated && (
                <div className="mt-2 sm:mt-0 sm:ml-auto flex w-full sm:w-auto items-center text-xs font-medium text-slate-500 pb-1.5">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  Updated {lastUpdated}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <p>{error}</p>
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard title="Total Vehicles" value={formatNumber(analytics.totalVehicles)} description={`${formatNumber(analytics.trackedVehicles)} vehicles have utilization records`} icon={Car} tone="bg-sky-50 text-sky-700" isLoading={isLoading} />
            <MetricCard title="Running" value={formatNumber(analytics.runningVehicles)} description={`${healthPercent}% fleet available for operations`} icon={Activity} tone="bg-emerald-50 text-emerald-700" isLoading={isLoading} />
            <MetricCard title="Idle" value={formatNumber(analytics.idleVehicles)} description="Latest utilization status marked idle" icon={Gauge} tone="bg-amber-50 text-amber-700" isLoading={isLoading} />
            <MetricCard title="Breakdowns" value={formatNumber(analytics.breakdownVehicles)} description="Vehicles requiring immediate attention" icon={AlertTriangle} tone="bg-red-50 text-red-700" isLoading={isLoading} />
            <MetricCard title="Fuel Used" value={`${formatNumber(analytics.totalFuel, 1)} L`} description={`${formatNumber(analytics.avgEfficiency, 2)} km/l average efficiency`} icon={Fuel} tone="bg-cyan-50 text-cyan-700" isLoading={isLoading} />
            <MetricCard title="Maint. Cost" value={formatCurrency(analytics.totalMaintenanceCost)} description={`${formatNumber(analytics.recentLogs.length)} maintenance job cards`} icon={IndianRupee} tone="bg-indigo-50 text-indigo-700" isLoading={isLoading} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <TrendingUp className="h-5 w-5 text-sky-700" />
                  Utilization Trend
                </CardTitle>
                <CardDescription>Running, idle, breakdown, and maintenance movement from utilization reports.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : analytics.utilizationTrend.length ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.utilizationTrend} margin={{ left: -18, right: 8, top: 10 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="Running" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.18} />
                        <Area type="monotone" dataKey="Idle" stackId="1" stroke="#d97706" fill="#d97706" fillOpacity={0.18} />
                        <Area type="monotone" dataKey="Maintenance" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.16} />
                        <Area type="monotone" dataKey="Breakdown" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.16} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No utilization records available" />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  Fleet Status
                </CardTitle>
                <CardDescription>Current status from latest utilization entry per vehicle.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : analytics.statusMix.length ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.statusMix} dataKey="value" nameKey="name" innerRadius={68} outerRadius={104} paddingAngle={2}>
                          {analytics.statusMix.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No status records available" />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <Fuel className="h-5 w-5 text-cyan-700" />
                  Fuel Consumption & Efficiency
                </CardTitle>
                <CardDescription>Daily fuel quantity with average fuel consumption from refueling details.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : analytics.fuelTrend.length ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.fuelTrend} margin={{ left: -16, right: 8, top: 10 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                        <Bar yAxisId="left" dataKey="Fuel" name="Fuel (L)" fill="#0891b2" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="Efficiency" name="Efficiency (km/l)" stroke="#16a34a" strokeWidth={3} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No refueling records available" />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <Wrench className="h-5 w-5 text-indigo-700" />
                  Maintenance Workload
                </CardTitle>
                <CardDescription>Job-card count and available expense data by initiation date.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : analytics.maintenanceTrend.length ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.maintenanceTrend} margin={{ left: -16, right: 8, top: 10 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                        <Bar yAxisId="left" dataKey="Jobs" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="Cost" stroke="#dc2626" strokeWidth={3} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No maintenance logs available" />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <BarChart3 className="h-5 w-5 text-sky-700" />
                  Cost Center Utilization
                </CardTitle>
                <CardDescription>Top cost centers by HMR from utilization reports.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[340px] w-full" />
                ) : analytics.costCenters.length ? (
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.costCenters} layout="vertical" margin={{ left: 30, right: 12 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="costCenter" type="category" width={120} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="HMR" fill="#0284c7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label="No cost center utilization available" />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-950">Vehicle Health Snapshot</CardTitle>
                <CardDescription>Status, HMR contribution, and odometer by vehicle master.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-16 w-full" />
                    ))}
                  </div>
                ) : analytics.vehicleHealth.length ? (
                  <div className="space-y-3">
                    {analytics.vehicleHealth.map((vehicle) => (
                      <div key={vehicle.name} className="rounded-lg border border-slate-200 px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950">{vehicle.name}</p>
                            <p className="truncate text-sm text-slate-500">{vehicle.model}</p>
                          </div>
                          <StatusBadge status={vehicle.status} />
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                          <Progress value={vehicle.utilizationPercent} className="h-2 bg-slate-100" />
                          <div className="text-xs text-slate-500">
                            HMR {formatNumber(vehicle.hmr, 1)} / Odo {formatNumber(vehicle.odometer)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No vehicle master records available
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-950">Recent Maintenance Logs</CardTitle>
                <CardDescription>Latest job cards for maintenance and breakdown reporting.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentLogs.length ? (
                        analytics.recentLogs.map((log) => (
                          <TableRow key={log.name}>
                            <TableCell className="whitespace-nowrap">{fullDate(log.date_of_initiation || log.creation)}</TableCell>
                            <TableCell className="font-medium">{log.license_plate || "N/A"}</TableCell>
                            <TableCell>{log.job_cards_type || "Job Card"}</TableCell>
                            <TableCell>
                              <StatusBadge status={log.status} />
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(getMaintenanceCost(log))}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                            No maintenance logs available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-950">Recent Refueling Records</CardTitle>
                <CardDescription>Fuel quantity, HMR, efficiency, and cost-center movement.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead className="text-right">Fuel</TableHead>
                        <TableHead className="text-right">Efficiency</TableHead>
                        <TableHead>Cost Center</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.recentRefueling.length ? (
                        analytics.recentRefueling.map((item, index) => (
                          <TableRow key={`${item.parent.name}-${index}`}>
                            <TableCell className="whitespace-nowrap">{fullDate(item.date)}</TableCell>
                            <TableCell className="font-medium">{item.detail.registration_no || "N/A"}</TableCell>
                            <TableCell className="text-right">{formatNumber(Number(item.detail.fuel_qty_in_ltrs || 0), 1)} L</TableCell>
                            <TableCell className="text-right">{formatNumber(Number(item.detail.fuel_consumption || 0), 2)} km/l</TableCell>
                            <TableCell>{item.parent.cost_center || "N/A"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                            No refueling records available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
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

import { Input } from "@/components/ui/input"
import { AppLayout } from "@/components/app-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { vmsApi, type UtilizationReport, type VehicleLogMaster, type VehicleMaster, type VehicleRefueling, type VmsDashboardData } from "@/lib/vms-api"
import { CustomDatePicker } from "@/components/ui/CustomDatePicker"

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
  title,
  value,
  description,
  icon: Icon,
  tone,
  isLoading,
}: {
  title: string
  value: string
  description: string
  icon: typeof Car
  tone: string
  isLoading: boolean
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
    normalized === "breakdown"
      ? "border-red-200 bg-red-50 text-red-700"
      : normalized === "idle"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized === "maintenance"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : normalized === "running" || normalized === "active"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-slate-50 text-slate-600"

  return (
    <Badge variant="outline" className={classes}>
      {status || "Unknown"}
    </Badge>
  )
}

const getTodayDates = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  return { from: `${dateStr}T00:00`, to: `${dateStr}T23:59` };
};

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardState>(emptyState)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  // Date Filter State
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const handleSetToday = () => {
    const { from, to } = getTodayDates();
    setFromDate(from);
    setToDate(to);
  };

  const loadDashboard = async (overrideFrom?: string, overrideTo?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Use the override dates if provided (during initial mount), otherwise use React state
      const activeFrom = overrideFrom !== undefined ? overrideFrom : fromDate;
      const activeTo = overrideTo !== undefined ? overrideTo : toDate;

      let dashboardData: VmsDashboardData
      const sqlFromDate = activeFrom ? activeFrom.replace('T', ' ') + ':00' : undefined;
      const sqlToDate = activeTo ? activeTo.replace('T', ' ') + ':00' : undefined;

      const filterParams = (sqlFromDate && sqlToDate)
        ? { from_datetime: sqlFromDate, to_datetime: sqlToDate }
        : undefined;

      try {
        dashboardData = await vmsApi.getDashboardData(filterParams)
      } catch (dashboardError) {
        console.warn("Dashboard endpoint failed, falling back to resource APIs:", dashboardError)

        // Keep fallbacks parameterless to prevent strict TypeScript compilation errors
        const [vehicles, logs, refuelings, utilizations] = await Promise.all([
          vmsApi.getVehicleMasters(),
          vmsApi.getVehicleLogMasters(),
          vmsApi.getVehicleRefuelings(),
          vmsApi.getUtilizationReports(),
        ])

        dashboardData = { vehicles, logs, refuelings, utilizations }
      }

      setData({
        vehicles: Array.isArray(dashboardData.vehicles) ? dashboardData.vehicles : [],
        logs: Array.isArray(dashboardData.logs) ? dashboardData.logs : [],
        refuelings: Array.isArray(dashboardData.refuelings) ? dashboardData.refuelings : [],
        utilizations: Array.isArray(dashboardData.utilizations) ? dashboardData.utilizations : [],
      })
      setLastUpdated(new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load dashboard data."
      setError(message)

      if (message.includes("Session expired")) {
        localStorage.removeItem("isLoggedIn")
        router.push("/Login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const { from, to } = getTodayDates();
    setFromDate(from);
    setToDate(to);
    loadDashboard(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const analytics = useMemo(() => {
    const utilizationByVehicle = new Map<string, UtilizationReport>()

    data.utilizations.forEach((report) => {
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
    const runningVehicles = Math.max(0, (statusCounts.running || statusCounts.active || 0) || totalVehicles - breakdownVehicles - idleVehicles - maintenanceVehicles)

    const refuelingDetails = data.refuelings.flatMap((entry) =>
      (entry.vehicle_refueling_details || entry.details || []).map((detail) => ({
        parent: entry,
        detail,
        date: detail.date || entry.date,
      })),
    )

    const totalFuel = refuelingDetails.reduce((sum, item) => sum + Number(item.detail.fuel_qty_in_ltrs || 0), 0)
    const efficiencies = refuelingDetails.map((item) => Number(item.detail.fuel_consumption || 0)).filter((value) => value > 0)
    const avgEfficiency = efficiencies.length ? efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length : 0
    const totalHmr = data.utilizations.reduce((sum, item) => sum + Number(item.hmr || 0), 0)
    const totalMaintenanceCost = data.logs.reduce((sum, log) => sum + getMaintenanceCost(log), 0)

    const utilizationTrendMap = data.utilizations.reduce<Record<string, { date: string; Running: number; Idle: number; Breakdown: number; Maintenance: number }>>((acc, report) => {
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

    const maintenanceTrendMap = data.logs.reduce<Record<string, { date: string; Jobs: number; Cost: number }>>((acc, log) => {
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

    const costCenterMap = data.utilizations.reduce<Record<string, { costCenter: string; HMR: number; Records: number }>>((acc, item) => {
      const costCenter = item.cost_center || "Unassigned"
      acc[costCenter] ||= { costCenter, HMR: 0, Records: 0 }
      acc[costCenter].HMR += Number(item.hmr || 0)
      acc[costCenter].Records += 1
      return acc
    }, {})

    const costCenters = Object.values(costCenterMap)
      .sort((a, b) => b.HMR - a.HMR)
      .slice(0, 8)

    const recentLogs = [...data.logs]
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
        status,
        hmr,
        odometer,
        utilizationPercent,
      }
    })

    return {
      totalVehicles,
      trackedVehicles,
      runningVehicles,
      idleVehicles,
      breakdownVehicles,
      maintenanceVehicles,
      totalFuel,
      avgEfficiency,
      totalHmr,
      totalMaintenanceCost,
      utilizationTrend,
      fuelTrend,
      maintenanceTrend,
      statusMix,
      costCenters,
      recentLogs,
      recentRefueling,
      vehicleHealth,
      refuelingCount: refuelingDetails.length,
    }
  }, [data])

  const healthPercent = analytics.totalVehicles
    ? Math.round(((analytics.totalVehicles - analytics.breakdownVehicles - analytics.maintenanceVehicles) / analytics.totalVehicles) * 100)
    : 0

  return (
    <AppLayout>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* 1. Header */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 hover:bg-slate-100">
                  VMS Command Center
                </Badge>
                {lastUpdated && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    Updated {lastUpdated}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Fleet Operations Dashboard
              </h1>
              <p className="text-sm leading-relaxed text-slate-500">
                Live overview of vehicle availability, maintenance workload, utilization, fuel efficiency, and report-ready operational records.
              </p>
            </div>


            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              {/* From */}
              <span className="text-sm font-medium text-slate-500">From</span>
              <CustomDatePicker showTime value={fromDate} onChange={setFromDate} />

            
              {/* To */}
              <span className="text-sm font-medium text-slate-500">To</span>
              <CustomDatePicker showTime value={toDate} onChange={setToDate} />

              {/* Actions */}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSetToday}
                  className="h-9 border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                >
                  Today
                </Button>
                <Button
                  onClick={() => loadDashboard()}
                  disabled={isLoading || (Boolean(fromDate) !== Boolean(toDate))}
                  className="h-9 shadow-sm"
                >
                  <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  {fromDate && toDate ? "Apply Filters" : "Refresh"}
                </Button>
                {(fromDate || toDate) && (
                  <Button
                    variant="ghost"
                    onClick={() => { setFromDate(""); setToDate(""); }}
                    className="h-9 text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard title="Total Vehicles" value={formatNumber(analytics.totalVehicles)} description={`${formatNumber(analytics.trackedVehicles)} vehicles have utilization records`} icon={Car} tone="bg-sky-50 text-sky-700" isLoading={isLoading} />
            <MetricCard title="Running" value={formatNumber(analytics.runningVehicles)} description={`${healthPercent}% fleet available for operations`} icon={Activity} tone="bg-emerald-50 text-emerald-700" isLoading={isLoading} />
            <MetricCard title="Idle" value={formatNumber(analytics.idleVehicles)} description="Latest utilization status marked idle" icon={Gauge} tone="bg-amber-50 text-amber-700" isLoading={isLoading} />
            <MetricCard title="Breakdowns" value={formatNumber(analytics.breakdownVehicles)} description="Vehicles requiring immediate attention" icon={AlertTriangle} tone="bg-red-50 text-red-700" isLoading={isLoading} />
            <MetricCard title="Fuel Used" value={`${formatNumber(analytics.totalFuel, 1)} L`} description={`${formatNumber(analytics.avgEfficiency, 2)} km/l average efficiency`} icon={Fuel} tone="bg-cyan-50 text-cyan-700" isLoading={isLoading} />
            <MetricCard title="Maint. Cost" value={formatCurrency(analytics.totalMaintenanceCost)} description={`${formatNumber(data.logs.length)} maintenance job cards`} icon={IndianRupee} tone="bg-indigo-50 text-indigo-700" isLoading={isLoading} />
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
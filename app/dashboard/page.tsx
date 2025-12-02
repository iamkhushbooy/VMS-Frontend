"use client"

import { useEffect, useState, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { KpiCard } from "@/components/vms/dashboard/KpiCard"
import { FleetUtilizationChart } from "@/components/vms/dashboard/FleetUtilizationChart"
import { FuelTrendChart } from "@/components/vms/dashboard/FuelTrendChart"
import { BreakdownChart } from "@/components/vms/dashboard/BreakdownChart"
import { CostCenterPieChart } from "@/components/vms/dashboard/CostCenterPieChart"
import { RecentLogsTable } from "@/components/vms/dashboard/RecentLogsTable"
import { RefuelingTable } from "@/components/vms/dashboard/RefuelingTable"
import { vmsApi } from "@/lib/vms-api"
import { Car, Fuel, Wrench, Gauge, Activity } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [refuelings, setRefuelings] = useState<any[]>([])
  const [utilizations, setUtilizations] = useState<any[]>([])

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      router.push("/Login")
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [vehiclesData, logsData, refuelingsData, utilizationsData] = await Promise.all([
          vmsApi.getVehicleMasters(),
          vmsApi.getVehicleLogMasters(),
          vmsApi.getVehicleRefuelings(),
          vmsApi.getUtilizationReports(),
        ])

        setVehicles(vehiclesData)
        setLogs(logsData)
        setRefuelings(refuelingsData)
        setUtilizations(utilizationsData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        if (error instanceof Error && error.message.includes("Session expired")) {
          localStorage.removeItem("isLoggedIn")
          router.push("/Login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalVehicles = vehicles.length

    const runningVehicles = utilizations.filter((u) => u.status === "Running" || u.status === "running").length
    const idleVehicles = utilizations.filter((u) => u.status === "Idle" || u.status === "idle").length
    const breakdownVehicles = logs.filter(
      (log) =>
        log.status?.toLowerCase().includes("breakdown") ||
        (log.problem_details && log.problem_details.length > 0),
    ).length

    // Calculate average fuel efficiency
    let totalEfficiency = 0
    let efficiencyCount = 0
    refuelings.forEach((refueling) => {
      refueling.vehicle_refueling_details?.forEach((detail: any) => {
        if (detail.fuel_consumption) {
          totalEfficiency += detail.fuel_consumption
          efficiencyCount += 1
        }
      })
    })
    const avgFuelEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0

    return {
      totalVehicles,
      runningVehicles,
      idleVehicles,
      breakdownVehicles,
      avgFuelEfficiency: avgFuelEfficiency.toFixed(2),
    }
  }, [vehicles, utilizations, logs, refuelings])

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Fleet Dashboard</h1>
          <p className="text-muted-foreground">Real-time fleet analytics and insights</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Total Vehicles"
            value={kpis.totalVehicles}
            icon={Car}
            iconColor="text-blue-500"
            isLoading={isLoading}
          />
          <KpiCard
            title="Running Vehicles"
            value={kpis.runningVehicles}
            icon={Activity}
            iconColor="text-green-500"
            isLoading={isLoading}
          />
          <KpiCard
            title="Idle Vehicles"
            value={kpis.idleVehicles}
            icon={Gauge}
            iconColor="text-yellow-500"
            isLoading={isLoading}
          />
          <KpiCard
            title="Breakdown Vehicles"
            value={kpis.breakdownVehicles}
            icon={Wrench}
            iconColor="text-red-500"
            isLoading={isLoading}
          />
          <KpiCard
            title="Avg Fuel Efficiency"
            value={`${kpis.avgFuelEfficiency} km/l`}
            icon={Fuel}
            iconColor="text-cyan-500"
            isLoading={isLoading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FleetUtilizationChart data={utilizations} isLoading={isLoading} />
          <FuelTrendChart data={refuelings} isLoading={isLoading} />
          <BreakdownChart data={logs} isLoading={isLoading} />
          <CostCenterPieChart data={utilizations} isLoading={isLoading} />
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentLogsTable data={logs} isLoading={isLoading} />
          <RefuelingTable data={refuelings} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  )
}


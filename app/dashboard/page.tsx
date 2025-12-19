"use client"

import { useEffect, useState, useMemo } from "react"
import { AppLayout } from "@/components/app-layout"
import { KpiCard } from "@/components/vms/dashboard/KpiCard"
import { FleetUtilizationChart } from "@/components/vms/dashboard/FleetUtilizationChart"
import { FuelTrendChart } from "@/components/vms/dashboard/FuelTrendChart"
import { BreakdownChart } from "@/components/vms/dashboard/BreakdownChart"
import { CostCenterPieChart } from "@/components/vms/dashboard/CostCenterPieChart"
import { MaintenanceCostTrendChart } from "@/components/vms/dashboard/MaintenanceCostTrendChart"
import { VehicleStatusChart } from "@/components/vms/dashboard/VehicleStatusChart"
import { HMRTrendChart } from "@/components/vms/dashboard/HMRTrendChart"
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

  // ---------------- Fetch Data -----------------
  useEffect(() => {

    const fetchData = async () => {
      try {
        setIsLoading(true)

        const [vehiclesData, logsData, refuelingsData, utilizationsData] = await Promise.all([
          vmsApi.getVehicleMasters(),
          vmsApi.getVehicleLogMasters(),
          vmsApi.getVehicleRefuelings(),
          vmsApi.getUtilizationReports(),
        ])

        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
        setLogs(Array.isArray(logsData) ? logsData : [])
        setRefuelings(Array.isArray(refuelingsData) ? refuelingsData : [])
        setUtilizations(Array.isArray(utilizationsData) ? utilizationsData : [])
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

const kpis = useMemo(() => {
  const totalVehicles = vehicles.length

  const runningVehicles = utilizations.filter((u) =>
    (u?.status ?? "").toLowerCase() === "running"
  ).length

  const idleVehicles = utilizations.filter((u) =>
    (u?.status ?? "").toLowerCase() === "idle"
  ).length

  const breakdownVehicles = utilizations.filter((u) =>
    (u?.status ?? "").toLowerCase() === "breakdown"
  ).length

  // Fuel efficiency
  let totalEfficiency = 0
  let efficiencyCount = 0

  refuelings.forEach((refuel) => {
    (refuel?.vehicle_refueling_details ?? []).forEach((detail:any) => {
      const fc = Number(detail?.fuel_consumption)
      if (!isNaN(fc)) {
        totalEfficiency += fc
        efficiencyCount++
      }
    })
  })

  const avgFuelEfficiency =
    efficiencyCount > 0 ? (totalEfficiency / efficiencyCount).toFixed(2) : "0.00"

  return {
    totalVehicles,
    runningVehicles,
    idleVehicles,
    breakdownVehicles,
    avgFuelEfficiency,
  }
}, [vehicles, utilizations, logs, refuelings])


  // Debug
  console.log("KPI Values:", kpis)

  // ---------------- UI -----------------
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900">
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto">

          <div className="mb-8">
            <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
            <p className="text-muted-foreground">Real-time fleet analytics and insights</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KpiCard title="Total Vehicles" value={kpis.totalVehicles} icon={Car} isLoading={isLoading} />
            <KpiCard title="Running Vehicles" value={kpis.runningVehicles} icon={Activity} iconColor="text-green-500" isLoading={isLoading} />
            <KpiCard title="Idle Vehicles" value={kpis.idleVehicles} icon={Gauge} iconColor="text-yellow-500" isLoading={isLoading} />
            <KpiCard title="Breakdown Vehicles" value={kpis.breakdownVehicles} icon={Wrench} iconColor="text-red-500" isLoading={isLoading} />
            <KpiCard title="Avg Fuel Efficiency" value={`${kpis.avgFuelEfficiency} km/l`} icon={Fuel} iconColor="text-cyan-500" isLoading={isLoading} />
          </div>

          {/* Charts Section - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FleetUtilizationChart data={utilizations} isLoading={isLoading} />
            <FuelTrendChart data={refuelings} isLoading={isLoading} />
          </div>

          {/* Charts Section - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <BreakdownChart data={logs} isLoading={isLoading} />
            <CostCenterPieChart data={utilizations} isLoading={isLoading} />
          </div>

          {/* Charts Section - Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <MaintenanceCostTrendChart data={logs} isLoading={isLoading} />
            <VehicleStatusChart data={utilizations} isLoading={isLoading} />
            <HMRTrendChart data={utilizations} isLoading={isLoading} />
          </div>

        </div>
      </AppLayout>
    </div>
  )
}

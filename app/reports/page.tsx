"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { FilterBar, FilterState } from "@/components/vms/reports/FilterBar"
import { UtilizationReportTable } from "@/components/vms/reports/UtilizationReportTable"
import { FuelReportTable } from "@/components/vms/reports/FuelReportTable"
import { MaintenanceReportTable } from "@/components/vms/reports/MaintenanceReportTable"
import { VehicleMasterReportTable } from "@/components/vms/reports/VehicleMasterReportTable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { vmsApi } from "@/lib/vms-api"
import { useRouter } from "next/navigation"

export default function ReportsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [refuelings, setRefuelings] = useState<any[]>([])
  const [utilizations, setUtilizations] = useState<any[]>([])
  const [filters, setFilters] = useState<FilterState>({
    fromDate: undefined,
    toDate: undefined,
    vehicle: "all",
    costCenter: "all",
    status: "all",
    shift: "all",
  })

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
        console.error("Error fetching reports data:", error)
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

  const handleResetFilters = () => {
    setFilters({
      fromDate: undefined,
      toDate: undefined,
      vehicle: "all",
      costCenter: "all",
      status: "all",
      shift: "all",
    })
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports Hub</h1>
          <p className="text-muted-foreground">Comprehensive fleet reports and analytics</p>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} onReset={handleResetFilters} />

        {/* Reports Tabs */}
        <Tabs defaultValue="utilization" className="space-y-4">
          <TabsList>
            <TabsTrigger value="utilization">Utilization Report</TabsTrigger>
            <TabsTrigger value="fuel">Fuel Report</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance Report</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Master</TabsTrigger>
          </TabsList>

          <TabsContent value="utilization" className="space-y-4">
            <UtilizationReportTable
              data={utilizations}
              filters={filters}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="fuel" className="space-y-4">
            <FuelReportTable data={refuelings} filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceReportTable data={logs} filters={filters} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            <VehicleMasterReportTable data={vehicles} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}


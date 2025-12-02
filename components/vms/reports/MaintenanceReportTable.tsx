"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleLogMaster } from "@/lib/vms-api"
import { useVmsFilters } from "@/lib/store/vms-filters-store"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { BreakdownCountChart } from "./BreakdownCountChart"
import { MaintenanceCostTrendChart } from "./MaintenanceCostTrendChart"

interface MaintenanceReportTableProps {
  data: VehicleLogMaster[]
  isLoading?: boolean
}

export function MaintenanceReportTable({
  data,
  isLoading,
}: MaintenanceReportTableProps) {
  const { filters } = useVmsFilters()
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")

  const filteredData = useMemo(() => {
    return data.filter((log) => {
      if (filters.fromDate && log.date_of_initiation) {
        const logDate = new Date(log.date_of_initiation)
        if (logDate < filters.fromDate) return false
      }
      if (filters.toDate && log.date_of_initiation) {
        const logDate = new Date(log.date_of_initiation)
        if (logDate > filters.toDate) return false
      }
      if (filters.vehicle && filters.vehicle !== "all" && log.license_plate !== filters.vehicle) return false
      if (statusFilter && statusFilter !== "all" && log.status !== statusFilter) return false
      // Job type filter would need a field in the data model
      return true
    })
  }, [data, filters, statusFilter, jobTypeFilter])

  const getTotalExpense = (log: VehicleLogMaster) => {
    const partsExpense = log.part_details?.reduce((sum, p) => sum + (p.expense || 0), 0) || 0
    const lubeExpense = log.lube_details?.reduce((sum, l) => sum + (l.expense || 0), 0) || 0
    return partsExpense + lubeExpense
  }

  const handleExport = () => {
    const csv = [
      ["Vehicle", "Date", "Job Type", "Status", "Problem Details", "Total Expense"].join(","),
      ...filteredData.map((log) =>
        [
          log.license_plate || "",
          log.date_of_initiation ? format(new Date(log.date_of_initiation), "yyyy-MM-dd") : "",
          "Maintenance", // Would need job_cards_type field
          log.status || "",
          log.problem_details && log.problem_details.length > 0
            ? log.problem_details[0].problem_details
            : "",
          getTotalExpense(log),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `maintenance-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance & Breakdown Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Maintenance & Breakdown Report</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BreakdownCountChart data={data} isLoading={isLoading} />
          <MaintenanceCostTrendChart data={data} isLoading={isLoading} />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Hold">Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Job Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Problem Details</TableHead>
                <TableHead>Total Expense</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((log) => (
                  <TableRow key={log.name}>
                    <TableCell className="font-medium">{log.license_plate || "N/A"}</TableCell>
                    <TableCell>
                      {log.date_of_initiation
                        ? format(new Date(log.date_of_initiation), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>Maintenance</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          log.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : log.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {log.status || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.problem_details && log.problem_details.length > 0
                        ? log.problem_details[0].problem_details
                        : "N/A"}
                    </TableCell>
                    <TableCell>₹{getTotalExpense(log).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


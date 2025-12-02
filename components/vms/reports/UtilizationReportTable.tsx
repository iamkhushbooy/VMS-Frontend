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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { UtilizationReport } from "@/lib/vms-api"
import { FilterState } from "./FilterBar"
import { Download, ArrowUpDown, Search } from "lucide-react"
import { format } from "date-fns"

interface UtilizationReportTableProps {
  data: UtilizationReport[]
  filters: FilterState
  isLoading?: boolean
}

type SortField = "date" | "hmr" | "vehicle" | "status"
type SortDirection = "asc" | "desc"

export function UtilizationReportTable({
  data,
  filters,
  isLoading,
}: UtilizationReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((report) => {
      // Apply filters
      if (filters.fromDate && report.date) {
        const reportDate = new Date(report.date)
        if (reportDate < filters.fromDate) return false
      }
      if (filters.toDate && report.date) {
        const reportDate = new Date(report.date)
        if (reportDate > filters.toDate) return false
      }
      if (filters.vehicle && filters.vehicle !== "all" && report.vehicle !== filters.vehicle) return false
      if (filters.costCenter && filters.costCenter !== "all" && report.cost_center !== filters.costCenter) return false
      if (filters.status && filters.status !== "all" && report.status !== filters.status) return false
      if (filters.shift && filters.shift !== "all" && report.shift !== filters.shift) return false

      // Apply search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          report.vehicle?.toLowerCase().includes(searchLower) ||
          report.cost_center?.toLowerCase().includes(searchLower) ||
          report.shift?.toLowerCase().includes(searchLower)
        )
      }

      return true
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "date") {
        aValue = a.date ? new Date(a.date).getTime() : 0
        bValue = b.date ? new Date(b.date).getTime() : 0
      } else if (sortField === "hmr") {
        aValue = a.hmr || 0
        bValue = b.hmr || 0
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [data, filters, searchTerm, sortField, sortDirection])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(start, start + itemsPerPage)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleExport = () => {
    const csv = [
      ["Date", "Shift", "Cost Center", "Vehicle", "Status", "HMR"].join(","),
      ...filteredAndSortedData.map((report) =>
        [
          report.date || "",
          report.shift || "",
          report.cost_center || "",
          report.vehicle || "",
          report.status || "",
          report.hmr || 0,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `utilization-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Utilization Report</CardTitle>
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
        <CardTitle>Vehicle Utilization Report</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, cost center, shift..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort("date")}
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => handleSort("hmr")}
                  >
                    HMR
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((report) => (
                  <TableRow key={report.name}>
                    <TableCell>
                      {report.date ? format(new Date(report.date), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>{report.shift || "N/A"}</TableCell>
                    <TableCell>{report.cost_center || "N/A"}</TableCell>
                    <TableCell className="font-medium">{report.vehicle || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          report.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : report.status === "Breakdown"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {report.status || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>{report.hmr || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} of{" "}
              {filteredAndSortedData.length} entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


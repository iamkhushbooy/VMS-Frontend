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
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { UtilizationReport } from "@/lib/vms-api"
import { useVmsFilters } from "@/lib/store/vms-filters-store"
import { Download, ArrowUpDown, Search } from "lucide-react"
import { format } from "date-fns"

interface UtilizationReportTableProps {
  data: UtilizationReport[]
  isLoading?: boolean
}

type SortField = "date" | "hmr" | "vehicle" | "status"
type SortDirection = "asc" | "desc"

export function UtilizationReportTable({
  data,
  isLoading,
}: UtilizationReportTableProps) {
  const { filters } = useVmsFilters()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // ... (Logic for filteredAndSortedData remains the same to keep functionality)
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((report) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          report.vehicle?.toLowerCase().includes(searchLower) ||
          report.plant?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })

    filtered.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;

      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return b.name.localeCompare(a.name);
    });
    return filtered
  }, [data, searchTerm, sortField, sortDirection])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedData.slice(start, start + itemsPerPage)
  }, [filteredAndSortedData, currentPage])

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)

  const handleSort = (field: SortField) => {
    setSortField(field)
    setSortDirection(sortField === field && sortDirection === "desc" ? "asc" : "desc")
  }

  if (isLoading) {
    return <div className="p-4 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <div className="w-full bg-[#F9FAFF] min-h-screen p-4">
      <div className="flex flex-row items-center justify-between mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vehicle or plant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-none shadow-sm rounded-xl h-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <Table>
          <TableHeader className="bg-transparent">
            <TableRow className="hover:bg-transparent border-b border-gray-100">
              <TableHead className="text-primary font-semibold py-5 px-6">Name</TableHead>
              <TableHead className="text-primary font-semibold">
                <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:opacity-70">
                  Date
                </button>
              </TableHead>
              <TableHead className="text-primary font-semibold">Shift</TableHead>
              <TableHead className="text-primary font-semibold">Vehicle</TableHead>
              <TableHead className="text-primary font-semibold">HMR</TableHead>
              <TableHead className="text-primary font-semibold">Plant</TableHead>
              <TableHead className="text-primary font-semibold">Run Time</TableHead>
              <TableHead className="text-primary font-semibold text-right pr-10">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((report, idx) => (
              <TableRow key={idx} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                <TableCell className="font-medium text-gray-700 py-4 px-6">{report.name || "—"}</TableCell>
                <TableCell className="text-gray-600">
                  {report.date ? format(new Date(report.date), "yyyy-MM-dd") : "—"}
                </TableCell>
                <TableCell>
                  <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-md text-xs">
                    {report.shift || "G"}
                  </span>
                </TableCell>
                <TableCell className="text-gray-700 font-medium">{report.vehicle}</TableCell>
                <TableCell className="text-gray-600">{report.hmr}</TableCell>
                <TableCell className="text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  {report.plant}
                </TableCell>
                <TableCell className="text-gray-700 font-bold">
                  {/* Placeholder for Run Time logic if not in API */}
                  {Math.floor(Math.random() * 24)}h 0m
                </TableCell>
                <TableCell className="text-right pr-8">
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    {report.status || "Idle"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modern Pagination */}
      <div className="flex items-center justify-between mt-6 px-2">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> of {filteredAndSortedData.length}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="rounded-xl hover:bg-white hover:shadow-sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            className="rounded-xl hover:bg-white hover:shadow-sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  CalendarDays,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Download
} from "lucide-react"
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Interface Updated
interface VehicleUtilization {
  vehicle_id: string
  license_plate: string
  chassis_no?: string
  warehouse?: string
  running_time: number
  breakdown_time: number
  idle_time: number
  primary_status: 'Running' | 'Breakdown' | 'Idle'
}

interface ReportSummary {
  total: number
  running: number
  breakdown: number
  idle: number
}

type FilterStatus = 'All' | 'Running' | 'Breakdown' | 'Idle'

const formatTime = (decimalHours: number) => {
  if (!decimalHours || decimalHours <= 0) return "0 mins"
  const totalMinutes = Math.round(decimalHours * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0 && minutes > 0) return `${hours} hr ${minutes} mins`
  else if (hours > 0) return `${hours} hr`
  else return `${minutes} mins`
}

export function VehicleUtilizationReport() {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All')
  const [data, setData] = useState<VehicleUtilization[] | null>(null)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateReport = async () => {
    if (!fromDate || !toDate) return
    setIsLoading(true)
    try {
      const sqlFromDate = fromDate.replace('T', ' ') + ':00'
      const sqlToDate = toDate.replace('T', ' ') + ':00'
      const url = `/api/method/vms.api.get_vehicle_utilization?from_datetime=${sqlFromDate}&to_datetime=${sqlToDate}`
      const response = await fetch(url)
      const result = await response.json()

      if (result.message) {
        setData(result.message.data || [])
        setSummary(result.message.summary || null)
        setStatusFilter('All')
      }
    } catch (error) {
      console.error("Failed to fetch report:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter Logic Updated
  const filteredData = data?.filter((row) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      (row.license_plate?.toLowerCase() || "").includes(search) ||
      (row.vehicle_id?.toLowerCase() || "").includes(search) ||
      (row.chassis_no?.toLowerCase() || "").includes(search) ||
      (row.warehouse?.toLowerCase() || "").includes(search)

    const matchesFilter = statusFilter === 'All' || row.primary_status === statusFilter
    return matchesSearch && matchesFilter
  }) || []

  const toggleFilter = (status: FilterStatus) => {
    setStatusFilter(current => current === status ? 'All' : status)
  }

  // Export Logic
  const handleExportExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data available to export.");
      return;
    }
    try {
      const exportData = filteredData.map((row) => ({
        "License Plate": row.license_plate || row.vehicle_id,
        "Chassis No": row.chassis_no || "-",
        "Warehouse": row.warehouse || "-",
        "Status": row.primary_status,
        "Running Time": formatTime(row.running_time),
        "Breakdown Time": formatTime(row.breakdown_time),
        "Idle Time": formatTime(row.idle_time),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Utilization Report");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      saveAs(dataBlob, `Vehicle_Utilization_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Export Error:", error);
      alert("There was an issue generating the Excel file.");
    }
  };

  return (
    <div className="w-full bg-[#F9FAFF] min-h-screen p-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-sm font-semibold text-gray-700">From Date & Time</label>
          <Input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-gray-50 border-none shadow-sm rounded-xl h-10" />
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-sm font-semibold text-gray-700">To Date & Time</label>
          <Input type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-gray-50 border-none shadow-sm rounded-xl h-10" />
        </div>
        <Button onClick={handleGenerateReport} disabled={!fromDate || !toDate || isLoading} className="glow-button-pink text-white font-semibold">
          {isLoading ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      {!data && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 border-dashed">
          <CalendarDays className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Report Generated</h3>
          <p className="text-gray-500 text-sm mt-1">Select a timeframe to view vehicle utilization and statistics.</p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100"><Skeleton className="h-10 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>
        </div>
      )}

      {data && summary && !isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card onClick={() => setStatusFilter('All')} className={`bg-white border-gray-100 shadow-sm rounded-2xl cursor-pointer transition-all hover:shadow-md ${statusFilter === 'All' ? 'ring-1 scale-[1.0]' : 'hover:scale-[1.01]'}`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500 mb-1">Total Vehicles</p><h3 className="text-3xl font-bold text-gray-900">{summary.total}</h3></div>
                <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center"><Truck className="h-6 w-6 text-gray-600" /></div>
              </CardContent>
            </Card>
            <Card onClick={() => toggleFilter('Running')} className={`bg-white border-gray-100 shadow-sm rounded-2xl cursor-pointer transition-all hover:shadow-md ${statusFilter === 'Running' ? 'ring-2 ring-emerald-500 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500 mb-1">Total Running</p><h3 className="text-3xl font-bold text-emerald-600">{summary.running}</h3></div>
                <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
              </CardContent>
            </Card>
            <Card onClick={() => toggleFilter('Breakdown')} className={`bg-white border-gray-100 shadow-sm rounded-2xl cursor-pointer transition-all hover:shadow-md ${statusFilter === 'Breakdown' ? 'ring-2 ring-red-500 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500 mb-1">Total Breakdown</p><h3 className="text-3xl font-bold text-red-600">{summary.breakdown}</h3></div>
                <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
              </CardContent>
            </Card>
            <Card onClick={() => toggleFilter('Idle')} className={`bg-white border-gray-100 shadow-sm rounded-2xl cursor-pointer transition-all hover:shadow-md ${statusFilter === 'Idle' ? 'ring-2 ring-orange-500 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-500 mb-1">Total Idle</p><h3 className="text-3xl font-bold text-orange-500">{summary.idle}</h3></div>
                <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center"><Coffee className="h-6 w-6 text-orange-500" /></div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-100">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search license plate, chassis no, warehouse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 border-none shadow-sm rounded-xl h-10"
                />
              </div>
              <div className="flex items-center gap-4">
                {statusFilter !== 'All' && (
                  <span className="text-sm text-gray-500 font-medium px-4">
                    Showing <span className="text-blue-600">{statusFilter}</span> vehicles
                  </span>
                )}
                <Button onClick={handleExportExcel} className="glow-button-pink text-white font-semibold">
                  <Download className="mr-2 h-4 w-4" /> Export Excel
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-transparent">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="text-primary font-semibold py-5 px-6">License Plate</TableHead>
                  <TableHead className="text-primary font-semibold">Warehouse</TableHead>
                  <TableHead className="text-primary font-semibold">Status</TableHead>
                  <TableHead className="text-primary font-semibold">Running Time</TableHead>
                  <TableHead className="text-primary font-semibold">Breakdown Time</TableHead>
                  <TableHead className="text-primary font-semibold">Idle Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">No vehicles match this filter.</span>
                        {statusFilter !== 'All' && <Button variant="link" onClick={() => setStatusFilter('All')} className="mt-2 text-blue-600">Clear Filters</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((report, idx) => (
                    <TableRow key={idx} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                      <TableCell className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-800">
                            {report.license_plate}
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Chassis: {report.chassis_no || "-"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-gray-600">
                        {report.warehouse || "-"}
                      </TableCell>

                      <TableCell>
                        {report.primary_status === 'Running' && <span className="text-emerald-600 font-medium text-sm flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Running</span>}
                        {report.primary_status === 'Breakdown' && <span className="text-red-600 font-medium text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Breakdown</span>}
                        {report.primary_status === 'Idle' && <span className="text-orange-500 font-medium text-sm flex items-center gap-1"><Coffee className="h-4 w-4" /> Idle</span>}
                      </TableCell>
                      <TableCell><span className="bg-emerald-50 text-emerald-600 font-bold px-3 py-1.5 rounded-md text-sm whitespace-nowrap">{formatTime(report.running_time)}</span></TableCell>
                      <TableCell><span className="bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-md text-sm whitespace-nowrap">{formatTime(report.breakdown_time)}</span></TableCell>
                      <TableCell><span className="bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-md text-sm whitespace-nowrap">{formatTime(report.idle_time)}</span></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}




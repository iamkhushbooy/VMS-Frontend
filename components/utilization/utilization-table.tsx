"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Download, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import CustomAlert from "../alert/alert"
import { AlertButton } from "../alert/types"
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface UtilizationRecord {
  name: string
  date: string
  supervisor_name: string
  from_date: number
  to_date: number
  company: string
  warehouse: string
  cost_center: string
  plant: string
  shift: string
  time: number
  vehicle: string
  status: string
  hmr: number
  creation: string;
}

interface UtilizationTableProps {
  onLogUtilization: () => void
  onSelectRecord: (record: UtilizationRecord) => void
}

import { getApiUrl, config } from "@/lib/config"
const DOCTYPE_NAME = "Utilization Report"

const formatDuration = (totalSeconds: number | string) => {
  const seconds = Number(totalSeconds);
  if (!seconds || isNaN(seconds)) return "0h 0m";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return `${h}h ${m}m`;
};

export default function UtilizationTable({ onLogUtilization, onSelectRecord }: UtilizationTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  
  const [records, setRecords] = useState<UtilizationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });
  
  const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: "OK", style: "cancel" }],
    });
  };
  
  const closeAlert = () => {
    setAlertState((p) => ({ ...p, visible: false }));
  };

  const fetchFrappeData = useCallback(async () => {
    setIsLoading(true)

    try {
      const fieldsToFetch = [
        "name", "date", "supervisor_name", "from_date", "to_date",
        "company", "warehouse", "cost_center", "plant", "shift",
        "time", "vehicle", "status", "hmr", "creation"
      ]
      const fieldsParam = encodeURIComponent(JSON.stringify(fieldsToFetch))
      const url = `${getApiUrl(config.api.resource(DOCTYPE_NAME))}?fields=${fieldsParam}&order_by=modified desc&limit_page_length=None`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (response.status === 403 || response.status === 401) {
        showAlert("Expired", "Session expired. Please login again.")
        localStorage.removeItem("isLoggedIn")
        window.location.href = "/"
        return
      }

      if (!response.ok) throw new Error(`Frappe API Error: ${response.status}`)

      const result = await response.json()
      console.log("Fetched data from Frappe:", result)
      const data = result.data || []
      setRecords(data)
      setSelectedNames([])
    } catch (error) {
      console.error("Error fetching data from Frappe:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFrappeData()
  }, [fetchFrappeData])

  const filteredRecords = useMemo(() => {
    const filtered = records.filter((r) => {
      // --- Date & Time Range Filter Logic ---
      let withinDateRange = true;
      const recordDateStr = r.creation || r.date; 
      
      if (recordDateStr) {
        const recordTime = new Date(recordDateStr).getTime();

        if (fromDate) {
          const fromTime = new Date(fromDate).getTime();
          if (recordTime < fromTime) withinDateRange = false;
          
          if (!toDate) {
            const endOfFromDate = new Date(fromDate);
            endOfFromDate.setHours(23, 59, 59, 999);
            if (recordTime > endOfFromDate.getTime()) withinDateRange = false;
          }
        }

        if (toDate) {
          const toTime = new Date(toDate).getTime();
          const finalToTime = (new Date(toDate).getHours() === 0 && new Date(toDate).getMinutes() === 0) 
              ? new Date(toDate).setHours(23, 59, 59, 999) 
              : toTime;
              
          if (recordTime > finalToTime) withinDateRange = false;
        }
      }

      if (!withinDateRange) return false;

      // --- Search Keyword Filter Logic ---
      const search = searchTerm.toLowerCase();

      const formattedCreation = r.creation 
        ? new Date(r.creation).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).toLowerCase() 
        : "";

      const formattedDate = r.date 
        ? new Date(r.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }).toLowerCase() 
        : "";

      return (
        r.vehicle?.toLowerCase().includes(search) ||
        formattedCreation.includes(search) ||
        r.plant?.toLowerCase().includes(search) ||
        r.status?.toLowerCase().includes(search) ||
        r.supervisor_name?.toLowerCase().includes(search) ||
        formattedDate.includes(search)
      );
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.creation || 0).getTime();
      const timeB = new Date(b.creation || 0).getTime();
      return timeB - timeA;
    });
  }, [records, searchTerm, fromDate, toDate]);

  const ITEMS_PER_PAGE = 50
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)

  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, fromDate, toDate])

  const toggleRowSelection = (name: string, checked: boolean) => {
    setSelectedNames((prev) => {
      let updated: string[]

      if (checked) {
        if (prev.includes(name)) return prev
        updated = [...prev, name]
      } else {
        updated = prev.filter((n) => n !== name)
      }
      return updated
    })
  }
  
  const allVisibleSelected =
    paginatedRecords.length > 0 &&
    paginatedRecords.every((r) => selectedNames.includes(r.name))

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageNames = paginatedRecords.map((r) => r.name)
      setSelectedNames((prev) => [...new Set([...prev, ...pageNames])])
    } else {
      const pageNames = paginatedRecords.map((r) => r.name)
      setSelectedNames((prev) => prev.filter((n) => !pageNames.includes(n)))
    }
  }

  const handleBulkAction = async () => {
    if (selectedNames.length === 0) {
      showAlert("Selection Required", "Please select at least one record to proceed.", [
        { text: "Understood", style: "default" }
      ]);
      return;
    }

    const confirmText = `Are you sure you want to DELETE ${selectedNames.length} records.`;

    showAlert(
      "Confirm Deletion",
      confirmText,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("Deletion cancelled"),
        },
        {
          text: "Delete Records",
          style: "destructive",
          onPress: () => executeDelete(),
        },
      ]
    );
  };
  
  const executeDelete = async () => {
    try {
      setIsActionLoading(true);

      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include",
      });
      const tokenResult = await tokenResp.json();
      const csrfToken = tokenResult.message;

      const formData = new FormData();
      formData.append("names", JSON.stringify(selectedNames));

      const methodName = "vms.api.bulk_delete_utilization";

      const res = await fetch(getApiUrl(config.api.method(methodName)), {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "X-Frappe-CSRF-Token": csrfToken,
        },
      });

      const data = await res.json();

      if (!res.ok || data.exc || data.status === "error") {
        showAlert("Action Failed", data?.message || "Failed to perform action.", [
          { text: "Try Again", style: "default" }
        ]);
        return;
      }

      showAlert("Success", "The selected records have been deleted.", [
        {
          text: "Finish",
          style: "default",
          onPress: () => fetchFrappeData()
        }
      ]);

    } catch (error) {
      console.error("Bulk action error:", error);
      showAlert("Error", "Something went wrong while communicating with the server.", [
        { text: "Close", style: "cancel" }
      ]);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      let dataToExport = [];

      if (selectedNames.length > 0) {
        dataToExport = records.filter(record => selectedNames.includes(record.name));
      } else {
        dataToExport = filteredRecords;
      }

      if (dataToExport.length === 0) {
        showAlert("No Data", "Don't have data for export.");
        return;
      }

      const exportData = dataToExport.map(record => ({
        "Date": record.date?.split(" ")[0],
        "Supervisor": record.supervisor_name,
        "From Date": record.from_date,
        "To Date": record.to_date,
        "Company": record.company,
        "Warehouse": record.warehouse,
        "Cost Center": record.cost_center,
        "Plant": record.plant,
        "Shift": record.shift,
        "Run Time": formatDuration(record.time),
        "Vehicle": record.vehicle,
        "Status": record.status,
        "HMR": record.hmr,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Utilization Report");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
      });

      const fileName = `Utilization_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);

    } catch (error) {
      console.error("Export Error:", error);
      showAlert("Export Failed", "There is an issue generating excel file.");
    }
  };

  // Naya function: Clear saare filters 
  const handleClearFilters = () => {
    setSearchTerm("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        
        {/* Search and Date Range Block */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 flex-1 w-full xl:max-w-4xl">
          <div className="relative flex-1 min-w-[200px] w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, Created On, plant, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-card text-foreground placeholder:text-muted-foreground focus:bg-white/10 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">From:</span>
            <Input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="glass-card text-foreground w-[170px] sm:w-[190px] focus:bg-white/10"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">To:</span>
            <Input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="glass-card text-foreground w-[170px] sm:w-[190px] focus:bg-white/10"
            />
          </div>

          {/* Clear Filter Button - Sirf tab dikhega jab koi filter laga hoga */}
          {(searchTerm || fromDate || toDate) && (
            <Button 
              variant="ghost" 
              onClick={handleClearFilters}
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-10 px-3"
              title="Clear all filters"
            >
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={handleBulkAction}
          >
            {isActionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </Button>

          <Button onClick={onLogUtilization} className="glow-button-pink text-white font-semibold">
            + New Report
          </Button>
          <Button
            onClick={handleExportExcel}
            className="glow-button-pink text-white font-semibold"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="glass-card overflow-x-auto rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) =>
                    handleToggleSelectAll(checked === true)
                  }
                />
              </TableHead>
              <TableHead className="text-primary font-semibold">Supervisor</TableHead>
              <TableHead className="text-primary font-semibold">Vehicle</TableHead>
              <TableHead className="text-primary font-semibold">Shift</TableHead>
              <TableHead className="text-primary font-semibold">Created On</TableHead>
              <TableHead className="text-primary font-semibold">HMR</TableHead>
              <TableHead className="text-primary font-semibold">Plant</TableHead>
              <TableHead className="text-primary font-semibold">Run Time</TableHead>
              <TableHead className="text-primary font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin inline text-primary" />
                  <span className="text-muted-foreground">Loading records...</span>
                </TableCell>
              </TableRow>
            ) : paginatedRecords.length > 0 ? (
              paginatedRecords.map((record) => (
                <TableRow
                  key={record.name}
                  className="table-row-hover border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest("button") || target.closest("label") || target.closest("input")) return
                    onSelectRecord(record)
                  }}
                >
                  <TableCell
                    onClick={(e) => e.stopPropagation()}
                    className="w-10"
                  >
                    <Checkbox
                      checked={selectedNames.includes(record.name)}
                      onCheckedChange={(checked) =>
                        toggleRowSelection(record.name, checked === true)
                      }
                    />
                  </TableCell>

                  <TableCell className="font-medium">{record.supervisor_name}</TableCell>

                  <TableCell className="font-mono">{record.vehicle}</TableCell>
                                    <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {record.shift}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">
                    {record.creation ? new Date(record.creation).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : "-"}
                  </TableCell>
                  <TableCell>{record.hmr}</TableCell>
                  <TableCell>{record.plant}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center font-medium">
                      {formatDuration(record.time)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        record.status === "Running"
                          ? "bg-green-100 text-green-800"
                          : record.status === "Breakdown"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {record.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No utilization reports found for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.max(p - 1, 1))
                }}
              />
            </PaginationItem>

            {(() => {
              const itemsPerBlock = 3
              const currentBlock = Math.ceil(currentPage / itemsPerBlock)

              const startPage = (currentBlock - 1) * itemsPerBlock + 1
              const endPage = Math.min(startPage + itemsPerBlock - 1, totalPages)

              const visiblePages = []
              for (let i = startPage; i <= endPage; i++) {
                visiblePages.push(i)
              }

              return visiblePages.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    className={
                      currentPage === page
                        ? "bg-gray-300 text-black hover:bg-gray-300 border-gray-400 hover:text-black"
                        : "hover:bg-gray-100 hover:text-black"
                    }
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(page)
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))
            })()}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={closeAlert}
      />
    </div>
  )
}
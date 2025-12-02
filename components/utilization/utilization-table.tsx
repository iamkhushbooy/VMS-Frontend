"use client"
import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export interface UtilizationRecord {
  name: string
  date: string
  shift: string
  vehicle: string
  plant: string
  hmr: number
  status: string
  supervisor_name: string
}

interface UtilizationTableProps {
  onLogUtilization: () => void
  onSelectRecord: (record: UtilizationRecord) => void
}

import { getApiUrl, config } from "@/lib/config"
const DOCTYPE_NAME = "Utilization Report"

export default function UtilizationTable({ onLogUtilization, onSelectRecord }: UtilizationTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<UtilizationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)

  const fetchFrappeData = useCallback(async () => {
    setIsLoading(true)

    try {
      const fieldsToFetch = ["name", "date", "shift", "vehicle", "plant", "hmr", "status", "supervisor_name"]
      const fieldsParam = encodeURIComponent(JSON.stringify(fieldsToFetch))
      const url = `${getApiUrl(config.api.resource(DOCTYPE_NAME))}?fields=${fieldsParam}&limit_page_length=2000` 
      
      const response = await fetch(url, {
        credentials: "include", 
      })

      if (response.status === 403 || response.status === 401) {
        alert("Session expired. Please login again.")
        localStorage.removeItem("isLoggedIn")
        window.location.href = "/" 
        return
      }

      if (!response.ok) throw new Error(`Frappe API Error: ${response.status}`)

      const result = await response.json()
      const data = result.data || []
      setRecords(data.reverse())
      setSelectedNames([])
    } catch (error) {
      console.error("Error fetching data from Frappe:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      window.location.href = "/"
      return
    }
    fetchFrappeData()
  }, [fetchFrappeData])

  const filteredRecords = records.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.plant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.supervisor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  // const toggleRowSelection = (name: string, checked: boolean) => {
  //   setSelectedNames((prev) => {
  //     if (checked) {
  //       if (prev.includes(name)) return prev
  //       return [...prev, name]
  //     } else {
  //       return prev.filter((n) => n !== name)
  //     }
  //   })  
  // }
  const toggleRowSelection = (name: string, checked: boolean) => {
    setSelectedNames((prev) => {
      let updated: string[]

      if (checked) {
        if (prev.includes(name)) return prev
        updated = [...prev, name]
      } else {
        updated = prev.filter((n) => n !== name)
      }
      console.log("Selected records:", updated, "Total:", updated.length)

      return updated
    })
  }
  const allVisibleSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedNames.includes(r.name))

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allNames = filteredRecords.map((r) => r.name)
      setSelectedNames(allNames)
    } else {
      setSelectedNames([])
    }
  }
  const handleBulkAction = async (action: "cancel" | "delete") => {
    if (selectedNames.length === 0) {
      alert("Please select at least one record.")
      return
    }

    const confirmText =
      action === "cancel"
        ? `Are you sure you want to CANCEL ${selectedNames.length} record(s)?`
        : `Are you sure you want to DELETE ${selectedNames.length} record(s)?`

    if (!window.confirm(confirmText)) return

    try {
      setIsActionLoading(true)
      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include",
      })
      const tokenResult = await tokenResp.json()
      const csrfToken = tokenResult.message
      const formData = new FormData()
      formData.append("names", JSON.stringify(selectedNames))

      const methodName =
        action === "cancel"
          ? "vms.api.bulk_cancel_utilization"
          : "vms.api.bulk_delete_utilization"

      const res = await fetch(getApiUrl(config.api.method(methodName)), {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          "X-Frappe-CSRF-Token": csrfToken,
        },
      })

      const data = await res.json()

      if (!res.ok || data.exc || data.status === "error") {
        console.error("Bulk action error:", data)
        alert(data?.message || "Failed to perform action.")
        return
      }

      alert(
        action === "cancel"
          ? "Selected records cancelled successfully."
          : "Selected records deleted successfully."
      )
      await fetchFrappeData()
    } catch (error) {
      console.error("Bulk action error:", error)
      alert("Something went wrong while performing the action.")
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle, plant, supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card text-foreground placeholder:text-muted-foreground focus:bg-white/10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("cancel")}
          >
            {isActionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Cancel
          </Button>

          <Button
            variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("delete")}
          >
            {isActionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </Button>

          <Button onClick={onLogUtilization} className="glow-button-pink text-white font-semibold">
            + New Report
          </Button>
        </div>
      </div>

      {/* Data Table */}
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

              <TableHead className="text-primary font-semibold">Name</TableHead>
              <TableHead className="text-primary font-semibold">Date</TableHead>
              <TableHead className="text-primary font-semibold">Shift</TableHead>
              <TableHead className="text-primary font-semibold">Vehicle</TableHead>
              <TableHead className="text-primary font-semibold">HMR</TableHead>
              <TableHead className="text-primary font-semibold">Plant</TableHead>
              <TableHead className="text-primary font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin inline text-primary" /> 
                  <span className="text-muted-foreground">Loading records...</span>
                </TableCell>
              </TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow
                  key={record.name}
                  className="table-row-hover border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest("button") || target.closest("label") || target.closest("input")) return
                    onSelectRecord(record)
                  }}
                >
                  {/*Row Checkbox */}
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

                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {record.shift}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">{record.vehicle}</TableCell>
                  <TableCell>{record.hmr}</TableCell>
                  <TableCell>{record.plant}</TableCell>
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No utilization reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

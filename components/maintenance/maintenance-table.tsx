
"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

const FRAPPE_BASE_URL = "http://localhost:8000"
const DOCTYPE_NAME = "Vehicle Log Master"

interface MaintenanceLog {
  name: string
  issuer_name: string
  license_plate: string
  status: string
  priority_level: string
  working_employee: string[]
}

interface MaintenanceTableProps {
  onNewLog: () => void
  onSelectLog: (log: MaintenanceLog) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Open":
    case "Pending":
      return "status-badge status-pending"
    case "In Progress":
      return "status-badge status-in-progress"
    case "Completed":
    case "Closed":
      return "status-badge status-completed"
    default:
      return "status-badge bg-gray-500/20 text-gray-300 border border-gray-500/30"
  }
}

export function MaintenanceTable({ onNewLog, onSelectLog }: MaintenanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)  
  const router = useRouter()

  const fetchMaintenanceLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = `${FRAPPE_BASE_URL}/api/method/vms.api.get_maintenance_logs_with_details`
      const response = await fetch(url, { credentials: "include" })

      if (response.status === 401 || response.status === 403) {
        alert("Session expired. Please login again.")
        localStorage.removeItem("isLoggedIn")
        router.push("/")
        return
      }

      const result = await response.json()
      setLogs(result.message || [])
      setSelectedNames([]) 
    } catch (error) {
      console.error("Error fetching logs:", error)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      router.push("/")
      return
    }
    fetchMaintenanceLogs()
  }, [fetchMaintenanceLogs, router])

  const filteredLogs = logs.filter(
    (log) =>
      log.issuer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const toggleRowSelection = (name: string, checked: boolean) => {
    setSelectedNames((prev) =>
      checked ? [...new Set([...prev, name])] : prev.filter((n) => n !== name)
    )
  }

  const allVisibleSelected =
    filteredLogs.length > 0 &&
    filteredLogs.every((log) => selectedNames.includes(log.name))

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedNames(checked ? filteredLogs.map((log) => log.name) : [])
  }

  useEffect(() => {
    if (selectedNames.length > 0) {
      console.log("Selected:", selectedNames, "Total:", selectedNames.length)
    }
  }, [selectedNames])

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
      const tokenResp = await fetch(`${FRAPPE_BASE_URL}/api/method/vms.api.get_csrf_token`, {
        credentials: "include",
      })
      const tokenResult = await tokenResp.json()
      const csrfToken = tokenResult.message
      const formData = new FormData()
      formData.append("names", JSON.stringify(selectedNames))
      const methodName =
        action === "cancel"
          ? "vms.api.bulk_cancel_maintenance"
          : "vms.api.bulk_delete_maintenance"

      const res = await fetch(`${FRAPPE_BASE_URL}/api/method/${methodName}`, {
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
          ? "Selected maintenance logs cancelled successfully."
          : "Selected maintenance logs deleted successfully."
      )

      await fetchMaintenanceLogs()
    } catch (error) {
      console.error("Bulk action error:", error)
      alert("Something went wrong while performing the action.")
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Issuer or Registration No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("cancel")}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel
          </Button>

          <Button
            variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("delete")}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>

          <Button onClick={onNewLog} className="glow-button-pink text-white font-semibold">
            + New Maintenance Log
          </Button>
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => handleToggleSelectAll(checked === true)}
                />
              </TableHead>

              <TableHead>Issuer Name</TableHead>
              <TableHead>Registration No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="pl-10">Working Employee</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow
                  key={log.name}
                  className="cursor-pointer"
                  onClick={() => onSelectLog(log)}
                >
                  {/* INDIVIDUAL CHECKBOX */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedNames.includes(log.name)}
                      onCheckedChange={(checked) =>
                        toggleRowSelection(log.name, checked === true)
                      }
                    />
                  </TableCell>

                  <TableCell>{log.issuer_name}</TableCell>
                  <TableCell>{log.license_plate}</TableCell>

                  <TableCell>
                    <span className={getStatusColor(log.status)}>{log.status}</span>
                  </TableCell>

                  <TableCell>{log.priority_level}</TableCell>
                  <TableCell className="pl-10">{log.working_employee.join(", ")}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No maintenance logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}


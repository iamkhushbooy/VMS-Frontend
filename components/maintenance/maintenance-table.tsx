"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { getErrorMessage } from "@/lib/errorMessage"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import { getApiUrl, config } from "@/lib/config"
interface MaintenanceLog {
  name: string
  issuer_name: string
  license_plate: string
  status: string
  priority_level: string
  working_employee: string[]
  docstatus: 0 | 1 | 2
}

interface MaintenanceTableProps {
  onNewLog: () => void
  onSelectLog: (log: MaintenanceLog) => void
  refreshTrigger: number
}

const getDocStatusLabel = (d: number) => {
  if (d === 1) return "Submitted"
  if (d === 2) return "Cancelled"
  return "Draft"
}

const getDocStatusClass = (d: number) => {
  if (d === 1) return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
  if (d === 2) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
  return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200"
}

export function MaintenanceTable({ onNewLog, onSelectLog, refreshTrigger }: MaintenanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)

  const router = useRouter()
  const fetchMaintenanceLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = getApiUrl(config.api.method("vms.api.get_maintenance_logs_with_details"))
      const resp = await fetch(url, { credentials: "include" })
      const json = await resp.json()

      const fixed = (json.message || []).map((log: any) => ({
        ...log,
        docstatus: log.docstatus ?? 0,
      }))
      fixed.sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      setLogs(fixed)
      setSelectedNames([])
    } catch (e) {
      console.error(e)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMaintenanceLogs()
  }, [fetchMaintenanceLogs, refreshTrigger])

  const filtered = logs.filter(
    (log) =>
      log.issuer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ITEMS_PER_PAGE = 50
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const paginatedLogs = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])
  const toggleRowSelection = (name: string, checked: boolean) => {
    setSelectedNames((prev) =>
      checked ? [...new Set([...prev, name])] : prev.filter((n) => n !== name)
    )
  }

  const allVisibleSelected =
    paginatedLogs.length > 0 &&
    paginatedLogs.every((r) => selectedNames.includes(r.name))

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedNames(checked ? paginatedLogs.map((r) => r.name) : [])
  }

  const handleBulkAction = async (action: "cancel" | "delete") => {
    if (selectedNames.length === 0) {
      alert("Please select at least one record.")
      return
    }
    if (action === "cancel") {
    const draftSelected = logs.filter(
      (log) => selectedNames.includes(log.name) && log.docstatus === 0
    );

    if (draftSelected.length > 0) {
      alert("Draft records cannot be cancelled. Only submitted records can be cancelled.");
      return;
    }
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
      const tokenJson = await tokenResp.json()
      const csrfToken = tokenJson.message

      const formData = new FormData()
      formData.append("names", JSON.stringify(selectedNames))

      const method =
        action === "cancel"
          ? "vms.api.bulk_cancel_maintenance"
          : "vms.api.bulk_delete_maintenance"

      const res = await fetch(getApiUrl(config.api.method(method)), {
        method: "POST",
        credentials: "include",
        headers: { "X-Frappe-CSRF-Token": csrfToken },
        body: formData,
      })

      const json = await res.json()

      if (!res.ok || json.exc) {
        alert("Action failed.")
        return
      }

      alert(action === "cancel" ? "Cancelled successfully." : "Deleted successfully.")
      fetchMaintenanceLogs()
    } catch (error) {
      alert(getErrorMessage(error))
    } finally {
      setIsActionLoading(false)
    }
  }
  return (
    <div className="flex flex-col gap-6">

       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Issuer or Registration No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
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

      <div className="glass-card overflow-x-auto rounded-md border border-white/10">
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
              <TableHead>Employees</TableHead>
              <TableHead>Doc Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin inline" /> Loading...
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No maintenance logs found
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow
                  key={log.name}
                  className="cursor-pointer hover:bg-white/5"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest("input") || target.closest("label")) return
                    onSelectLog(log)
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedNames.includes(log.name)}
                      onCheckedChange={(checked) => toggleRowSelection(log.name, checked === true)}
                    />
                  </TableCell>

                  <TableCell>{log.issuer_name}</TableCell>
                  <TableCell>{log.license_plate}</TableCell>
                  <TableCell>{log.status}</TableCell>
                  <TableCell>{log.priority_level}</TableCell>
                  <TableCell>{log.working_employee.join(", ")}</TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDocStatusClass(
                        log.docstatus
                      )}`}
                    >
                      {getDocStatusLabel(log.docstatus)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
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
    </div>
  )
}
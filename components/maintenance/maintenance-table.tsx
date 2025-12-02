"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const FRAPPE_BASE_URL = "https://prayog.vaaman.in"

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
  const router = useRouter()

  const fetchMaintenanceLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = `${FRAPPE_BASE_URL}/api/method/vms.api.get_maintenance_logs_with_details`
      const resp = await fetch(url, { credentials: "include" })
      const json = await resp.json()

      const fixed = (json.message || []).map((log: any) => ({
        ...log,
        docstatus: log.docstatus ?? 0,
      }))

      setLogs(fixed)
    } catch (e) {
      console.error(e)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMaintenanceLogs()
  }, [fetchMaintenanceLogs])

  useEffect(() => {
    fetchMaintenanceLogs()
  }, [refreshTrigger, fetchMaintenanceLogs])

  const filtered = logs.filter(
    (log) =>
      log.issuer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Issuer or Registration No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button onClick={onNewLog} className="glow-button-pink text-white font-semibold">
          + New Maintenance Log
        </Button>
      </div>

      {/* TABLE */}
      <div className="glass-card overflow-x-auto rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issuer Name</TableHead>
              <TableHead>Registration No</TableHead>
              <TableHead>Status (Job)</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Employees</TableHead>

              {/* NEW: Document Status */}
              <TableHead>Doc Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin inline" /> Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No maintenance logs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow
                  key={log.name}
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => onSelectLog(log)}
                >
                  <TableCell>{log.issuer_name}</TableCell>
                  <TableCell>{log.license_plate}</TableCell>

                  <TableCell>{log.status}</TableCell>
                  <TableCell>{log.priority_level}</TableCell>

                  <TableCell>{log.working_employee.join(", ")}</TableCell>

                  {/*DOCSTATUS BADGE */}
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
    </div>
  )
}

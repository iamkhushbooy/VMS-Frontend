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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { VehicleLogMaster } from "@/lib/vms-api"
import { vmsApi } from "@/lib/vms-api"
import { Eye } from "lucide-react"
import { format } from "date-fns"

interface RecentLogsTableProps {
  data: VehicleLogMaster[]
  isLoading?: boolean
}

export function RecentLogsTable({ data, isLoading }: RecentLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<VehicleLogMaster | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const handleRowClick = async (logName: string) => {
    setLoadingDetails(true)
    setIsDrawerOpen(true)
    try {
      const details = await vmsApi.getVehicleLogMasterDetails(logName)
      setSelectedLog(details)
    } catch (error) {
      console.error("Error loading log details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const getTotalExpense = (log: VehicleLogMaster) => {
    const partsExpense = log.part_details?.reduce((sum, p) => sum + (p.expense || 0), 0) || 0
    const lubeExpense = log.lube_details?.reduce((sum, l) => sum + (l.expense || 0), 0) || 0
    return partsExpense + lubeExpense
  }

  const getPartsCount = (log: VehicleLogMaster) => {
    return log.part_details?.reduce((sum, p) => sum + (p.qty || 0), 0) || 0
  }

  const recentLogs = data
    .sort((a, b) => {
      const dateA = a.date_of_initiation ? new Date(a.date_of_initiation).getTime() : 0
      const dateB = b.date_of_initiation ? new Date(b.date_of_initiation).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 10)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Vehicle Logs</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Vehicle Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Problem Details</TableHead>
                  <TableHead>Parts Used</TableHead>
                  <TableHead>Expense Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentLogs.map((log) => (
                    <TableRow key={log.name} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        {log.date_of_initiation
                          ? format(new Date(log.date_of_initiation), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">{log.license_plate || "N/A"}</TableCell>
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
                      <TableCell>{getPartsCount(log)}</TableCell>
                      <TableCell>₹{getTotalExpense(log).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRowClick(log.name)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Vehicle Log Details</DrawerTitle>
            <DrawerDescription>
              {selectedLog?.license_plate} - {selectedLog?.name}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">
            {loadingDetails ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : selectedLog ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">General Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span> {selectedLog.status}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>{" "}
                      {selectedLog.priority_level || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date of Initiation:</span>{" "}
                      {selectedLog.date_of_initiation
                        ? format(new Date(selectedLog.date_of_initiation), "MMM dd, yyyy HH:mm")
                        : "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Completion Date:</span>{" "}
                      {selectedLog.date_and_time_of_job_completion
                        ? format(
                            new Date(selectedLog.date_and_time_of_job_completion),
                            "MMM dd, yyyy HH:mm",
                          )
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {selectedLog.problem_details && selectedLog.problem_details.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Problem Details</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedLog.problem_details.map((p, i) => (
                        <li key={i}>{p.problem_details}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedLog.work_done_details && selectedLog.work_done_details.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Work Done Details</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedLog.work_done_details.map((w, i) => (
                        <li key={i}>{w.work_done_details}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedLog.part_details && selectedLog.part_details.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Part Details</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Expense</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLog.part_details.map((part, i) => (
                            <TableRow key={i}>
                              <TableCell>{part.item_name}</TableCell>
                              <TableCell>{part.qty}</TableCell>
                              <TableCell>₹{part.expense?.toFixed(2) || "0.00"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {selectedLog.lube_details && selectedLog.lube_details.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Lube Details</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Expense</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLog.lube_details.map((lube, i) => (
                            <TableRow key={i}>
                              <TableCell>{lube.item_name}</TableCell>
                              <TableCell>{lube.qty}</TableCell>
                              <TableCell>₹{lube.expense?.toFixed(2) || "0.00"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {selectedLog.working_employee && selectedLog.working_employee.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Working Employees</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedLog.working_employee.map((emp, i) => (
                        <li key={i}>{emp.employee}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedLog.pending_jobs_backlog_details &&
                  selectedLog.pending_jobs_backlog_details.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Pending Jobs</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedLog.pending_jobs_backlog_details.map((job, i) => (
                          <li key={i}>{job.pending_jobsbacklog_details}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-muted-foreground">No details available</p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}


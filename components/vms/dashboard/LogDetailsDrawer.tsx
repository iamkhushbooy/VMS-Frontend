"use client"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleLogMaster } from "@/lib/vms-api"
import { format } from "date-fns"

interface LogDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  log: VehicleLogMaster | null
  isLoading?: boolean
}

export function LogDetailsDrawer({ isOpen, onClose, log, isLoading }: LogDetailsDrawerProps) {
  if (isLoading) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Loading...</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  if (!log) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Vehicle Log Details</DrawerTitle>
            <DrawerDescription>No details available</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )
  }

  const getTotalExpense = () => {
    const partsExpense = log.part_details?.reduce((sum, p) => sum + (p.expense || 0), 0) || 0
    const lubeExpense = log.lube_details?.reduce((sum, l) => sum + (l.expense || 0), 0) || 0
    return partsExpense + lubeExpense
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Vehicle Log Details</DrawerTitle>
          <DrawerDescription>
            {log.license_plate} - {log.name}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4 space-y-6">
          {/* General Information */}
          <div>
            <h3 className="font-semibold mb-2">General Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span> {log.status}
              </div>
              <div>
                <span className="text-muted-foreground">Priority:</span> {log.priority_level || "N/A"}
              </div>
              <div>
                <span className="text-muted-foreground">Job Type:</span>{" "}
                {(log as any).job_cards_type || "N/A"}
              </div>
              <div>
                <span className="text-muted-foreground">Date of Initiation:</span>{" "}
                {log.date_of_initiation
                  ? format(new Date(log.date_of_initiation), "MMM dd, yyyy HH:mm")
                  : "N/A"}
              </div>
              <div>
                <span className="text-muted-foreground">Completion Date:</span>{" "}
                {log.date_and_time_of_job_completion
                  ? format(new Date(log.date_and_time_of_job_completion), "MMM dd, yyyy HH:mm")
                  : "N/A"}
              </div>
              <div>
                <span className="text-muted-foreground">Total Expense:</span> ₹
                {getTotalExpense().toFixed(2)}
              </div>
            </div>
          </div>

          {/* Problem Details */}
          {log.problem_details && log.problem_details.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Problem Details</h3>
              <ul className="list-disc list-inside space-y-1">
                {log.problem_details.map((p, i) => (
                  <li key={i}>{p.problem_details}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Work Done Details */}
          {log.work_done_details && log.work_done_details.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Work Done Details</h3>
              <ul className="list-disc list-inside space-y-1">
                {log.work_done_details.map((w, i) => (
                  <li key={i}>{w.work_done_details}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Part Details */}
          {log.part_details && log.part_details.length > 0 && (
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
                    {log.part_details.map((part, i) => (
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

          {/* Lube Details */}
          {log.lube_details && log.lube_details.length > 0 && (
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
                    {log.lube_details.map((lube, i) => (
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

          {/* Working Employees */}
          {log.working_employee && log.working_employee.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Working Employees</h3>
              <ul className="list-disc list-inside space-y-1">
                {log.working_employee.map((emp, i) => (
                  <li key={i}>{emp.employee}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Pending Jobs */}
          {log.pending_jobs_backlog_details && log.pending_jobs_backlog_details.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Pending Jobs</h3>
              <ul className="list-disc list-inside space-y-1">
                {log.pending_jobs_backlog_details.map((job, i) => (
                  <li key={i}>{job.pending_jobsbacklog_details}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}


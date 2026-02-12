"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Plus,Trash2} from "lucide-react"
import {
  type ProblemEntry,
  type WorkDoneEntry,
  type PendingJobEntry,
} from "./MaintenanceShared"

interface ProblemJobDetailProps {
  // Problem
  problemEntries: ProblemEntry[]
  newProblem: string
  setNewProblem: (val: string) => void
  addProblemEntry: () => void
  // Work Done
  workDoneEntries: WorkDoneEntry[]
  newWorkDone: string
  setNewWorkDone: (val: string) => void
  addWorkDoneEntry: () => void
  // Pending
  pendingJobEntries: PendingJobEntry[]
  newPendingJob: string
  setNewPendingJob: (val: string) => void
  addPendingJobEntry: () => void

  removeProblemEntry: (id: string) => void
  removeWorkDoneEntry: (id: string) => void
  removePendingJobEntry: (id: string) => void

  isBusy: boolean
}

export function ProblemJobDetailSection({
  problemEntries,
  newProblem,
  setNewProblem,
  addProblemEntry,
  workDoneEntries,
  newWorkDone,
  setNewWorkDone,
  addWorkDoneEntry,
  pendingJobEntries,
  newPendingJob,
  setNewPendingJob,
  addPendingJobEntry,
  removeProblemEntry,
  removeWorkDoneEntry,
  removePendingJobEntry,
  isBusy,
}: ProblemJobDetailProps) {
  return (
    <div className="space-y-6 bg-slate-100/50 p-5 rounded-lg border border-slate-100">
      <h3 className="text-lg font-semibold text-foreground">
        Problem/Job Details
      </h3>

      {/* 1. Problem Details */}
      <div className="space-y-2">
        <Label className="font-medium">Problem Details</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add problem detail..."
            value={newProblem}
            onChange={(e) => setNewProblem(e.target.value)}
            className="bg-input"
            disabled={isBusy}
          />
          <Button onClick={addProblemEntry} disabled={isBusy}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
        <Table>
          <TableBody>
            {problemEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.problem_detail}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeProblemEntry(entry.id)}
                    disabled={isBusy}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 2. Work Done Details */}
      <div className="space-y-2">
        <Label className="font-medium">Work Done Details</Label>

        <div className="flex gap-2">
          <Input
            placeholder="Add work done detail..."
            value={newWorkDone}
            onChange={(e) => setNewWorkDone(e.target.value)}
            className="bg-input"
            disabled={isBusy}
          />
          <Button onClick={addWorkDoneEntry} disabled={isBusy}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      <Table>
          <TableBody>
            {workDoneEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.work_done_detail}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => removeWorkDoneEntry(entry.id)} disabled={isBusy}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 3. Pending Jobs/Backlog Details */}
      <div className="space-y-2">
        <Label className="font-medium">Pending Jobs/ Backlog Details</Label>

        <div className="flex gap-2">
          <Input
            placeholder="Add pending job detail..."
            value={newPendingJob}
            onChange={(e) => setNewPendingJob(e.target.value)}
            className="bg-input"
            disabled={isBusy}
          />
          <Button onClick={addPendingJobEntry} disabled={isBusy}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>
      </div>
     <Table>
          <TableBody>
            {pendingJobEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.pending_job_detail}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => removePendingJobEntry(entry.id)} disabled={isBusy}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  )
}
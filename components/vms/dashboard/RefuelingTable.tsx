"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleRefueling } from "@/lib/vms-api"
import { Search } from "lucide-react"
import { useState, useMemo } from "react"
import { format } from "date-fns"

interface RefuelingTableProps {
  data: VehicleRefueling[]
  isLoading?: boolean
}

export function RefuelingTable({ data, isLoading }: RefuelingTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => {
    if (!data) return []
    return data
      .filter((refueling) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          refueling.name.toLowerCase().includes(searchLower) ||
          refueling.vehicle_refueling_details?.some((detail) =>
            detail.registration_no?.toLowerCase().includes(searchLower),
          ) ||
          refueling.cost_center?.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 10)
  }, [data, searchTerm])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Refueling Records</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>Latest Refueling Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vehicle, cost center..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Registration No</TableHead>
                <TableHead>Fuel Qty</TableHead>
                <TableHead>Fuel Efficiency</TableHead>
                <TableHead>HMR</TableHead>
                <TableHead>Cost Center</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No refueling records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.flatMap((refueling) =>
                  refueling.vehicle_refueling_details?.map((detail, idx) => (
                    <TableRow key={`${refueling.name}-${idx}`}>
                      <TableCell>
                        {refueling.date ? format(new Date(refueling.date), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {detail.registration_no || "N/A"}
                      </TableCell>
                      <TableCell>{detail.fuel_qty_in_ltrs || 0} L</TableCell>
                      <TableCell>
                        {detail.fuel_consumption ? `${detail.fuel_consumption.toFixed(2)} km/l` : "N/A"}
                      </TableCell>
                      <TableCell>{detail.current_hmrkms || 0}</TableCell>
                      <TableCell>{refueling.cost_center || "N/A"}</TableCell>
                    </TableRow>
                  )) || (
                    <TableRow key={refueling.name}>
                      <TableCell>
                        {refueling.date ? format(new Date(refueling.date), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No details available
                      </TableCell>
                    </TableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


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
import { Badge } from "@/components/ui/badge"
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
            detail.registration_no?.toLowerCase().includes(searchLower)
          ) ||
          refueling.cost_center?.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 15)
  }, [data, searchTerm])

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Latest Refueling Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Latest Refueling Records</CardTitle>
      </CardHeader>

      <CardContent>

        {/* Search Bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by registration, cost center..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-2 rounded-full"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-medium">Date</TableHead>
                <TableHead className="font-medium">Vehicle</TableHead>
                <TableHead className="font-medium">Fuel Qty</TableHead>
                <TableHead className="font-medium">Efficiency</TableHead>
                <TableHead className="font-medium">HMR</TableHead>
                <TableHead className="font-medium">Cost Center</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No refueling records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.flatMap((refueling) =>
                  refueling.vehicle_refueling_details?.map((detail, idx) => (
                    <TableRow
                      key={`${refueling.name}-${idx}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="text-gray-700">
                        {refueling.date
                          ? format(new Date(refueling.date), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>

                      <TableCell className="font-medium">{detail.registration_no || "N/A"}</TableCell>

                      <TableCell className="text-blue-600 font-semibold">
                        {detail.fuel_qty_in_ltrs || 0} L
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-green-700 border-green-400 px-2 py-1">
                          {detail.fuel_consumption
                            ? `${detail.fuel_consumption.toFixed(2)} km/l`
                            : "N/A"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-gray-800">{detail.current_hmrkms || 0}</TableCell>

                      <TableCell className="text-purple-600 font-medium">
                        {refueling.cost_center || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

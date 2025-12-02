"use client"

import { useState, useMemo } from "react"
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleMaster } from "@/lib/vms-api"
import { getApiUrl } from "@/lib/config"
import { Download, Search } from "lucide-react"
import Image from "next/image"

interface VehicleMasterReportTableProps {
  data: VehicleMaster[]
  isLoading?: boolean
}

export function VehicleMasterReportTable({ data, isLoading }: VehicleMasterReportTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => {
    if (!data) return []
    const searchLower = searchTerm.toLowerCase()
    return data.filter(
      (vehicle) =>
        vehicle.license_plate?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.make?.toLowerCase().includes(searchLower) ||
        vehicle.employee?.toLowerCase().includes(searchLower),
    )
  }, [data, searchTerm])

  const handleExport = () => {
    const csv = [
      [
        "License Plate",
        "Make",
        "Model",
        "Fuel Type",
        "Odometer",
        "Location",
        "Employee",
        "Vehicle Value",
      ].join(","),
      ...filteredData.map((vehicle) =>
        [
          vehicle.license_plate || "",
          vehicle.make || "",
          vehicle.model || "",
          vehicle.fuel_type || "",
          vehicle.last_odometer || 0,
          vehicle.location || "",
          vehicle.employee || "",
          vehicle.vehicle_value || 0,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vehicle-master-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Master Listing (Full Fleet Inventory)</CardTitle>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vehicle Master Listing (Full Fleet Inventory)</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by license plate, model, employee..."
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
                <TableHead>Image</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Vehicle Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((vehicle) => (
                  <TableRow key={vehicle.name}>
                    <TableCell>
                      {vehicle.image ? (
                        <Image
                          src={vehicle.image.startsWith("http") ? vehicle.image : getApiUrl(vehicle.image)}
                          alt={vehicle.license_plate}
                          width={40}
                          height={40}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{vehicle.license_plate || "N/A"}</TableCell>
                    <TableCell>{vehicle.make || "N/A"}</TableCell>
                    <TableCell>{vehicle.model || "N/A"}</TableCell>
                    <TableCell>{vehicle.fuel_type || "N/A"}</TableCell>
                    <TableCell>{vehicle.last_odometer || 0}</TableCell>
                    <TableCell>{vehicle.location || "N/A"}</TableCell>
                    <TableCell>{vehicle.employee || "N/A"}</TableCell>
                    <TableCell>₹{vehicle.vehicle_value?.toFixed(2) || "0.00"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


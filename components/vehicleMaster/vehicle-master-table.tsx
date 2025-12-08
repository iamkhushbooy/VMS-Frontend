"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog"
import { Search, Loader2, Car } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export interface VehicleRecord {
  name: string
  license_plate: string
  make: string
  model: string
  location: string
  employee: string
  fuel_type: string
  last_odometer: number
  image: string | null
}

interface VehicleTableProps {
  onAddVehicle: () => void
  onSelectVehicle: (record: VehicleRecord) => void
}

import { getApiUrl, config } from "@/lib/config"
const DOCTYPE_NAME = "Vehicle Master"

export default function VehicleMasterTable({ onAddVehicle, onSelectVehicle }: VehicleTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<VehicleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)

  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchFrappeData = useCallback(async () => {
    setIsLoading(true)
    try {
      const fieldsToFetch = [
        "name", "license_plate", "make", "model",
        "location", "employee", "fuel_type", "last_odometer", "image"
      ]

      const url = `${getApiUrl(config.api.resource(DOCTYPE_NAME))}?fields=${encodeURIComponent(
        JSON.stringify(fieldsToFetch)
      )}&limit_page_length=2000`

      const response = await fetch(url, { credentials: "include" })

      const result = await response.json()
      setRecords(result.data || [])
      setSelectedNames([])

    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFrappeData()
  }, [fetchFrappeData])

  const filteredRecords = records.filter((r) =>
    `${r.license_plate} ${r.make} ${r.model} ${r.location} ${r.employee}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const toggleRowSelection = (name: string, checked: boolean) => {
    setSelectedNames((prev) =>
      checked ? [...new Set([...prev, name])] : prev.filter((n) => n !== name)
    )
  }

  const allVisibleSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedNames.includes(r.name))

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedNames(checked ? filteredRecords.map((r) => r.name) : [])
  }
  const handleBulkDelete = async () => {
    if (selectedNames.length === 0) {
      alert("Please select at least one record.")
      return
    }

    if (!window.confirm(`Are you sure you want to DELETE ${selectedNames.length} vehicle(s)?`))
      return

    try {
      setIsActionLoading(true)

      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include",
      })
      const tokenResult = await tokenResp.json()
      const csrfToken = tokenResult.message

      const formData = new FormData()
      formData.append("names", JSON.stringify(selectedNames))

      const res = await fetch(
        getApiUrl(config.api.method("vms.api.bulk_delete_vehicle_master")),
        {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: {
            "X-Frappe-CSRF-Token": csrfToken
          }
        }
      )

      const data = await res.json()

      if (!res.ok || data.exc) {
        alert("Failed to delete.")
        return
      }

      alert("Selected vehicles deleted successfully.")
      await fetchFrappeData()

    } catch (error) {
      console.error(error)
      alert("Something went wrong.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith("http")) return path
    return getApiUrl(path)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk buttons */}
        <div className="flex gap-2 flex-wrap">

          <Button
            variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={handleBulkDelete}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>

          <Button onClick={onAddVehicle} className="glow-button-pink text-white">
            + Add Vehicle
          </Button>
        </div>

      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => handleToggleSelectAll(checked === true)}
                />
              </TableHead>

              <TableHead>Image</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Make & Model</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Fuel Type</TableHead>
              <TableHead className="text-right">Odometer</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow
                  key={record.name}
                  className="cursor-pointer hover:bg-white/5"
                  onClick={(e) => {
                    const t = e.target as HTMLElement
                    if (t.closest("input")) return
                    onSelectVehicle(record)
                  }}
                >
                  {/* Row checkbox */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedNames.includes(record.name)}
                      onCheckedChange={(checked) =>
                        toggleRowSelection(record.name, checked === true)
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <div
                      className="w-10 h-10 rounded-md overflow-hidden bg-white/5 border flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (record.image) setPreviewImage(getImageUrl(record.image))
                      }}
                    >
                      {record.image ? (
                        <img
                          src={getImageUrl(record.image)!}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Car className="w-5 h-5 text-muted-foreground/50" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell>{record.license_plate}</TableCell>
                  <TableCell>{record.make} {record.model}</TableCell>
                  <TableCell>{record.location}</TableCell>
                  <TableCell>{record.employee}</TableCell>
                  <TableCell>{record.fuel_type}</TableCell>
                  <TableCell className="text-right">{record.last_odometer}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  No vehicles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {previewImage && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">

              <div className="relative bg-white rounded-2xl shadow-2xl p-4 max-w-4xl w-full mx-4">

                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-4 right-4 bg-red-500 text-white text-sm px-3 py-1 rounded-md shadow hover:bg-red-600"
                >
                  Close
                </button>

                <img
                  src={previewImage}
                  className="w-full h-[600px] object-cover rounded-xl shadow-lg"
                />
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

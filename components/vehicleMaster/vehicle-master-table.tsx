"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Search, Loader2, Car } from "lucide-react"

// Interface matching the fields from your screenshot
export interface VehicleRecord {
  name: string // This is usually the License Plate in Frappe or an ID
  license_plate: string
  make: string
  model: string
  location: string
  employee: string // Driver/Operator
  fuel_type: string
  last_odometer: number
  image: string | null // Added image field
}

interface VehicleTableProps {
  onAddVehicle: () => void
  onSelectVehicle: (record: VehicleRecord) => void
}

const FRAPPE_BASE_URL = "http://localhost:8000"
const DOCTYPE_NAME = "Vehicle Master"

export default function VehicleMasterTable({ onAddVehicle, onSelectVehicle }: VehicleTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<VehicleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchFrappeData = useCallback(async () => {
    setIsLoading(true)

    try {
      // Added "image" to the fetch list
      const fieldsToFetch = [
        "name", "license_plate", "make", "model", 
        "location", "employee", "fuel_type", "last_odometer", "image"
      ]
      const fieldsParam = encodeURIComponent(JSON.stringify(fieldsToFetch))
      const url = `${FRAPPE_BASE_URL}/api/resource/${DOCTYPE_NAME}?fields=${fieldsParam}&limit_page_length=2000`
      
      const response = await fetch(url, {
        credentials: "include", 
      })

      if (response.status === 403 || response.status === 401) {
        alert("Session expired. Please login again.")
        window.location.href = "/" 
        return
      }

      if (!response.ok) throw new Error(`Frappe API Error: ${response.status}`)

      const result = await response.json()
      const data = result.data || []
      setRecords(data) 
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      window.location.href = "/"
      return
    }
    fetchFrappeData()
  }, [fetchFrappeData])

  const filteredRecords = records.filter(
    (r) =>
      r.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employee?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${FRAPPE_BASE_URL}${path}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by plate, make, model, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card text-foreground placeholder:text-muted-foreground focus:bg-white/10"
          />
        </div>
        <Button onClick={onAddVehicle} className="glow-button-pink text-white font-semibold">
          + Add Vehicle
        </Button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-primary font-semibold w-[80px]">Image</TableHead>
              <TableHead className="text-primary font-semibold">License Plate</TableHead>
              <TableHead className="text-primary font-semibold">Make & Model</TableHead>
              <TableHead className="text-primary font-semibold">Location</TableHead>
              <TableHead className="text-primary font-semibold">Employee</TableHead>
              <TableHead className="text-primary font-semibold">Fuel Type</TableHead>
              <TableHead className="text-primary font-semibold text-right">Odometer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin inline text-primary" /> 
                  <span className="text-muted-foreground">Loading vehicles...</span>
                </TableCell>
              </TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow
                  key={record.name}
                  className="table-row-hover border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => onSelectVehicle(record)}
                >
                  <TableCell>
                    <div 
                      className="w-10 h-10 rounded-md overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center cursor-zoom-in hover:ring-2 hover:ring-primary/50 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (record.image) setPreviewImage(getImageUrl(record.image));
                      }}
                    >
                      {record.image ? (
                        <img 
                          src={getImageUrl(record.image)!} 
                          alt={record.license_plate}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <Car className="w-5 h-5 text-muted-foreground/50" />
                      )}
                      {/* Fallback icon if image fails to load but URL exists */}
                      <Car className="w-5 h-5 text-muted-foreground/50 hidden" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-medium">{record.license_plate}</TableCell>
                  <TableCell>{record.make} {record.model}</TableCell>
                  <TableCell>{record.location}</TableCell>
                  <TableCell>{record.employee}</TableCell>
                  <TableCell>{record.fuel_type}</TableCell>
                  <TableCell className="font-mono text-right">{record.last_odometer?.toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No vehicles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none flex justify-center items-center">
          <DialogTitle className="sr-only">Vehicle Image Preview</DialogTitle>
          {previewImage && (
            <div className="relative rounded-lg overflow-hidden shadow-2xl bg-black/50">
              <img 
                src={previewImage} 
                alt="Full Preview" 
                className="max-h-[85vh] w-auto max-w-full object-contain"
              />
              <Button 
                variant="secondary" 
                size="sm" 
                className="absolute top-2 right-2 rounded-full opacity-70 hover:opacity-100"
                onClick={() => setPreviewImage(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
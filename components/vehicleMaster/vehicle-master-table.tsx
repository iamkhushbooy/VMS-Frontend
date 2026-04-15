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
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Search,
  Loader2,
  Car, Download
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import { getApiUrl, config } from "@/lib/config"
import { getErrorMessage } from "@/lib/errorMessage"
import CustomAlert from "../alert/alert"
import { AlertButton } from "../alert/types"
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface VehicleRecord {
  name: string
  license_plate: string
  make: string
  model: string
  warehouse: string
  employee: string
  fuel_type: string
  last_odometer: number
  image: string | null
}

interface VehicleTableProps {
  onAddVehicle: () => void
  onSelectVehicle: (record: VehicleRecord) => void
}

const DOCTYPE_NAME = "Vehicle Master"

export default function VehicleMasterTable({ onAddVehicle, onSelectVehicle }: VehicleTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<VehicleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });
  const showAlert = (title: string, message: string, buttons?: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: "OK", style: "cancel" }],
    });
  };
  const closeAlert = () => {
    setAlertState((p) => ({ ...p, visible: false }));
  };

  const fetchFrappeData = useCallback(async () => {
    setIsLoading(true)
    try {
      const fieldsToFetch = [
        "name", "license_plate", "make", "model",
        "warehouse", "employee", "fuel_type", "last_odometer", "image"
      ]

      const params = new URLSearchParams({
        fields: JSON.stringify(fieldsToFetch),
        limit_page_length: "2000",
        order_by: "modified desc"
      })

      const url = `${getApiUrl(config.api.resource(DOCTYPE_NAME))}?${params.toString()}`

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
    r.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.warehouse && r.warehouse.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.employee && r.employee.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const ITEMS_PER_PAGE = 50
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)

  const paginatedRecords = filteredRecords.slice(
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
    paginatedRecords.length > 0 &&
    paginatedRecords.every((r) => selectedNames.includes(r.name))

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedNames(checked ? paginatedRecords.map((r) => r.name) : [])
  }

  const executeBulkDelete = async () => {
    try {
      setIsActionLoading(true);
      const tokenResp = await axios.get(getApiUrl(config.api.getCsrfToken), {
        withCredentials: true,
      });
      const csrfToken = tokenResp.data.message;

      // Step 2: Prepare Payload
      const formData = new FormData();
      formData.append("names", JSON.stringify(selectedNames));
      const res = await axios.post(
        getApiUrl(config.api.method("vms.api.bulk_delete_vehicle_master")),
        formData,
        {
          withCredentials: true,
          headers: {
            "X-Frappe-CSRF-Token": csrfToken,
            "Accept": "application/json",
          },
        }
      );

      // Success logic (Sirf tab chalega jab status 2xx hoga)
      showAlert("Success", "Selected vehicles deleted successfully.", [
        {
          text: "OK",
          onPress: async () => {
            setSelectedNames([]);
            await fetchFrappeData();
          }
        }
      ]);

    } catch (err) {
      const errorMsg = getErrorMessage(err);

      showAlert("Action Failed", errorMsg, [{ text: "OK", style: "destructive" }]);
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleBulkDelete = async () => {
    // 1. Check selection
    if (selectedNames.length === 0) {
      showAlert("Selection Required", "Please select at least one record to delete.");
      return;
    }

    // 2. Elegant Confirmation
    showAlert(
      "Confirm Delete",
      `Are you sure you want to PERMANENTLY DELETE ${selectedNames.length} vehicle(s)?`,
      [
        { text: "No, Cancel", style: "cancel" },
        {
          text: "Yes, Delete All",
          style: "destructive", // Red button logic
          onPress: () => executeBulkDelete()
        }
      ]
    );
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    if (path.startsWith("http")) return path
    return getApiUrl(path)
  }

  const handleExportExcel = () => {
    try {
      // 1. तय करें कि कौन सा डेटा एक्सपोर्ट करना है
      let dataToExport = [];

      if (selectedNames.length > 0) {
        // अगर चेकबॉक्स सेलेक्ट किए गए हैं, तो सिर्फ सिलेक्टेड डेटा लें
        dataToExport = records.filter((r) => selectedNames.includes(r.name));
      } else {
        // अगर कोई चेकबॉक्स सेलेक्ट नहीं है, तो पूरा (सर्च किया हुआ) डेटा लें
        dataToExport = filteredRecords;
      }

      if (dataToExport.length === 0) {
        showAlert("No Data", "Don't have data for export.");
        return;
      }

      // 2. Data prepare करें (Vehicle Master टेबल के हिसाब से कॉलम)
      const exportData = dataToExport.map((record) => ({
        "License Plate": record.license_plate,
        "Make": record.make,
        "Model": record.model,
        "Warehouse": record.warehouse,
        "Employee": record.employee,
        "Fuel Type": record.fuel_type,
        "Odometer": record.last_odometer,
      }));

      // 3. Excel Workbook बनाएं
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Master");

      // 4. Buffer जनरेट करें
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

      // 5. Blob बनाकर saveAs से डाउनलोड करें
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      // फाइल का नाम
      const fileName = `Vehicle_Master_${new Date().toISOString().split("T")[0]}.xlsx`;
      saveAs(data, fileName);
    } catch (error) {
      console.error("Export Error:", error);
      showAlert("Export Failed", "There is an issue generating excel file.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by warehouse, License Plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

        <div className="flex gap-6 flex-wrap items-center">
          {selectedNames.length > 0 && (
            <span className="text-sm text-muted-foreground mr-2">
              {selectedNames.length} selected
            </span>
          )}

          <Button
            variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={handleBulkDelete}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>

          <Button onClick={onAddVehicle} className="cursor-pointer glow-button-pink text-white">
            + Add Vehicle
          </Button>
          <Button
            onClick={handleExportExcel}
            className="glow-button-pink text-white font-semibold"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>

      </div>

      <div className="glass-card overflow-hidden rounded-md border flex flex-col border-white/10">
        <div className="overflow-x-auto">
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
                <TableHead>Warehouse</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead className="text-right">Odometer</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="h-16">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedRecords.length > 0 ? (
                paginatedRecords.map((record) => (
                  <TableRow
                    key={record.name}
                    className="cursor-pointer hover:bg-white/5"
                    onClick={(e) => {
                      const t = e.target as HTMLElement
                      if (t.closest("input") || t.closest("button") || t.closest('[role="checkbox"]')) return
                      onSelectVehicle(record)
                    }}
                  >
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
                        className="w-10 h-10 rounded-md overflow-hidden bg-white/5 border flex items-center justify-center cursor-zoom-in group"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (record.image) setPreviewImage(getImageUrl(record.image))
                        }}
                      >
                        {record.image ? (
                          <img
                            src={getImageUrl(record.image)!}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            alt="Vehicle"
                          />
                        ) : (
                          <Car className="w-5 h-5 text-muted-foreground/50" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">{record.license_plate}</TableCell>
                    <TableCell>{record.make} {record.model}</TableCell>
                    <TableCell>{record.warehouse}</TableCell>
                    <TableCell>{record.employee}</TableCell>
                    <TableCell>{record.fuel_type}</TableCell>
                    <TableCell className="text-right">{record.last_odometer}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No vehicles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {previewImage && (
            <div className="relative w-full flex flex-col items-center">
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-h-[80vh]">
                <img
                  src={previewImage}
                  className="w-full h-auto object-contain max-h-[80vh]"
                  alt="Preview"
                />
              </div>
              <Button
                onClick={() => setPreviewImage(null)}
                className="mt-4 bg-white text-black hover:bg-gray-100"
              >
                Close Preview
              </Button>
            </div>
          )}
        </DialogContent>
        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          onClose={closeAlert}
        />
      </Dialog>
    </div>
  )
}
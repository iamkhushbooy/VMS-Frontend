"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Download } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { getErrorMessage } from "@/lib/errorMessage"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import CustomAlert from "../alert/alert"
import { AlertButton } from "../alert/types"
import { getApiUrl, config } from "@/lib/config"
import * as XLSX from 'xlsx'; 
import { saveAs } from 'file-saver'; 
export interface MaintenanceLog {
  name: string
  company?: string
  warehouse?: string
  issuer_name: string
  job_cards_type?: string
  priority_level: string
  registration_no?: string
  license_plate: string // UI backwards compatibility
  current_odometer_value?: string
  status: string
  date_and_time_of_job_initiation?: string
  date_and_time_of_job_completion?: string
  ptw_no?: string
  jsajratool_box_task?: string
  house_keeping_after_shift_work?: string
  working_employee: string[] // UI Array expect kar raha hai
  
  // Child 1, 2, 3
  problem_details?: string
  work_done_details?: string
  pending_jobsbacklog_details?: string
  
  // Child 4: Vehicle Service
  item_name?: string
  item_group?: string
  stock_qty?: number | string
  qty?: number | string
  uom?: string
  rate?: number | string
  expense?: number | string
  remark?: string

  // Child 5: Lube Details
  lube_item_name?: string
  lube_item_group?: string
  lube_stock_qty?: number | string
  lube_qty?: number | string
  lube_uom?: string
  lube_rate?: number | string
  lube_expense?: number | string
  lube_remark?: string

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

  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)

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

  const router = useRouter()
  // const fetchMaintenanceLogs = useCallback(async () => {
  //   setIsLoading(true)
  //   try {
  //     const url = getApiUrl(config.api.method("vms.api.get_maintenance_logs_with_details"))
  //     const resp = await fetch(url, { credentials: "include" })
  //     const json = await resp.json()

  //     const fixed = (json.message || []).map((log: any) => ({
  //       ...log,
  //       docstatus: log.docstatus ?? 0,
  //     }))
  //     fixed.sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
  //     setLogs(fixed)
  //     setSelectedNames([])
  //   } catch (e) {
  //     console.error(e)
  //     setLogs([])
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }, [])
const fetchMaintenanceLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = getApiUrl(config.api.method("vms.api.get_vehicle_log_master_data"))
      const resp = await fetch(url, { credentials: "include" })
      
      if (resp.status === 401) {
        showAlert(
          "Session Expired",
          "Your session has timed out. Please log in again to continue.",
          [{ text: "Log In", style: "default", onPress: () => router.push('/login') }]
        );
        return;
      }

      if (resp.status === 403) {
        showAlert("Permission Denied", "You do not have the required permissions.", [{ text: "Close", style: "cancel" }]);
        setLogs([]);
        return;
      }
      if (!resp.ok) throw new Error(`Frappe API Error: ${resp.status}`)
      
      const json = await resp.json()
      console.log("Backend Response:", json);
      
      let rawData = [];
      if (json.message && json.message.status === "error") {
        showAlert("Backend Error", json.message.message);
        setLogs([]);
        return;
      }
      
      if (Array.isArray(json.message)) {
        rawData = json.message;
      } 
      else if (json.message && json.message.message && Array.isArray(json.message.message)) {
        rawData = json.message.message;
      } else {
        console.warn("No valid array found in response");
      }

      const fixed = rawData.map((log: any) => {
        let employeesArray: string[] = [];
        
        // FIX 1: Backend ab 'employee' bhej raha hai 'working_employee' nahi
        const empData = log.employee; 

        if (Array.isArray(empData)) {
          employeesArray = empData;
        } else if (typeof empData === "string" && empData.trim() !== "") {
          employeesArray = empData.split(",").map((s: string) => s.trim()).filter(Boolean);
        }

        return {
          ...log,
          // FIX 2: docstatus ab properly map hoga kyunki SQL se aayega
          docstatus: log.docstatus ?? 0,
          // FIX 3: Backend directly 'license_plate' bhej raha hai
          license_plate: log.license_plate || "",
          working_employee: employeesArray,
        };
      })
      
      setLogs(fixed)
      setSelectedNames([])
    } catch (e) {
      console.error("Error fetching logs:", e)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchMaintenanceLogs()
  }, [fetchMaintenanceLogs, refreshTrigger])

  const filtered = logs.filter(
    (log) =>
      log.issuer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ITEMS_PER_PAGE = 50
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const paginatedLogs = filtered.slice(
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
    paginatedLogs.length > 0 &&
    paginatedLogs.every((r) => selectedNames.includes(r.name))

  const handleToggleSelectAll = (checked: boolean) => {
    setSelectedNames(checked ? paginatedLogs.map((r) => r.name) : [])
  }

  const executeBulkAction = async (action: "cancel" | "delete") => {
    try {
      setIsActionLoading(true);

      // 1. Get CSRF Token
      const tokenResp = await fetch(getApiUrl(config.api.getCsrfToken), {
        credentials: "include",
      });
      const tokenJson = await tokenResp.json();
      const csrfToken = tokenJson.message;

      // 2. Prepare Payload
      const formData = new FormData();
      formData.append("names", JSON.stringify(selectedNames));

      const method =
        action === "cancel"
          ? "vms.api.bulk_cancel_maintenance"
          : "vms.api.bulk_delete_maintenance";

      // 3. API Request
      const res = await fetch(getApiUrl(config.api.method(method)), {
        method: "POST",
        credentials: "include",
        headers: { "X-Frappe-CSRF-Token": csrfToken },
        body: formData,
      });

      const json = await res.json();

      // 4. Handle Result
      if (!res.ok || json.exc) {
        showAlert("Error", "Action failed.");
        return;
      }

      // Success Alert
      const successMsg = action === "cancel" ? "Cancelled successfully." : "Deleted successfully.";
      showAlert("Success", successMsg, [
        {
          text: "OK",
          style: "default",
          onPress: () => fetchMaintenanceLogs()
        }
      ]);
    } catch (error) {
      showAlert("Error", getErrorMessage(error));
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const handleBulkAction = async (action: "cancel" | "delete") => {
    // 1. Check if selection is empty
    if (selectedNames.length === 0) {
      showAlert("Error", "Please select at least one record.");
      return;
    }

    // 2. Validate cancellation rules (No drafts)
    if (action === "cancel") {
      const draftSelected = logs.filter(
        (log) => selectedNames.includes(log.name) && log.docstatus === 0
      );

      if (draftSelected.length > 0) {
        showAlert(
          "Error",
          "Draft records cannot be cancelled. Only submitted records can be cancelled."
        );
        return;
      }
    }

    // 3. Setup Confirmation Text
    const confirmTitle = action === "cancel" ? "Confirm Cancel" : "Confirm Delete";
    const confirmText =
      action === "cancel"
        ? `Are you sure you want to CANCEL ${selectedNames.length} record(s)?`
        : `Are you sure you want to DELETE ${selectedNames.length} record(s)?`;

    // 4. Trigger Elegant Alert
    showAlert(
      confirmTitle,
      confirmText,
      [
        { text: "No, Go Back", style: "cancel" },
        {
          text: action === "cancel" ? "Yes, Cancel" : "Yes, Delete",
          style: "destructive", // Shows the red warning button
          onPress: () => executeBulkAction(action)
        }
      ]
    );
  };


const handleExportExcel = () => {
    try {
      let dataToExport = [];

      // Determine which data to export (selected or all filtered)
      if (selectedNames.length > 0) {
        dataToExport = logs.filter((log) => selectedNames.includes(log.name));
      } else {
        dataToExport = filtered; // Assumes 'filtered' is defined in your component
      }

      if (dataToExport.length === 0) {
        showAlert("No Data", "Don't have data for export.");
        return;
      }

      // Map the data to include all new fields
      const exportData = dataToExport.map((log) => ({
        // --- Parent DocType Fields ---
        "Log ID / Name": log.name || "",
        "Company": log.company || "",
        "Warehouse": log.warehouse || "",
        "Issuer Name": log.issuer_name || "",
        "Job Cards Type": log.job_cards_type || "",
        "Priority Level": log.priority_level || "",
        "Registration No (License Plate)": log.license_plate || "",
        "Current Odometer Value": log.current_odometer_value || "",
        "Status": log.status || "",
        "Job Initiation Time": log.date_and_time_of_job_initiation || "",
        "Job Completion Time": log.date_and_time_of_job_completion || "",
        "PTW No": log.ptw_no || "",
        "JSA/JRA/Tool Box Task": log.jsajratool_box_task || "",
        "House Keeping After Shift": log.house_keeping_after_shift_work || "",
        "Working Employees": Array.isArray(log.working_employee) ? log.working_employee.join(", ") : "",
        "Doc Status": getDocStatusLabel(log.docstatus || 0),

        // --- Child 1: Problem Details ---
        "Problem Details": log.problem_details || "",

        // --- Child 2: Work Done Details ---
        "Work Done Details": log.work_done_details || "",

        // --- Child 3: Pending Jobs / Backlog ---
        "Pending Jobs/Backlog": log.pending_jobsbacklog_details || "",

        // --- Child 4: Vehicle Service (Parts) ---
        "Parts Item Name": log.item_name || "",
        "Parts Item Group": log.item_group || "",
        "Parts Stock Qty": log.stock_qty || "",
        "Parts Qty": log.qty || "",
        "Parts UOM": log.uom || "",
        "Parts Rate": log.rate || "",
        "Parts Expense": log.expense || "",
        "Parts Remark": log.remark || "",

        // --- Child 5: Lube Details ---
        "Lube Item Name": log.lube_item_name || "",
        "Lube Item Group": log.lube_item_group || "",
        "Lube Stock Qty": log.lube_stock_qty || "",
        "Lube Qty": log.lube_qty || "",
        "Lube UOM": log.lube_uom || "",
        "Lube Rate": log.lube_rate || "",
        "Lube Expense": log.lube_expense || "",
        "Lube Remark": log.lube_remark || "",
      }));

      // Create Worksheet and Workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Log Master");

      // Generate File Buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      // Save File
      const fileName = `Maintenance_Logs_${new Date().toISOString().split("T")[0]}.xlsx`;
      saveAs(data, fileName);
      
    } catch (error) {
      console.error("Export Error:", error);
      showAlert("Export Failed", "There is an issue generating the excel file.");
    }
  };
  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Issuer or Registration No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-6">
          <Button
             variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("cancel")}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel
          </Button>

          <Button
            variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("delete")}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>

          <Button onClick={onNewLog} className="glow-button-pink text-white font-semibold">
            + New Maintenance Log
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

      <div className="glass-card overflow-x-auto rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => handleToggleSelectAll(checked === true)}
                />
              </TableHead>
              <TableHead>Issuer Name</TableHead>
              <TableHead>Registration No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Doc Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin inline" /> Loading...
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No maintenance logs found
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow
                  key={log.name}
                  className="cursor-pointer hover:bg-white/5"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest("input") || target.closest("label")) return
                    onSelectLog(log)
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedNames.includes(log.name)}
                      onCheckedChange={(checked) => toggleRowSelection(log.name, checked === true)}
                    />
                  </TableCell>

                  <TableCell>{log.issuer_name}</TableCell>
                  <TableCell>{log.license_plate}</TableCell>
                  <TableCell>{log.status}</TableCell>
                  <TableCell>{log.priority_level}</TableCell>
                  <TableCell>{log.working_employee.join(", ")}</TableCell>

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
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={closeAlert}
      />
    </div>
  )
}
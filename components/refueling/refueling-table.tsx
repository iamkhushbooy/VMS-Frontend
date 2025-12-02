// "use client"

// import { useState, useEffect, useCallback } from "react"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Search, Loader2 } from "lucide-react"
// import { Checkbox } from "@/components/ui/checkbox"
// import { useRouter } from "next/navigation"

// interface RefuelingRecord {
//   name: string
//   date: string
//   issuer_name: string
//   fuel_item: string
//   company: string
// }

// interface RefuelingTableProps {
//   onLogRefueling: () => void
//   onSelectRecord: (record: RefuelingRecord) => void
// }

// const FRAPPE_BASE_URL = "https://prayog.vaaman.in"
// const DOCTYPE_NAME = "Vehicle Refueling"

// export function RefuelingTable({ onLogRefueling, onSelectRecord }: RefuelingTableProps) {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [records, setRecords] = useState<RefuelingRecord[]>([])
//   const [isLoading, setIsLoading] = useState(true)

//   const [selectedNames, setSelectedNames] = useState<string[]>([])
//   const [isActionLoading, setIsActionLoading] = useState(false)   
//   const router = useRouter()

//   const fetchFrappeData = useCallback(async () => {
//     setIsLoading(true)
//     try {
//       const fieldsToFetch = ["name", "issuer_name", "fuel_item", "company", "date"]
//       const fieldsParam = encodeURIComponent(JSON.stringify(fieldsToFetch))
//       const url = `${FRAPPE_BASE_URL}/api/resource/${DOCTYPE_NAME}?fields=${fieldsParam}&limit_page_length=2000`

//       const response = await fetch(url, { credentials: "include" })

//       if (response.status === 403 || response.status === 401) {
//         alert("Session expired. Please login again.")
//         localStorage.removeItem("isLoggedIn")
//         router.push("/")
//         return
//       }

//       if (!response.ok) throw new Error(`Frappe API Error: ${response.status}`)

//       const result = await response.json()
//       setRecords(result.data || [])
//       setSelectedNames([]) 
//     } catch (error) {
//       console.error("Error fetching data from Frappe:", error)
//       setRecords([])
//     } finally {
//       setIsLoading(false)
//     }
//   }, [router])

//   useEffect(() => {
//     if (!localStorage.getItem("isLoggedIn")) {
//       router.push("/")
//       return
//     }
//     fetchFrappeData()
//   }, [fetchFrappeData, router])

//   const filteredRecords = records.filter(
//     (r) =>
//       r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       r.issuer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       r.fuel_item.toLowerCase().includes(searchTerm.toLowerCase())
//   )

//   const toggleRowSelection = (name: string, checked: boolean) => {
//     setSelectedNames((prev) =>
//       checked ? [...new Set([...prev, name])] : prev.filter((n) => n !== name)
//     )
//   }

//   const allVisibleSelected =
//     filteredRecords.length > 0 &&
//     filteredRecords.every((r) => selectedNames.includes(r.name))

//   const handleToggleSelectAll = (checked: boolean) => {
//     setSelectedNames(checked ? filteredRecords.map((r) => r.name) : [])
//   }

//   // sirf debug ke liye
//   useEffect(() => {
//     if (selectedNames.length > 0) {
//       console.log("Selected records:", selectedNames, "Total:", selectedNames.length)
//     }
//   }, [selectedNames])

//   const handleBulkAction = async (action: "cancel" | "delete") => {
//     if (selectedNames.length === 0) {
//       alert("Please select at least one record.")
//       return
//     }

//     const confirmText =
//       action === "cancel"
//         ? `Are you sure you want to CANCEL ${selectedNames.length} record(s)?`
//         : `Are you sure you want to DELETE ${selectedNames.length} record(s)?`

//     if (!window.confirm(confirmText)) return

//     try {
//       setIsActionLoading(true)
//       const tokenResp = await fetch(`${FRAPPE_BASE_URL}/api/method/vms.api.get_csrf_token`, {
//         credentials: "include",
//       })
//       const tokenResult = await tokenResp.json()
//       const csrfToken = tokenResult.message
//       const formData = new FormData()
//       formData.append("names", JSON.stringify(selectedNames))

//       const methodName =
//         action === "cancel"
//           ? "vms.api.bulk_cancel_refueling"
//           : "vms.api.bulk_delete_refueling"

//       const res = await fetch(`${FRAPPE_BASE_URL}/api/method/${methodName}`, {
//         method: "POST",
//         body: formData,
//         credentials: "include",
//         headers: {
//           "X-Frappe-CSRF-Token": csrfToken,
//         },
//       })

//       const data = await res.json()

//       if (!res.ok || data.exc || data.status === "error") {
//         console.error("Bulk action error:", data)
//         alert(data?.message || "Failed to perform action.")
//         return
//       }

//       alert(
//         action === "cancel"
//           ? "Selected refueling records cancelled successfully."
//           : "Selected refueling records deleted successfully."
//       )

//       await fetchFrappeData()
//     } catch (error) {
//       console.error("Bulk action error:", error)
//       alert("Something went wrong while performing the action.")
//     } finally {
//       setIsActionLoading(false)
//     }
//   }

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//           <Input
//             placeholder="Search by name, issuer, fuel, company"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10 glass-card text-foreground placeholder:text-muted-foreground focus:bg-white/10"
//           />
//         </div>

//         <div className="flex gap-2 flex-wrap">
//           {/* Cancel Selected */}
//           <Button
//             variant="outline"
//             disabled={selectedNames.length === 0 || isActionLoading}
//             onClick={() => handleBulkAction("cancel")}
//           >
//             {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             Cancel
//           </Button>

//           {/* Delete Selected */}
//           <Button
//             variant="destructive"
//             disabled={selectedNames.length === 0 || isActionLoading}
//             onClick={() => handleBulkAction("delete")}
//           >
//             {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             Delete
//           </Button>

//           <Button onClick={onLogRefueling} className="glow-button-pink text-white font-semibold">
//             + Log Refueling
//           </Button>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="glass-card overflow-x-auto rounded-md border border-white/10">
//         <Table>
//           <TableHeader>
//             <TableRow className="border-white/10 hover:bg-white/5">
//               {/* Select All */}
//               <TableHead className="w-10">
//                 <Checkbox
//                   checked={allVisibleSelected}
//                   onCheckedChange={(checked) => handleToggleSelectAll(checked === true)}
//                 />
//               </TableHead>

//               <TableHead className="text-primary font-semibold">Name</TableHead>
//               <TableHead className="text-primary font-semibold">Date</TableHead>
//               <TableHead className="text-primary font-semibold">Company</TableHead>
//               <TableHead className="text-primary font-semibold">Fuel Item</TableHead>
//               <TableHead className="text-primary font-semibold">Issuer Name</TableHead>
//             </TableRow>
//           </TableHeader>

//           <TableBody>
//             {isLoading ? (
//               <TableRow>
//                 <TableCell colSpan={6} className="text-center py-4">
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
//                   Loading...
//                 </TableCell>
//               </TableRow>
//             ) : filteredRecords.length > 0 ? (
//               filteredRecords.map((record) => (
//                 <TableRow
//                   key={record.name}
//                   className="cursor-pointer hover:bg-white/5"
//                   onClick={(e) => {
//                     const target = e.target as HTMLElement
//                     if (target.closest("input") || target.closest("label")) return
//                     onSelectRecord(record)
//                   }}
//                 >
//                   {/* Row checkbox */}
//                   <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
//                     <Checkbox
//                       checked={selectedNames.includes(record.name)}
//                       onCheckedChange={(checked) =>
//                         toggleRowSelection(record.name, checked === true)
//                       }
//                     />
//                   </TableCell>

//                   <TableCell>{record.name}</TableCell>
//                   <TableCell>{record.date}</TableCell>
//                   <TableCell>{record.company}</TableCell>
//                   <TableCell>{record.fuel_item}</TableCell>
//                   <TableCell>{record.issuer_name}</TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
//                   No refueling records found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   )
// }




"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"

interface RefuelingRecord {
  name: string
  date: string
  issuer_name: string
  fuel_item: string
  company: string
  docstatus: 0 | 1 | 2
}

interface RefuelingTableProps {
  onLogRefueling: () => void
  onSelectRecord: (record: RefuelingRecord) => void
  // ⭐ NEW: Prop to trigger re-fetch
  refreshTrigger?: number 
}

const FRAPPE_BASE_URL = "https://prayog.vaaman.in"
const DOCTYPE_NAME = "Vehicle Refueling"

// Status label
const getStatusLabel = (d: number) => {
  if (d === 1) return "Submitted"
  if (d === 2) return "Cancelled"
  return "Draft"
}

// Status colors
const getStatusClass = (d: number) => {
  if (d === 1) return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
  if (d === 2) return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
  return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200"
}

export function RefuelingTable({ onLogRefueling, onSelectRecord, refreshTrigger }: RefuelingTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<RefuelingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [isActionLoading, setIsActionLoading] = useState(false)
  const router = useRouter()

  // Fetch data
  const fetchFrappeData = useCallback(async () => {
    setIsLoading(true)
    try {
      const fieldsToFetch = ["name", "issuer_name", "fuel_item", "company", "date", "docstatus"]
      const fieldsParam = encodeURIComponent(JSON.stringify(fieldsToFetch))

      const url = `${FRAPPE_BASE_URL}/api/resource/${DOCTYPE_NAME}?fields=${fieldsParam}&limit_page_length=2000`

      const response = await fetch(url, { credentials: "include" })

      if (response.status === 403 || response.status === 401) {
        alert("Session expired. Please login again.")
        localStorage.removeItem("isLoggedIn")
        router.push("/")
        return
      }

      if (!response.ok) throw new Error(`Frappe API Error: ${response.status}`)

      const result = await response.json()
      setRecords(result.data || [])
      setSelectedNames([])
    } catch (error) {
      console.error("Error fetching data from Frappe:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // On load OR when refreshTrigger changes
  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      router.push("/")
      return
    }
    fetchFrappeData()
  }, [fetchFrappeData, router, refreshTrigger]) // ⭐ Added refreshTrigger here

  // Filter
  const filteredRecords = records.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.issuer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fuel_item.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Row selection
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

  // Bulk Cancel & Delete
  const handleBulkAction = async (action: "cancel" | "delete") => {
    if (selectedNames.length === 0) {
      alert("Please select at least one record.")
      return
    }

    const confirmText =
      action === "cancel"
        ? `Are you sure you want to CANCEL ${selectedNames.length} record(s)?`
        : `Are you sure you want to DELETE ${selectedNames.length} record(s)?`

    if (!window.confirm(confirmText)) return

    try {
      setIsActionLoading(true)

      const tokenResp = await fetch(`${FRAPPE_BASE_URL}/api/method/vms.api.get_csrf_token`, {
        credentials: "include",
      })
      const tokenJson = await tokenResp.json()
      const csrfToken = tokenJson.message

      const formData = new FormData()
      formData.append("names", JSON.stringify(selectedNames))

      const method =
        action === "cancel"
          ? "vms.api.bulk_cancel_refueling"
          : "vms.api.bulk_delete_refueling"

      const res = await fetch(`${FRAPPE_BASE_URL}/api/method/${method}`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Frappe-CSRF-Token": csrfToken },
        body: formData,
      })

      const json = await res.json()

      if (!res.ok || json.exc) {
        alert("Action failed.")
        return
      }

      alert(action === "cancel" ? "Cancelled successfully." : "Deleted successfully.")
      fetchFrappeData() // Reload after bulk action
    } catch (error) {
      console.error(error)
      alert("Error performing action.")
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, issuer, fuel, company"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card text-foreground placeholder:text-muted-foreground focus:bg-white/10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Cancel Selected */}
          <Button
            variant="outline"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("cancel")}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel
          </Button>

          {/* Delete Selected */}
          <Button
            variant="destructive"
            disabled={selectedNames.length === 0 || isActionLoading}
            onClick={() => handleBulkAction("delete")}
          >
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>

          <Button onClick={onLogRefueling} className="glow-button-pink text-white font-semibold">
            + Log Refueling
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto rounded-md border border-white/10">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => handleToggleSelectAll(checked === true)}
                />
              </TableHead>

              <TableHead className="text-primary font-semibold">Name</TableHead>
              <TableHead className="text-primary font-semibold">Date</TableHead>
              <TableHead className="text-primary font-semibold">Company</TableHead>
              <TableHead className="text-primary font-semibold">Fuel Item</TableHead>
              <TableHead className="text-primary font-semibold">Issuer Name</TableHead>
              <TableHead className="text-primary font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <TableRow
                  key={record.name}
                  className="cursor-pointer hover:bg-white/5"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest("input") || target.closest("label")) return
                    onSelectRecord(record)
                  }}
                >
                  <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedNames.includes(record.name)}
                      onCheckedChange={(checked) =>
                        toggleRowSelection(record.name, checked === true)
                      }
                    />
                  </TableCell>

                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.company}</TableCell>
                  <TableCell>{record.fuel_item}</TableCell>
                  <TableCell>{record.issuer_name}</TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(
                        record.docstatus
                      )}`}
                    >
                      {getStatusLabel(record.docstatus)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  No refueling records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
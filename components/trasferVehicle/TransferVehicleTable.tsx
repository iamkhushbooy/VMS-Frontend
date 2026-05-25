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
import { Search, Loader2, ArrowRight } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

import { getApiUrl, config } from "@/lib/config"

export interface TransferRecord {
  name: string
  registration_no: string
  from_warehouse: string
  to_warehouse: string
  date: string
  employee: string
  creation: string
}

interface TransferTableProps {
  onTransferVehicle: () => void
  onSelectRecord: (record: TransferRecord) => void
}

const DOCTYPE_NAME = "Transfer Vehicle"

export default function TransferVehicleTable({ onTransferVehicle, onSelectRecord }: TransferTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [records, setRecords] = useState<TransferRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFrappeData = useCallback(async () => {
    setIsLoading(true)
    try {
      const fieldsToFetch = [
        "name",
        "registration_no",
        "from_warehouse",
        "to_warehouse",
        "date",
        "employee",
        "creation"
      ]

      const params = new URLSearchParams({
        fields: JSON.stringify(fieldsToFetch),
        limit_page_length: "2000",
        order_by: "creation desc"
      })

      const url = `${getApiUrl(config.api.resource(DOCTYPE_NAME))}?${params.toString()}`

      const response = await fetch(url, { credentials: "include" })
      const result = await response.json()

      setRecords(result.data || [])
    } catch (error) {
      console.error("Error fetching transfer records:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFrappeData()
  }, [fetchFrappeData])

  // Simple search filter
  const filteredRecords = records.filter((r) =>
    (r.registration_no && r.registration_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.from_warehouse && r.from_warehouse.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.to_warehouse && r.to_warehouse.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Pagination Logic (Same as VehicleMasterTable)
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle or warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-card"
          />
        </div>

        <Button onClick={onTransferVehicle} className="cursor-pointer glow-button-pink text-white">
          + Transfer Vehicle
        </Button>
      </div>

      <div className="glass-card overflow-hidden rounded-md border flex flex-col border-white/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary font-semibold">Date</TableHead>
                <TableHead className="text-primary font-semibold">Vehicle No.</TableHead>
                <TableHead className="text-primary font-semibold">From Warehouse</TableHead>
                <TableHead className="text-primary font-semibold">To Warehouse</TableHead>
                <TableHead className="text-primary font-semibold">Employee</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16">
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
                    onClick={() => {
                      // onSelectRecord ko call karna hai jab user kisi row pe click kare, taaki Modal me data dikhe
                      // onSelectRecord(record)
                    }}
                  >
                    <TableCell className="font-mono">
                      {record.date ? new Date(record.date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      }) : "-"}
                    </TableCell>
                    <TableCell className="font-semibold">{record.registration_no}</TableCell>
                    <TableCell
                      className="text-sm text-muted-foreground">{record.from_warehouse || 'N/A'}
                    </TableCell>
                    
                    <TableCell className="text-sm font-medium">{record.to_warehouse}</TableCell>
                    <TableCell>{record.employee || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No vehicle transfers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Container */}
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
    </div>
  )
}
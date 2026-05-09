"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout" 
import { TransferVehicleModal } from "@/components/trasferVehicle/TransferVehicleModal"
import TransferVehicleTable, { TransferRecord } from "@/components/trasferVehicle/TransferVehicleTable" 

export default function TransferVehiclePage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TransferRecord | null>(null)

  const handleTransferVehicle = () => {
    setSelectedRecord(null)
    setIsFormOpen(true)
  }

  const handleSelectRecord = (record: TransferRecord) => {
    setSelectedRecord(record)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedRecord(null)
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Transfer Vehicles</h2>
          <p className="text-muted-foreground">
            Track and manage vehicle movements between different warehouses.
          </p>
        </div>

        <TransferVehicleTable 
          onTransferVehicle={handleTransferVehicle} 
          onSelectRecord={handleSelectRecord} 
        />

        <TransferVehicleModal 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
        />
      </div>
    </AppLayout>
  )
}
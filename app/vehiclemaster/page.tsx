"use client"
import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { VehicleMasterModal } from "@/components/vehicleMaster/vehicle-master-form"
import VehicleMasterTable, { VehicleRecord } from "@/components/vehicleMaster/vehicle-master-table"

export default function VehicleMasterPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<VehicleRecord | null>(null)

  const handleAddVehicle = () => {
    setSelectedRecord(null)
    setIsFormOpen(true)
  }

  const handleSelectVehicle = (record: VehicleRecord) => {
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Vehicle Master</h2>
          <p className="text-muted-foreground">
            Manage your fleet database, including vehicle details, insurance, and specifications.
          </p>
        </div>

        <VehicleMasterTable 
          onAddVehicle={handleAddVehicle} 
          onSelectVehicle={handleSelectVehicle} 
        />

        <VehicleMasterModal 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
          record={selectedRecord} 
        />
      </div>
    </AppLayout>
  )
}
"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { RefuelingTable } from "@/components/refueling/refueling-table"
import { RefuelingFormModal } from "@/components/refueling/refueling-form-modal"

interface RefuelingRecord {
  id: string
  date: string
  registrationNo: string
  fuelQuantity: number
  currentOdometer: number
  fuelConsumption: number
  issuerName: string
}

export default function RefuelingPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<RefuelingRecord | null>(null)

  const handleLogRefueling = () => {
    setSelectedRecord(null)
    setIsFormOpen(true)
  }

  const handleSelectRecord = (record: RefuelingRecord) => {
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Vehicle Refueling</h2>
          <p className="text-muted-foreground">Record and track vehicle fuel consumption and refueling events</p>
        </div>

        <RefuelingTable onLogRefueling={handleLogRefueling} onSelectRecord={handleSelectRecord} />

        <RefuelingFormModal isOpen={isFormOpen} onClose={handleCloseForm} record={selectedRecord} />
      </div>
    </AppLayout>
  )
}

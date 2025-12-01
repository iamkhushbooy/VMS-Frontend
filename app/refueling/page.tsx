"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { RefuelingTable } from "@/components/refueling/refueling-table"
import { RefuelingFormModal } from "@/components/refueling/refueling-form-modal"

// Interface matches what the Table emits and Modal expects (simplified for compatibility)
interface RefuelingRecord {
  name: string
  [key: string]: any
}

export default function RefuelingPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<RefuelingRecord | null>(null)
  
  // ⭐ FIX: Add state to act as a trigger for refreshing the table
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLogRefueling = () => {
    setSelectedRecord(null)
    setIsFormOpen(true)
  }

  const handleSelectRecord = (record: any) => {
    setSelectedRecord(record)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedRecord(null)
  }

  // ⭐ FIX: Function to increment the key, forcing the table to re-fetch
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Vehicle Refueling</h2>
          <p className="text-muted-foreground">Record and track vehicle fuel consumption and refueling events</p>
        </div>

        {/* ⭐ FIX: Pass the refreshTrigger prop */}
        <RefuelingTable 
          onLogRefueling={handleLogRefueling} 
          onSelectRecord={handleSelectRecord} 
          refreshTrigger={refreshKey}
        />

        {/* ⭐ FIX: Pass the onSuccess prop */}
        <RefuelingFormModal 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
          record={selectedRecord}
          onSuccess={handleRefresh}
        />
      </div>
    </AppLayout>
  )
}
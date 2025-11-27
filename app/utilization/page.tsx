"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
// Importing the components generated in this session
// Adjust path if your project structure is different
import { UtilizationReportModal } from "@/components/utilization/utilization-form"
import UtilizationTable, { UtilizationRecord } from "@/components/utilization/utilization-table"

export default function UtilizationPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<UtilizationRecord | null>(null)

  // Opens modal for NEW entry
  const handleLogUtilization = () => {
    setSelectedRecord(null)
    setIsFormOpen(true)
  }

  // Opens modal for EDITING existing entry
  const handleSelectRecord = (record: UtilizationRecord) => {
    setSelectedRecord(record)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedRecord(null)
    // In a real app, you might trigger a table refresh here
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Utilization Reports</h2>
          <p className="text-muted-foreground">
            Track vehicle shifts, HMR, and operational status across plants.
          </p>
        </div>

        <UtilizationTable 
          onLogUtilization={handleLogUtilization} 
          onSelectRecord={handleSelectRecord} 
        />

        <UtilizationReportModal 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
          record={selectedRecord} 
        />
      </div>
    </AppLayout>
  )
}

"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { MaintenanceTable } from "@/components/maintenance/maintenance-table"
import { MaintenanceFormModal } from "@/components/maintenance/maintenance-form-modal"

interface MaintenanceLog {
  name: string
  [key: string]: any
}

export default function MaintenancePage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleNewLog = () => {
    setSelectedLog(null)
    setIsFormOpen(true)
  }

  const handleSelectLog = (log: MaintenanceLog) => {
    setSelectedLog(log)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedLog(null)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Vehicle Maintenance</h2>
          <p className="text-muted-foreground">Manage and track vehicle maintenance and job details</p>
        </div>
        <MaintenanceTable 
          onNewLog={handleNewLog} 
          onSelectLog={handleSelectLog} 
          refreshTrigger={refreshKey}
        />

        <MaintenanceFormModal 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
          log={selectedLog}
          onSuccess={handleRefresh}
        />
      </div>
    </AppLayout>
  )
}

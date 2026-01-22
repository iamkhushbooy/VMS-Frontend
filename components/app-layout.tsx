"use client"

import type React from "react"
import { useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Yahan isOpen={sidebarOpen} pass kiya gaya hai */}
      <Header 
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        isOpen={sidebarOpen} 
      />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-16 md:pl-64 transition-all duration-300">
        {children}
      </main>
    </div>
  )
}
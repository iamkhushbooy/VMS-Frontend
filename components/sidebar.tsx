"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Wrench, Fuel, Car, BarChart,LayoutDashboard,PersonStanding} from "lucide-react" // Added icons
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  // Modernized Styles
  const activeButtonStyle = "bg-cyan-500 text-gray-900 shadow-lg hover:bg-cyan-400" 
  const inactiveButtonStyle = "text-gray-300 hover:bg-gray-800 hover:text-white" 

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/70 z-30 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 w-64 bg-gray-900 transition-transform duration-300 z-40 shadow-2xl",
          "flex flex-col gap-8 p-4", // Increased padding and gap
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex items-center justify-between md:hidden p-2">
          <h2 className="font-bold text-white text-lg">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:bg-gray-800">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="flex flex-col gap-2">
          {/* Dashboard */}
          <Link href="/dashboard" onClick={onClose}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-medium text-base h-11 rounded-lg transition-colors duration-200",
                pathname === "/dashboard" ? activeButtonStyle : inactiveButtonStyle,
              )}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Button>
          </Link>
          {/* vehicle */}
          <Link href="/vehiclemaster" onClick={onClose}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-medium text-base h-11 rounded-lg transition-colors duration-200",
                pathname === "/vehiclemaster" ? activeButtonStyle : inactiveButtonStyle,
              )}
            >
              <PersonStanding className="w-5 h-5 mr-3" />
              Vehicle
            </Button>
          </Link>

          {/* Vehicle Maintenance */}
          <Link href="/maintenance" onClick={onClose}>
            <Button
              variant="ghost" 
              className={cn(
                "w-full justify-start font-medium text-base h-11 rounded-lg transition-colors duration-200",
                pathname === "/maintenance" ? activeButtonStyle : inactiveButtonStyle,
              )}
            >
              <Wrench className="w-5 h-5 mr-3" />
              Vehicle Maintenance
            </Button>
          </Link>
          
          {/* Vehicle Refueling */}
          <Link href="/refueling" onClick={onClose}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-medium text-base h-11 rounded-lg transition-colors duration-200",
                pathname === "/refueling" ? activeButtonStyle : inactiveButtonStyle,
              )}
            >
              <Fuel className="w-5 h-5 mr-3" />
              Vehicle Refueling
            </Button>
          </Link>

          {/* Vehicle Refueling */}
          <Link href="/utilization" onClick={onClose}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-medium text-base h-11 rounded-lg transition-colors duration-200",
                pathname === "/utilization" ? activeButtonStyle : inactiveButtonStyle,
              )}
            >
              <Fuel className="w-5 h-5 mr-3" />
              Utilization Report
            </Button>
          </Link>

          {/* Reports */}
          <Link href="/reports" onClick={onClose}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-medium text-base h-11 rounded-lg transition-colors duration-200",
                pathname === "/reports" ? activeButtonStyle : inactiveButtonStyle,
              )}
            >
              <BarChart className="w-5 h-5 mr-3" />
              Reports
            </Button>
          </Link>
           

        </nav>

        {/* Footer/Pro Section Example */}
        <div className="mt-auto p-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">VMS &copy; 2025</p>
        </div>
      </aside>
    </>
  )
}
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation" // Added useRouter
import { X, Wrench, Fuel, Car, BarChart, LayoutDashboard, PersonStanding, LogOut } from "lucide-react" // Added LogOut icon
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getApiUrl, config } from "@/lib/config" // Import your config helpers
import { getFrappeCSRF } from "@/lib/csrf"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter() // Initialize router
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Logout Logic for Mobile/Tablet
  const handleLogout = async () => {
    try {
      const csrf = await getFrappeCSRF();
      const LOGOUT_URL = getApiUrl(config.api.logout);
      const response = await fetch(LOGOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          "X-Frappe-CSRF-Token": csrf
        },
      });
      
      if (response.ok) {
        onClose(); // Close sidebar before navigating
        router.push("/Login");
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  if (!isMounted) return null

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
          "flex flex-col gap-8 p-4",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >


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

          {/* Vehicle */}
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

          {/* Maintenance */}
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
          
          {/* Refueling */}
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

          {/* Utilization Report */}
          <Link href="/utilization" onClick={onClose}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start font-medium text-base h-11 rounded-lg transition-colors duration-200",
                pathname === "/utilization" ? activeButtonStyle : inactiveButtonStyle,
              )}
            >
              <BarChart className="w-5 h-5 mr-3" />
              Utilization Report
            </Button>
          </Link>

          {/* Logout Button - Mobile/Tablet Only */}
          <div className="md:hidden pt-4 mt-2 border-t border-gray-800">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start font-medium text-base h-11 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              LogOut
            </Button>
          </div>
        </nav>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">VMS &copy; 2025</p>
        </div>
      </aside>
    </>
  )
}
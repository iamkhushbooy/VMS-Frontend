"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
// 1. 'X' icon ko import kiya
import { Menu, KeyRound, LogOut, X } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getApiUrl, config } from "@/lib/config"
import { getFrappeCSRF } from "@/lib/csrf"

interface HeaderProps {
  onSidebarToggle: () => void
  isOpen: boolean // 2. Naya prop add kiya check karne ke liye
}

export function Header({ onSidebarToggle, isOpen }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter();

  const handleLogout = async () => {
    const csrf = await getFrappeCSRF();
    const LOGOUT_URL = getApiUrl(config.api.logout);
    const response = await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        "X-Frappe-CSRF-Token": csrf
      },
    });
    const res = await response.json()

    response.ok && router.push("/Login");
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900/80 border-b border-white/10 flex items-center justify-between px-6 z-40 backdrop-blur-md shadow-lg">
      
      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8">
          <Image src="/vms/vaaman_logo.png" alt="VMS" width={32} height={32} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wider">
          Vehicle Management <span className="text-cyan-400">System</span>
        </h1>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-3">
        <Button 
          onClick={handleLogout}
          variant="default"
          className="hidden md:flex bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-md transition-all text-sm h-9"
        >
          <LogOut className="w-4 h-4 mr-2" />
          LogOut
        </Button>

        {/* Menu/Cross Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onSidebarToggle} 
          className="md:hidden text-white hover:bg-white/10 transition"
          >
          {/* 3. Agar isOpen true hai toh X dikhao, varna Menu */}
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>
    </header>
  )
}

export default Header
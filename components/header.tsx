"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, KeyRound, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getApiUrl, config } from "@/lib/config"
import { getFrappeCSRF } from "@/lib/csrf"
interface HeaderProps {
  onSidebarToggle: () => void
}
export function Header({ onSidebarToggle }: HeaderProps) {
  const pathname = usePathname()
  const router=useRouter();
  const handleLogout = async() => {
  const csrf=await getFrappeCSRF();
  const LOGOUT_URL = getApiUrl(config.api.logout); 
      const response = await fetch(LOGOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          "X-Frappe-CSRF-Token": csrf
        },
        
      });
      const res=await response.json()
      console.log("logout check",res);
      
      response.ok && router.push("/Login");
      
  }
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gray-900/80 border-b border-white/10 flex items-center justify-between px-6 z-40 backdrop-blur-md shadow-lg">
      
      {/* Logo and Title Section (Left) */}
      <div className="flex items-center gap-4">
        {/* Toggle Button for Mobile */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onSidebarToggle} 
          className="md:hidden text-white hover:bg-white/10 transition"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo and Title */}
        <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full overflow-hidden shadow-md">
          <Image src="/vms/vaaman_logo.png" alt="VMS" width={32} height={32} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wider">
            Vehicle Management <span className="text-cyan-400">System</span>
          </h1>
        </div>
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex items-center gap-3">
        {/* Change Password */}
        {/* <Link href="/change-password" className="hidden sm:block">
          <Button 
            variant="ghost" 
            className="text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </Link> */}
        
        {/* Login/Logout */}
          <Button onClick={handleLogout}
            variant="default" // Primary action button style
            className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold shadow-md transition-all text-sm h-9"
          >
            <LogOut className="w-4 h-4 mr-2" />
            LogOut
          </Button>
      </div>
    </header>
  )
}

export default Header
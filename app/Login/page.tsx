"use client"
import { useState } from "react"
import { Car, Lock, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const FRAPPE_BASE_URL = "http://localhost:8000"

function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const LOGIN_URL = `${FRAPPE_BASE_URL}/api/method/login`

      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          usr: email,
          pwd: password,
        }).toString(),
        credentials: "include", 
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Login successful:", data)

        if (data.message === "Logged In") {
          localStorage.setItem("isLoggedIn", "true")
          router.push("/refueling")
        } else {
          setError("Unexpected response from server.")
        }
      } else {
        let msg = "Login failed. Please check credentials."
        try {
          const errorData = await response.json()
          if (errorData.message && typeof errorData.message === "string") {
            msg = errorData.message.replace(/[\n\r]/g, " ")
          }
        } catch {}
        setError(msg)
      }
    } catch (err) {
      console.error("Network error:", err)
      setError("Could not connect to the server. Check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div
        className={cn(
          "w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8",
          "border border-gray-200 dark:border-gray-700"
        )}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center text-cyan-500">
            <Car className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Vehicle Management System
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to continue to your VMS dashboard.
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
              Email / Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-11 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-700">
              {error}
            </div>
          )}

          {/* Login Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full h-11 font-semibold text-base transition-colors duration-200",
              "bg-cyan-500 hover:bg-cyan-600 text-gray-900 shadow-lg",
              isLoading && "bg-cyan-400/80 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </span>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
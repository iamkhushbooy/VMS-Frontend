"use client"
import { useState } from "react"
import { Car, Lock, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuthStore } from "@/context/auth_store"
import { getApiUrl, config } from "@/lib/config"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

const handleLogin = async (e:any) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    const LOGIN_URL = getApiUrl(config.api.login);

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
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (data.message?.full_name || data.message === "Logged In") {
      // Get logged-in user's identity (email)
      const url = getApiUrl(config.api.getLoggedUser);
      const userRes = await fetch(url, { credentials: "include" });
      const userInfo = await userRes.json();

      const loggedEmail = userInfo.message;

      useAuthStore.getState().setUser({
        email: loggedEmail,
        full_name: data.message?.full_name || "",
      });

      router.push("/refueling");
    } else {
      setError(data.message || "Invalid username or password");
    }
  } catch (error) {
    console.error("Login error:", error);
    setError("Server not reachable. Try later.");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div
        className={cn(
          "w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8",
          "border border-gray-200 dark:border-gray-700"
        )}
      >
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center text-cyan-500">
            <Image src="/vms/vaaman_logo.png" alt="VMS" width={32} height={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Vehicle Management System
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to continue to your VMS dashboard.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Email / Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <Input
                placeholder="Enter email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 font-semibold bg-cyan-500 hover:bg-cyan-600 dark:text-black"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
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
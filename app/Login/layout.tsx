'use client'
import type React from "react"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/checkAuth";
import { Loader2 } from "lucide-react";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const router = useRouter();
    const [isNotAuthenticated, setIsNotAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        async function authenticate() {
            const auth = await checkAuth();
            console.log('hello2 (Login check)', auth);

            if (auth) {
                router.push("/dashboard");
            } else {
                setIsNotAuthenticated(true);
            }
        }

        authenticate();
    }, [router]);

    if (isNotAuthenticated === null) {

        return <div className="bg-blue-50 w-full h-screen border border-blue-200 rounded-lg p-4 flex items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-800">Checking Authentication...</span>
        </div>
    }

    if (isNotAuthenticated === true) {
        return <>{children}</>;
    }
    return null;
}
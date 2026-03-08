"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Gift, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMe, logout } from "@/lib/api"
import { NotificationBell } from "@/components/notification-bell"

interface User {
    id: string
    email: string
    name: string
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        getMe()
            .then(setUser)
            .catch(() => {
                router.replace("/login")
            })
            .finally(() => setLoading(false))
    }, [router])

    async function handleLogout() {
        try {
            await logout()
        } catch {
            // clear token even if request fails
        }
        localStorage.removeItem("token")
        router.replace("/login")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <nav className="mx-auto flex max-width-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                    <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                        <span className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                            Wishly
                        </span>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">
                            {user.name}
                        </span>
                        <NotificationBell />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-muted-foreground hover:text-foreground h-8 sm:h-9 px-2 sm:px-3 gap-1.5"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Log out</span>
                        </Button>
                    </div>
                </nav>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
    )
}

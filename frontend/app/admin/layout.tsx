"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    ListOrdered,
    BarChart3,
    ChevronLeft,
    Loader2,
    ShieldCheck
} from "lucide-react"
import { getMe } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        async function checkAdmin() {
            try {
                const user = await getMe()
                if (!user.is_admin) {
                    router.push("/dashboard")
                    return
                }
                setIsAdmin(true)
            } catch {
                router.push("/login")
            } finally {
                setLoading(false)
            }
        }
        checkAdmin()
    }, [router])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-muted-foreground animate-pulse">Verifying admin access...</p>
            </div>
        )
    }

    if (!isAdmin) return null

    const navItems = [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Wishlists", href: "/admin/wishlists", icon: ListOrdered },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ]

    return (
        <div className="flex flex-col gap-8">
            {/* Admin Header */}
            <div className="flex items-center justify-between border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                        <h1 className="font-serif text-2xl text-foreground">Admin Control</h1>
                        <p className="text-sm text-muted-foreground">System-wide management</p>
                    </div>
                </div>

                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Nav */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-foreground text-background"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    )
}

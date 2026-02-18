"use client"

import { useEffect, useState } from "react"
import {
    Users,
    ListOrdered,
    Eye,
    Heart,
    TrendingUp,
    Loader2,
    ArrowUpRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminStats, type AdminStats } from "@/lib/api"
import Link from "next/link"

export default function AdminOverview() {
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getAdminStats()
                setStats(data)
            } catch (err) {
                console.error("Failed to load admin stats", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const statCards = [
        {
            label: "Total Users",
            value: stats?.total_users || 0,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            detail: `${stats?.new_users_30d || 0} in last 30d`
        },
        {
            label: "Total Wishlists",
            value: stats?.total_wishlists || 0,
            icon: ListOrdered,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            detail: "All time"
        },
        {
            label: "Total Views",
            value: stats?.total_views || 0,
            icon: Eye,
            color: "text-accent",
            bg: "bg-accent/10",
            detail: "Across all wishlists"
        },
        {
            label: "Total Likes",
            value: stats?.total_likes || 0,
            icon: Heart,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            detail: "Unique engagements"
        },
    ]

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="border-border bg-card/50 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.label}
                            </CardTitle>
                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("h-4 w-4", stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                {stat.detail}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">System Health</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                        Analytics visualization coming soon
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Link href="/admin/promoted" className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left group">
                            <span className="text-sm font-medium">Manage Featured Items</span>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </Link>
                        <Link href="/admin/promoted/wishlists" className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left group">
                            <span className="text-sm font-medium">Manage Curated Collections</span>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </Link>
                        <button className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left group">
                            <span className="text-sm font-medium">Verify Migration</span>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </button>
                        <button className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left group">
                            <span className="text-sm font-medium">System Backups</span>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}

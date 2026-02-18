"use client"

import { useEffect, useState } from "react"
import {
    BarChart3,
    Loader2,
    TrendingUp,
    ListOrdered,
    Eye,
    Calendar
} from "lucide-react"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAdminAnalytics, type AdminAnalytics } from "@/lib/api"
import { format, parseISO } from "date-fns"

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AdminAnalytics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const result = await getAdminAnalytics()
                setData(result)
            } catch (err) {
                console.error("Failed to load admin analytics", err)
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

    const viewsData = data?.daily_views.map(d => ({
        date: format(parseISO(d.date), "MMM d"),
        views: d.views
    })) || []

    const growthData = data?.daily_wishlists.map(d => ({
        date: format(parseISO(d.date), "MMM d"),
        count: d.count
    })) || []

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="font-serif text-2xl text-foreground">System Analytics</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Tracking engagement and growth over the last 30 days
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Daily Views Chart */}
                <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-accent/10">
                                <Eye className="h-4 w-4 text-accent" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Daily Views</CardTitle>
                                <CardDescription>Traffic trends across all wishlists</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={viewsData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "12px",
                                        fontSize: "12px"
                                    }}
                                    itemStyle={{ color: "hsl(var(--accent))" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="hsl(var(--accent))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Wishlist Growth Chart */}
                <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <ListOrdered className="h-4 w-4 text-purple-500" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Wishlist Creation</CardTitle>
                                <CardDescription>New wishlists per day</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={growthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                />
                                <Tooltip
                                    cursor={{ fill: "hsl(var(--secondary))", opacity: 0.4 }}
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "12px",
                                        fontSize: "12px"
                                    }}
                                    itemStyle={{ color: "hsl(var(--accent))" }}
                                />
                                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border p-6 flex flex-col items-center text-center gap-3">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-medium">Date Range</h3>
                    <p className="text-sm text-muted-foreground">Showing data from last 30 days automatically. Custom ranges coming in v2.</p>
                </Card>
                <Card className="border-border p-6 flex flex-col items-center text-center gap-3">
                    <TrendingUp className="h-8 w-8 text-accent" />
                    <h3 className="font-medium">Organic Growth</h3>
                    <p className="text-sm text-muted-foreground">Monitoring system-wide virality and user acquisition trends.</p>
                </Card>
                <Card className="border-border p-6 flex flex-col items-center text-center gap-3">
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                    <h3 className="font-medium">Referrals</h3>
                    <p className="text-sm text-muted-foreground">Tracking where your traffic comes from to optimize sharing.</p>
                </Card>
            </div>
        </div>
    )
}

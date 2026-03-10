"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2,
    TrendingUp,
    Eye,
    Heart,
    AlertCircle
} from "lucide-react"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getPremiumUserAnalytics, getMe, type PremiumUserAnalytics } from "@/lib/api"
import { format, parseISO } from "date-fns"

export default function PremiumAnalyticsPage() {
    const [data, setData] = useState<PremiumUserAnalytics[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isPremium, setIsPremium] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function load() {
            try {
                // Check if user is premium
                const user = await getMe()
                if (!user.is_premium) {
                    setError("This feature is only available to premium members.")
                    setLoading(false)
                    return
                }

                setIsPremium(true)

                // Fetch analytics data
                const result = await getPremiumUserAnalytics()
                setData(result)
            } catch (err) {
                console.error("Failed to load analytics", err)
                setError(err instanceof Error ? err.message : "Failed to load analytics data")
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

    if (error) {
        return (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <div>
                        <h3 className="font-semibold text-destructive">Premium Feature</h3>
                        <p className="text-sm text-destructive/80">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!isPremium) {
        return null
    }

    // Calculate totals
    const totalViews = data.reduce((sum, item) => sum + item.view_count, 0)
    const totalLikes = data.reduce((sum, item) => sum + item.like_count, 0)

    // Prepare chart data
    const chartData = data.map(item => ({
        title: item.title.length > 15 ? item.title.substring(0, 15) + "..." : item.title,
        views: item.view_count,
        likes: item.like_count
    }))

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="font-serif text-2xl text-foreground">Your Analytics</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Track views and likes across all your wishlists
                </p>
            </div>

            {data.length === 0 ? (
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-8">
                        <div className="text-center">
                            <p className="text-muted-foreground">No wishlist data available yet</p>
                            <p className="text-sm text-muted-foreground/70 mt-2">
                                Create wishlists to start tracking views and likes
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-border bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-accent/10">
                                        <Eye className="h-4 w-4 text-accent" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Total Views</CardTitle>
                                        <CardDescription>Across all wishlists</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-accent">{totalViews}</p>
                            </CardContent>
                        </Card>

                        <Card className="border-border bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-red-500/10">
                                        <Heart className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Total Likes</CardTitle>
                                        <CardDescription>Across all wishlists</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-red-500">{totalLikes}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <TrendingUp className="h-4 w-4 text-purple-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Wishlist Performance</CardTitle>
                                    <CardDescription>Views and likes per wishlist</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[400px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="title"
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
                                    />
                                    <Legend />
                                    <Bar dataKey="views" fill="hsl(var(--accent))" name="Views" />
                                    <Bar dataKey="likes" fill="hsl(var(--red-500))" name="Likes" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Wishlist Details Table */}
                    <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg">Wishlist Details</CardTitle>
                            <CardDescription>Individual performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Title</th>
                                            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Views</th>
                                            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Likes</th>
                                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={item.wishlist_id} className="border-b border-border hover:bg-accent/5 transition-colors">
                                                <td className="py-3 px-4 font-medium">{item.title}</td>
                                                <td className="text-right py-3 px-4 text-accent">{item.view_count}</td>
                                                <td className="text-right py-3 px-4 text-red-500">{item.like_count}</td>
                                                <td className="py-3 px-4 text-muted-foreground">
                                                    {format(parseISO(item.created_at), "MMM d, yyyy")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    Loader2,
    Mail,
    Calendar,
    Shield,
    Eye,
    Heart,
    ListOrdered,
    ExternalLink,
    Globe,
    Lock,
    KeyRound,
    Check
} from "lucide-react"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAdminUserDetail, adminResetPassword, type AdminUserDetail } from "@/lib/api"
import { format, parseISO } from "date-fns"
import Link from "next/link"

export default function AdminUserDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string
    const [data, setData] = useState<AdminUserDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [resetOpen, setResetOpen] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [resetting, setResetting] = useState(false)
    const [resetSuccess, setResetSuccess] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const result = await getAdminUserDetail(userId)
                setData(result)
            } catch (err) {
                console.error("Failed to load user detail", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [userId])

    async function handleAdminReset(e: React.FormEvent) {
        e.preventDefault()
        setResetting(true)
        try {
            await adminResetPassword(userId, newPassword)
            setResetSuccess(true)
            setTimeout(() => {
                setResetOpen(false)
                setResetSuccess(false)
                setNewPassword("")
            }, 2000)
        } catch (err) {
            console.error("Failed to reset password", err)
        } finally {
            setResetting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!data) return null

    const chartData = data.stats.daily_views.map(d => ({
        date: format(parseISO(d.date), "MMM d"),
        views: d.views
    }))

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/users"
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h2 className="font-serif text-2xl text-foreground">{data.profile.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {data.profile.email}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {format(parseISO(data.profile.created_at), "MMMM d, yyyy")}
                        </span>
                        {data.profile.is_admin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                                <Shield className="h-3 w-3" />
                                Admin
                            </span>
                        )}
                    </div>
                </div>

                <div className="ml-auto flex gap-2">
                    <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-border">
                                <KeyRound className="h-4 w-4" />
                                Reset Password
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleAdminReset}>
                                <DialogHeader>
                                    <DialogTitle>Reset User Password</DialogTitle>
                                    <DialogDescription>
                                        Manually set a new password for {data.profile.name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-6 flex flex-col gap-4">
                                    {resetSuccess ? (
                                        <div className="flex flex-col items-center justify-center py-4 gap-2 text-accent animate-in fade-in zoom-in-95">
                                            <Check className="h-10 w-10" />
                                            <p className="font-medium">Password updated successfully</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="admin-new-password">New Password</Label>
                                            <Input
                                                id="admin-new-password"
                                                type="password"
                                                placeholder="Enter at least 8 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={8}
                                                className="bg-card border-border"
                                            />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    {!resetSuccess && (
                                        <Button
                                            type="submit"
                                            className="bg-accent text-accent-foreground hover:bg-accent/90"
                                            disabled={resetting || newPassword.length < 8}
                                        >
                                            {resetting ? "Updating..." : "Update Password"}
                                        </Button>
                                    )}
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Wishlists</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.total_wishlists}</div>
                    </CardContent>
                </Card>
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Aggregate Views</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.total_views.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Activity Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.wishlists.reduce((acc, w) => acc + w.item_count, 0)} items
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* User Traffic Chart */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-lg">User Traffic</CardTitle>
                        <CardDescription>Views across all wishlists (last 30 days)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] pt-4">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="userViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            borderColor: "hsl(var(--border))",
                                            borderRadius: "12px",
                                            fontSize: "11px"
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="hsl(var(--accent))"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#userViews)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                                No view data available yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* User's Wishlists Table */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-lg">Wishlists</CardTitle>
                        <CardDescription>All wishlists created by this user</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead>Title</TableHead>
                                    <TableHead>Stats</TableHead>
                                    <TableHead>Visibility</TableHead>
                                    <TableHead className="text-right">Link</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.wishlists.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                            User hasn't created any wishlists yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.wishlists.map((w) => (
                                        <TableRow key={w.id} className="border-border group">
                                            <TableCell>
                                                <div className="font-medium text-foreground truncate max-w-[150px]">{w.title}</div>
                                                <div className="text-[10px] text-muted-foreground">{w.item_count} items</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Eye className="h-3 w-3" />
                                                        {w.view_count}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Heart className={`h-3 w-3 ${w.like_count > 0 ? "text-accent fill-current" : ""}`} />
                                                        {w.like_count}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {w.is_public ? (
                                                    <div className="inline-flex items-center gap-1 text-[10px] text-accent">
                                                        <Globe className="h-3 w-3" />
                                                        Public
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                                        <Lock className="h-3 w-3" />
                                                        Private
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <a
                                                    href={`/w/${w.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

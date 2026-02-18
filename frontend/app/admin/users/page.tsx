"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Users,
    Loader2,
    Search,
    Mail,
    Calendar,
    Shield,
    ExternalLink
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAdminUsers, type AdminUser } from "@/lib/api"
import { format } from "date-fns"

export default function AdminUsersPage() {
    const router = useRouter()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function load() {
            try {
                const data = await getAdminUsers()
                setUsers(data)
            } catch (err) {
                console.error("Failed to load admin users", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="font-serif text-2xl text-foreground">User Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Total of {users.length} registered users
                    </p>
                </div>

                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9 bg-card border-border"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-border">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead className="w-[250px]">User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Wishlists</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                                        No users found matching your search
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        className="border-border group cursor-pointer hover:bg-secondary/30 transition-colors"
                                        onClick={() => router.push(`/admin/users/${user.id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{user.name}</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.is_admin ? (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                                                    <Shield className="h-3 w-3" />
                                                    Admin
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                                                    User
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{user.wishlist_count}</span>
                                                <div className="h-1.5 w-12 rounded-full bg-secondary overflow-hidden">
                                                    <div
                                                        className="h-full bg-accent transition-all duration-1000"
                                                        style={{ width: `${Math.min(user.wishlist_count * 20, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {format(new Date(user.created_at), "MMM d, yyyy")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors inline-block"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

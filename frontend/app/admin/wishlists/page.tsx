"use client"

import { useEffect, useState } from "react"
import {
    ListOrdered,
    Loader2,
    Search,
    Eye,
    Heart,
    Globe,
    Lock,
    ExternalLink,
    User
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
import { Card, CardContent } from "@/components/ui/card"
import { getAdminWishlists, type AdminWishlist } from "@/lib/api"
import { format } from "date-fns"

export default function AdminWishlistsPage() {
    const [wishlists, setWishlists] = useState<AdminWishlist[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function load() {
            try {
                const data = await getAdminWishlists()
                setWishlists(data)
            } catch (err) {
                console.error("Failed to load admin wishlists", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filteredWishlists = wishlists.filter(w =>
        w.title.toLowerCase().includes(search.toLowerCase()) ||
        w.owner_name.toLowerCase().includes(search.toLowerCase()) ||
        w.owner_email.toLowerCase().includes(search.toLowerCase())
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
                    <h2 className="font-serif text-2xl text-foreground">Wishlist Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Across {filteredWishlists.length} active wishlists
                    </p>
                </div>

                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or owner..."
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
                                <TableHead className="w-[200px]">Wishlist</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Engagement</TableHead>
                                <TableHead>Visibility</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredWishlists.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                        No wishlists found matching your search
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredWishlists.map((w) => (
                                    <TableRow key={w.id} className="border-border group">
                                        <TableCell>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium text-foreground truncate">{w.title}</span>
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    {w.item_count} items
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">{w.owner_name}</span>
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                    {w.owner_email}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Eye className="h-3 w-3" />
                                                    {w.view_count}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Heart className={`h-3 w-3 ${w.like_count > 0 ? "text-accent fill-current" : ""}`} />
                                                    {w.like_count}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {w.is_public ? (
                                                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-accent">
                                                    <Globe className="h-3 w-3" />
                                                    Public
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                                    <Lock className="h-3 w-3" />
                                                    Private
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(w.created_at), "MMM d, yy")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <a
                                                href={`/w/${w.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
    )
}

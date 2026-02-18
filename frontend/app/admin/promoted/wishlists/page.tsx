"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Plus,
    Trash2,
    Loader2,
    ArrowLeft,
    Globe,
    User,
    ListChecks,
    Search,
    Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    listAdminPromotedWishlists,
    createAdminPromotedWishlist,
    deleteAdminPromotedWishlist,
    getAdminWishlists,
    type AdminPromotedWishlist,
    type AdminWishlist,
} from "@/lib/api"

export default function AdminPromotedWishlistsPage() {
    const [promoted, setPromoted] = useState<AdminPromotedWishlist[]>([])
    const [allWishlists, setAllWishlists] = useState<AdminWishlist[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Create form state
    const [createOpen, setCreateOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedWishlistId, setSelectedWishlistId] = useState("")
    const [category, setCategory] = useState("Seasonal")
    const [promoting, setPromoting] = useState(false)

    async function load() {
        try {
            const [promotedData, allData] = await Promise.all([
                listAdminPromotedWishlists(),
                getAdminWishlists(),
            ])
            setPromoted(promotedData)
            setAllWishlists(allData.filter(w => w.is_public))
        } catch {
            setError("Failed to load discovery data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    async function handlePromote(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedWishlistId) return
        setPromoting(true)
        setError("")
        try {
            await createAdminPromotedWishlist(selectedWishlistId, category)
            setCreateOpen(false)
            setSelectedWishlistId("")
            setCategory("Seasonal")
            await load()
        } catch (err: any) {
            setError(err.message || "Failed to promote wishlist")
        } finally {
            setPromoting(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to remove this wishlist from discovery?")) return
        try {
            await deleteAdminPromotedWishlist(id)
            await load()
        } catch {
            setError("Failed to remove promoted wishlist")
        }
    }

    const filteredWishlists = allWishlists.filter(w =>
        (w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.owner_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        !promoted.some(p => p.wishlist_id === w.id)
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Admin
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-serif">Curated Collections</h1>
                        <p className="text-sm text-muted-foreground">Feature public wishlists as seasonal or trending collections</p>
                    </div>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2">
                            <Plus className="h-4 w-4" />
                            Feature a Wishlist
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <form onSubmit={handlePromote}>
                            <DialogHeader>
                                <DialogTitle>Feature a Wishlist</DialogTitle>
                                <DialogDescription>
                                    Promote a public wishlist into the Curated Collections section.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Select Public Wishlist</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by title or owner..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-border rounded-md mt-2">
                                        {filteredWishlists.length === 0 ? (
                                            <p className="p-4 text-sm text-center text-muted-foreground">
                                                {searchQuery ? "No matching public wishlists found" : "Start typing to search..."}
                                            </p>
                                        ) : (
                                            filteredWishlists.map(w => (
                                                <button
                                                    key={w.id}
                                                    type="button"
                                                    onClick={() => setSelectedWishlistId(w.id)}
                                                    className={`w-full text-left p-3 text-sm hover:bg-secondary transition-colors border-b border-border last:border-0 ${selectedWishlistId === w.id ? "bg-secondary ring-1 ring-primary" : ""
                                                        }`}
                                                >
                                                    <div className="font-medium">{w.title}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                        <User className="h-3 w-3" /> {w.owner_name}
                                                        • <ListChecks className="h-3 w-3 ml-1" /> {w.item_count} items
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="category">Collection Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Seasonal">Seasonal (Valentine, Ramadan, etc.)</SelectItem>
                                            <SelectItem value="Trending">Trending</SelectItem>
                                            <SelectItem value="Staff Pick">Staff Pick</SelectItem>
                                            <SelectItem value="Gift Guide">Gift Guide</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    className="bg-foreground text-background"
                                    disabled={promoting || !selectedWishlistId}
                                >
                                    {promoting ? "Featuring..." : "Feature Wishlist"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <div className="p-3 text-sm rounded bg-destructive/10 text-destructive">{error}</div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {promoted.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground">No curated collections yet. Feature a wishlist to help users find inspiration!</p>
                    </div>
                )}
                {promoted.map((p) => (
                    <Card key={p.id} className="overflow-hidden border-border group relative">
                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDelete(p.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                                    <Star className="mr-1 h-3 w-3 fill-current" />
                                    {p.category}
                                </span>
                            </div>
                            <CardTitle className="text-xl font-serif">{p.title}</CardTitle>
                            <CardDescription className="flex items-center gap-1.5 pt-1">
                                <User className="h-3.5 w-3.5" />
                                Created by {p.owner_name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mt-2">
                                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                                    <Link href={`/w/${p.slug}`} target="_blank">
                                        View Wishlist
                                    </Link>
                                </Button>
                                <span className="text-xs text-muted-foreground italic">
                                    Promoted {new Date(p.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

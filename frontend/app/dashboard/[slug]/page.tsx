"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    ExternalLink,
    Copy,
    Check,
    Eye,
    Globe,
    Lock,
    MoreHorizontal,
    Loader2,
    Tag,
    User,
    Heart,
    Link2,
    Sparkles,
    AlertCircle,
    Coins,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { copyToClipboard } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    getWishlist,
    addItem,
    updateItem,
    deleteItem,
    scrapeUrl,
    type WishlistDetail,
    type WishlistItem,
    type ScrapeResult,
} from "@/lib/api"

export default function WishlistDetailPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    const [wishlist, setWishlist] = useState<WishlistDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    // Add item dialog
    const [addOpen, setAddOpen] = useState(false)
    const [addTab, setAddTab] = useState<"url" | "manual">("url")
    const [itemName, setItemName] = useState("")
    const [itemPrice, setItemPrice] = useState("")
    const [itemCurrency, setItemCurrency] = useState("NGN")
    const [itemTag, setItemTag] = useState("")
    const [itemUrl, setItemUrl] = useState("")
    const [itemImageUrl, setItemImageUrl] = useState("")
    const [adding, setAdding] = useState(false)

    // URL scrape state
    const [scrapeInput, setScrapeInput] = useState("")
    const [scraping, setScraping] = useState(false)
    const [scrapePreview, setScrapePreview] = useState<ScrapeResult | null>(null)
    const [scrapeError, setScrapeError] = useState("")

    // Edit item dialog
    const [editOpen, setEditOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<WishlistItem | null>(null)
    const [editName, setEditName] = useState("")
    const [editPrice, setEditPrice] = useState("")
    const [editCurrency, setEditCurrency] = useState("NGN")
    const [editTag, setEditTag] = useState("")
    const [editUrl, setEditUrl] = useState("")
    const [editImageUrl, setEditImageUrl] = useState("")
    const [editingItem, setEditingItem] = useState(false)

    // Delete item dialog
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<WishlistItem | null>(null)
    const [deletingItem, setDeletingItem] = useState(false)

    async function load() {
        try {
            const data = await getWishlist(slug)
            setWishlist(data)
        } catch {
            setError("Failed to load wishlist")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [slug])

    function resetAddForm() {
        setItemName("")
        setItemPrice("")
        setItemCurrency("NGN")
        setItemTag("")
        setItemUrl("")
        setItemImageUrl("")
        setScrapeInput("")
        setScrapePreview(null)
        setScrapeError("")
        setAddTab("url")
    }

    function ensureUrl(url: string): string {
        if (!url) return url
        if (!/^https?:\/\//i.test(url)) {
            return `https://${url}`
        }
        return url
    }

    async function handleScrape(e: React.FormEvent) {
        e.preventDefault()
        if (!scrapeInput.trim()) return
        setScraping(true)
        setScrapeError("")
        setScrapePreview(null)
        try {
            const result = await scrapeUrl(scrapeInput.trim())
            setScrapePreview(result)
            // Pre-fill the manual form fields
            setItemName(result.name || "")
            setItemPrice(result.price ? String(result.price) : "")
            setItemCurrency(result.currency || "NGN")
            setItemUrl(result.url || scrapeInput.trim())
            setItemImageUrl(result.image_url || "")
        } catch (err: any) {
            setScrapeError(err.message || "Could not fetch product details")
        } finally {
            setScraping(false)
        }
    }

    async function handleAddItem(e: React.FormEvent) {
        e.preventDefault()
        if (!wishlist) return
        setAdding(true)
        try {
            await addItem(wishlist.id, {
                name: itemName,
                price: itemPrice ? parseFloat(itemPrice) : undefined,
                currency: itemCurrency || "NGN",
                tag: itemTag || undefined,
                url: ensureUrl(itemUrl) || undefined,
                image_url: ensureUrl(itemImageUrl) || undefined,
            })
            setAddOpen(false)
            resetAddForm()
            await load()
        } catch {
            setError("Failed to add item")
        } finally {
            setAdding(false)
        }
    }

    function openEditItem(item: WishlistItem) {
        setEditTarget(item)
        setEditName(item.name)
        setEditPrice(item.price ? String(item.price) : "")
        setEditCurrency(item.currency)
        setEditTag(item.tag || "")
        setEditUrl(item.url || "")
        setEditImageUrl(item.image_url || "")
        setEditOpen(true)
    }

    async function handleEditItem(e: React.FormEvent) {
        e.preventDefault()
        if (!wishlist || !editTarget) return
        setEditingItem(true)
        try {
            await updateItem(wishlist.id, editTarget.id, {
                name: editName,
                price: editPrice ? parseFloat(editPrice) : undefined,
                currency: editCurrency || undefined,
                tag: editTag || undefined,
                url: ensureUrl(editUrl) || undefined,
                image_url: ensureUrl(editImageUrl) || undefined,
            })
            setEditOpen(false)
            setEditTarget(null)
            await load()
        } catch {
            setError("Failed to update item")
        } finally {
            setEditingItem(false)
        }
    }

    function openDeleteItem(item: WishlistItem) {
        setDeleteTarget(item)
        setDeleteOpen(true)
    }

    async function handleDeleteItem() {
        if (!wishlist || !deleteTarget) return
        setDeletingItem(true)
        try {
            await deleteItem(wishlist.id, deleteTarget.id)
            setDeleteOpen(false)
            setDeleteTarget(null)
            await load()
        } catch {
            setError("Failed to delete item")
        } finally {
            setDeletingItem(false)
        }
    }

    async function copyShareLink() {
        if (!wishlist) return
        const url = `${window.location.origin}/w/${wishlist.slug}`
        const success = await copyToClipboard(url)
        if (success) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    function formatPrice(price: number | null, currency: string) {
        if (price === null) return null
        const symbols: Record<string, string> = {
            NGN: "₦",
            USD: "$",
            EUR: "€",
            GBP: "£",
        }
        const symbol = symbols[currency] || currency + " "
        return `${symbol}${price.toLocaleString()}`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!wishlist) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <p className="text-muted-foreground">Wishlist not found</p>
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    const reservedCount = wishlist.items.filter((i) => i.is_claimed).length

    return (
        <div className="flex flex-col gap-8">
            {/* Back + Header */}
            <div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to wishlists
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <h1 className="font-serif text-3xl text-foreground truncate">
                                {wishlist.title}
                            </h1>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5 shrink-0">
                                {wishlist.is_public ? (
                                    <>
                                        <Globe className="h-3 w-3" /> Public
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-3 w-3" /> Private
                                    </>
                                )}
                            </span>
                        </div>
                        {wishlist.description && (
                            <p className="text-muted-foreground mt-1">
                                {wishlist.description}
                            </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5" />
                                {wishlist.view_count} views
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Heart className={`h-3.5 w-3.5 ${wishlist.like_count > 0 ? "text-accent fill-current" : ""}`} />
                                {wishlist.like_count} likes
                            </span>
                            <span>
                                {wishlist.items.length} items · {reservedCount} reserved
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyShareLink}
                            className="gap-2 border-border"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-accent" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            {copied ? "Copied!" : "Copy Link"}
                        </Button>

                        <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetAddForm() }}>
                            <DialogTrigger asChild>
                                <Button
                                    size="sm"
                                    className="bg-foreground text-background hover:bg-foreground/90 gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Add an item</DialogTitle>
                                    <DialogDescription>
                                        Paste a product link or fill in details manually.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Tab switcher */}
                                <div className="flex rounded-lg border border-border overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setAddTab("url")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${addTab === "url"
                                            ? "bg-foreground text-background"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <Link2 className="h-3.5 w-3.5" />
                                        Paste Link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddTab("manual")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${addTab === "manual"
                                            ? "bg-foreground text-background"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Manual
                                    </button>
                                </div>

                                {/* ── URL Tab ── */}
                                {addTab === "url" && (
                                    <div className="flex flex-col gap-4">
                                        <form onSubmit={handleScrape} className="flex gap-2">
                                            <Input
                                                placeholder="https://temu.com/product..."
                                                value={scrapeInput}
                                                onChange={(e) => setScrapeInput(e.target.value)}
                                                className="bg-card border-border flex-1"
                                                autoFocus
                                            />
                                            <Button
                                                type="submit"
                                                disabled={scraping || !scrapeInput.trim()}
                                                className="bg-foreground text-background hover:bg-foreground/90 shrink-0"
                                            >
                                                {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                            </Button>
                                        </form>

                                        {scrapeError && (
                                            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2.5">
                                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium">Couldn&apos;t fetch details</p>
                                                    <p className="text-xs mt-0.5 opacity-80">{scrapeError}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddTab("manual")}
                                                        className="text-xs underline mt-1 opacity-80 hover:opacity-100"
                                                    >
                                                        Fill in manually instead →
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {scrapePreview && (
                                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                                {scrapePreview.image_url && (
                                                    <div className="relative h-40 bg-muted">
                                                        <img
                                                            src={scrapePreview.image_url}
                                                            alt={scrapePreview.name}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="p-3 flex flex-col gap-1">
                                                    <p className="font-medium text-sm line-clamp-2 text-foreground">
                                                        {scrapePreview.name || "(No title found)"}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        {scrapePreview.price ? (
                                                            <span className="text-sm font-semibold text-accent">
                                                                {scrapePreview.currency} {scrapePreview.price.toLocaleString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Price not detected</span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">{scrapePreview.source_domain}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!scrapePreview && !scrapeError && !scraping && (
                                            <p className="text-xs text-muted-foreground text-center py-4">
                                                Paste a product URL from Temu, Amazon, Jumia, or any store and we&apos;ll fill in the details automatically.
                                            </p>
                                        )}

                                        {scrapePreview && (
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="flex-1 border-border"
                                                    onClick={() => setAddTab("manual")}
                                                >
                                                    Edit Details
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                                                    disabled={adding}
                                                    onClick={() => handleAddItem({ preventDefault: () => { } } as React.FormEvent)}
                                                >
                                                    {adding ? "Adding..." : "Add to Wishlist"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Manual Tab ── */}
                                {addTab === "manual" && (
                                    <form onSubmit={handleAddItem} className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="item-name">Name</Label>
                                            <Input
                                                id="item-name"
                                                placeholder="JBL Wireless Earbuds"
                                                value={itemName}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemName(e.target.value)}
                                                required
                                                className="bg-card border-border"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="item-price">Price</Label>
                                                <Input
                                                    id="item-price"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="45000"
                                                    value={itemPrice}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemPrice(e.target.value)}
                                                    className="bg-card border-border"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="item-currency">Currency</Label>
                                                <Select value={itemCurrency} onValueChange={setItemCurrency}>
                                                    <SelectTrigger id="item-currency" className="bg-card border-border">
                                                        <SelectValue placeholder="NGN" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                                                        <SelectItem value="USD">USD ($)</SelectItem>
                                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="item-tag">
                                                Tag{" "}
                                                <span className="text-muted-foreground font-normal">(optional)</span>
                                            </Label>
                                            <Input
                                                id="item-tag"
                                                placeholder="Tech, Fashion, Home..."
                                                value={itemTag}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemTag(e.target.value)}
                                                className="bg-card border-border"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="item-url">
                                                Link{" "}
                                                <span className="text-muted-foreground font-normal">(optional)</span>
                                            </Label>
                                            <Input
                                                id="item-url"
                                                type="text"
                                                placeholder="example.com/product"
                                                value={itemUrl}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemUrl(e.target.value)}
                                                className="bg-card border-border"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="item-image">
                                                Image URL{" "}
                                                <span className="text-muted-foreground font-normal">(optional)</span>
                                            </Label>
                                            <Input
                                                id="item-image"
                                                type="text"
                                                placeholder="example.com/image.jpg"
                                                value={itemImageUrl}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemImageUrl(e.target.value)}
                                                className="bg-card border-border"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <DialogClose asChild>
                                                <Button type="button" variant="ghost" className="flex-1">Cancel</Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
                                                disabled={adding || !itemName.trim()}
                                            >
                                                {adding ? "Adding..." : "Add Item"}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3">
                    {error}
                </div>
            )}

            {/* Empty State */}
            {wishlist.items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="font-serif text-2xl text-foreground">
                        No items yet
                    </h2>
                    <p className="text-muted-foreground max-w-sm">
                        Start adding the gifts you&apos;d love to receive.
                    </p>
                    <Button
                        onClick={() => setAddOpen(true)}
                        className="bg-foreground text-background hover:bg-foreground/90 gap-2 mt-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Your First Item
                    </Button>
                </div>
            )}

            {/* Items List */}
            {wishlist.items.length > 0 && (
                <div className="flex flex-col gap-3">
                    {wishlist.items.map((item) => (
                        <Card
                            key={item.id}
                            className={`transition-shadow hover:shadow-sm ${item.is_claimed ? "opacity-60" : ""}`}
                        >
                            <CardContent className="flex items-center gap-4 p-4">
                                {/* Thumbnail / Status indicator */}
                                {item.image_url ? (
                                    <img
                                        src={item.image_url.startsWith("http") ? item.image_url : `https://${item.image_url}`}
                                        alt={item.name}
                                        className={`h-10 w-10 rounded-xl object-cover shrink-0 border border-border ${item.is_claimed ? "opacity-50" : ""}`}
                                    />
                                ) : (
                                    <div
                                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.is_claimed
                                            ? "bg-accent/15 text-accent"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {item.is_claimed ? (
                                            <Check className="h-5 w-5" />
                                        ) : item.tag ? (
                                            <span className="text-xs font-semibold">
                                                {item.tag[0].toUpperCase()}
                                            </span>
                                        ) : (
                                            <Tag className="h-4 w-4" />
                                        )}
                                    </div>
                                )}

                                {/* Item info */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`font-medium truncate ${item.is_claimed ? "line-through text-muted-foreground" : "text-foreground"}`}
                                    >
                                        {item.name}
                                    </p>
                                    {item.reservations && item.reservations.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {item.reservations.map((res) => (
                                                <span key={res.id} className="text-[10px] font-medium tracking-wide uppercase text-accent bg-accent/10 rounded-full px-2 py-0.5 flex items-center gap-1">
                                                    <User className="h-2.5 w-2.5" />
                                                    {res.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                                        {item.tag && <span>{item.tag}</span>}
                                        {item.url && (
                                            <a
                                                href={
                                                    item.url.startsWith("http")
                                                        ? item.url
                                                        : `https://${item.url}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 hover:text-accent transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Link
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                {item.price !== null && (
                                    <span
                                        className={`text-sm font-medium shrink-0 ${item.is_claimed ? "text-muted-foreground" : "text-foreground"}`}
                                    >
                                        {formatPrice(item.price, item.currency)}
                                    </span>
                                )}

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEditItem(item)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => openDeleteItem(item)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
            }

            {/* Edit Item Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <form onSubmit={handleEditItem}>
                        <DialogHeader>
                            <DialogTitle>Edit item</DialogTitle>
                            <DialogDescription>Update the item details.</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="edit-item-name">Name</Label>
                                <Input
                                    id="edit-item-name"
                                    value={editName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                                    required
                                    className="bg-card border-border"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-item-price">Price</Label>
                                    <Input
                                        id="edit-item-price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editPrice}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPrice(e.target.value)}
                                        className="bg-card border-border"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit-item-currency">Currency</Label>
                                    <Select value={editCurrency} onValueChange={setEditCurrency}>
                                        <SelectTrigger id="edit-item-currency" className="bg-card border-border">
                                            <SelectValue placeholder="NGN" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">NGN (₦)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="edit-item-tag">Tag</Label>
                                <Input
                                    id="edit-item-tag"
                                    value={editTag}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTag(e.target.value)}
                                    className="bg-card border-border"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="edit-item-url">Link</Label>
                                <Input
                                    id="edit-item-url"
                                    type="text"
                                    value={editUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditUrl(e.target.value)}
                                    className="bg-card border-border"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="edit-item-image">Image URL</Label>
                                <Input
                                    id="edit-item-image"
                                    type="text"
                                    value={editImageUrl}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditImageUrl(e.target.value)}
                                    className="bg-card border-border"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="ghost">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className="bg-foreground text-background hover:bg-foreground/90"
                                disabled={editingItem || !editName.trim()}
                            >
                                {editingItem ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Item Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete item</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{deleteTarget?.name}
                            &rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteItem}
                            disabled={deletingItem}
                        >
                            {deletingItem ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}

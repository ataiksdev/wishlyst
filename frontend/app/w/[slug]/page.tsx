"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
    Gift,
    Eye,
    Check,
    ExternalLink,
    Tag,
    Loader2,
    User,
    ArrowRight,
    Heart,
    Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    getWishlist,
    claimItem,
    unclaimItem,
    likeWishlist,
    cloneWishlist,
    getMe,
    type WishlistDetail,
    type WishlistItem,
} from "@/lib/api"

export default function PublicWishlistPage() {
    const params = useParams()
    const slug = params.slug as string

    const [wishlist, setWishlist] = useState<WishlistDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Reserve dialog
    const [reserveOpen, setReserveOpen] = useState(false)
    const [reserveTarget, setReserveTarget] = useState<WishlistItem | null>(null)
    const [reserverName, setReserverName] = useState("")
    const [reserving, setReserving] = useState(false)

    // Unreserve dialog
    const [unreserveOpen, setUnreserveOpen] = useState(false)
    const [unreserveTarget, setUnreserveTarget] = useState<WishlistItem | null>(null)
    const [unreserveName, setUnreserveName] = useState("")
    const [unreserving, setUnreserving] = useState(false)

    // Likes
    const [liking, setLiking] = useState(false)
    const [hasLiked, setHasLiked] = useState(false)

    // Cloning
    const [cloneOpen, setCloneOpen] = useState(false)
    const [cloning, setCloning] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    async function load() {
        try {
            const data = await getWishlist(slug)
            setWishlist(data)
        } catch {
            setError("This wishlist doesn\u2019t exist or is private.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        checkAuth()
    }, [slug])

    async function checkAuth() {
        try {
            await getMe()
            setIsLoggedIn(true)
        } catch {
            setIsLoggedIn(false)
        }
    }

    function openReserve(item: WishlistItem) {
        setReserveTarget(item)
        setReserverName("")
        setReserveOpen(true)
    }

    async function handleReserve(e: React.FormEvent) {
        e.preventDefault()
        if (!reserveTarget) return
        setReserving(true)
        try {
            await claimItem(slug, reserveTarget.id, reserverName)
            setReserveOpen(false)
            setReserveTarget(null)
            setReserverName("")
            await load()
        } catch {
            setError("Failed to reserve item")
        } finally {
            setReserving(false)
        }
    }

    function openUnreserve(item: WishlistItem) {
        setUnreserveTarget(item)
        setUnreserveName("")
        setUnreserveOpen(true)
    }

    async function handleUnreserve(e: React.FormEvent) {
        e.preventDefault()
        if (!unreserveTarget) return
        setUnreserving(true)
        try {
            await unclaimItem(slug, unreserveTarget.id, unreserveName)
            setUnreserveOpen(false)
            setUnreserveTarget(null)
            setUnreserveName("")
            await load()
        } catch {
            setError("Failed to unreserve item. Ensure the name matches exactly.")
        } finally {
            setUnreserving(false)
        }
    }

    async function handleLike() {
        if (!wishlist || liking || hasLiked) return
        setLiking(true)
        // Optimistic update
        setWishlist({ ...wishlist, like_count: (wishlist.like_count || 0) + 1 })
        setHasLiked(true)
        try {
            await likeWishlist(slug)
        } catch {
            // Rollback optimistic update on error if needed
            await load()
        } finally {
            setLiking(false)
        }
    }

    async function handleClone(e: React.FormEvent) {
        e.preventDefault()
        if (!isLoggedIn) return
        setCloning(true)
        try {
            const data = await cloneWishlist(slug, newTitle)
            window.location.href = `/dashboard` // Go to dashboard to see new list
        } catch (err: any) {
            setError(err.message || "Failed to clone wishlist")
        } finally {
            setCloning(false)
            setCloneOpen(false)
        }
    }

    function formatPrice(price: number | null, currency: string) {
        if (price === null) return null
        const symbols: Record<string, string> = {
            NGN: "\u20A6",
            USD: "$",
            EUR: "\u20AC",
            GBP: "\u00A3",
        }
        const symbol = symbols[currency] || currency + " "
        return `${symbol}${price.toLocaleString()}`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!wishlist) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-6">
                <Gift className="h-12 w-12 text-muted-foreground" />
                <h1 className="font-serif text-2xl text-foreground">Wishlist not found</h1>
                <p className="text-muted-foreground text-center max-w-sm">
                    {error || "This wishlist doesn\u2019t exist or is private."}
                </p>
                <Button variant="ghost" asChild>
                    <Link href="/">Go to Wishly</Link>
                </Button>
            </div>
        )
    }

    const reservedCount = wishlist.items.filter((i) => i.is_claimed).length

    return (
        <div className="min-h-screen bg-background">
            {/* Simple header */}
            <header className="border-b border-border bg-background/80 backdrop-blur-md">
                <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-accent" />
                        <span className="text-lg font-semibold tracking-tight text-foreground">
                            Wishly
                        </span>
                    </Link>
                    <Button
                        size="sm"
                        className="bg-foreground text-background hover:bg-foreground/90"
                        asChild
                    >
                        <Link href="/register">Create Yours</Link>
                    </Button>
                </nav>
            </header>

            <main className="mx-auto max-w-3xl px-6 py-10">
                {/* Wishlist header */}
                <div className="text-center mb-10">
                    <h1 className="font-serif text-4xl text-foreground">
                        {wishlist.owner_name ? `${wishlist.owner_name}\u2019s ` : ""}{wishlist.title}{!wishlist.title.toLowerCase().includes("wishlist") ? " Wishlist" : ""}
                    </h1>
                    {wishlist.description && (
                        <p className="text-muted-foreground mt-2 text-lg">
                            {wishlist.description}
                        </p>
                    )}
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {wishlist.view_count} views
                        </span>
                        <span>
                            {reservedCount} of {wishlist.items.length} reserved
                        </span>
                        <button
                            onClick={handleLike}
                            disabled={liking || hasLiked}
                            className={`flex items-center gap-1 transition-all duration-300 ${hasLiked ? "text-accent scale-110" : "hover:text-accent"
                                }`}
                        >
                            <Heart
                                className={`h-3.5 w-3.5 ${hasLiked ? "fill-current" : ""}`}
                            />
                            {wishlist.like_count} likes
                        </button>
                        {isLoggedIn && (
                            <button
                                onClick={() => {
                                    setNewTitle(`Copy of ${wishlist.title}`)
                                    setCloneOpen(true)
                                }}
                                className="flex items-center gap-1 hover:text-accent transition-colors"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Clone to my Wishly
                            </button>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3 mb-6">
                        {error}
                    </div>
                )}

                {/* Items */}
                <div className="flex flex-col gap-3">
                    {wishlist.items.map((item) => (
                        <Card
                            key={item.id}
                            className={`transition-shadow hover:shadow-sm ${item.is_claimed ? "opacity-60" : ""}`}
                        >
                            <CardContent className="flex items-center gap-4 p-4">
                                {/* Thumbnail / Status */}
                                {item.image_url ? (
                                    <img
                                        src={
                                            item.image_url.startsWith("http")
                                                ? item.image_url
                                                : `https://${item.image_url}`
                                        }
                                        alt={item.name}
                                        className={`h-12 w-12 rounded-xl object-cover shrink-0 border border-border ${item.is_claimed ? "opacity-50" : ""}`}
                                    />
                                ) : (
                                    <div
                                        className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${item.is_claimed
                                            ? "bg-accent/15 text-accent"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {item.is_claimed ? (
                                            <Check className="h-5 w-5" />
                                        ) : item.tag ? (
                                            <span className="text-sm font-semibold">
                                                {item.tag[0].toUpperCase()}
                                            </span>
                                        ) : (
                                            <Tag className="h-4 w-4" />
                                        )}
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`font-medium truncate ${item.is_claimed ? "line-through text-muted-foreground" : "text-foreground"}`}
                                    >
                                        {item.name}
                                    </p>
                                    {item.reservations_count && item.reservations_count > 0 && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[10px] font-medium tracking-wide uppercase text-accent bg-accent/10 rounded-full px-2 py-0.5 flex items-center gap-1">
                                                Reserved {item.reservations_count} {item.reservations_count === 1 ? 'time' : 'times'}
                                            </span>
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
                                                View
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

                                {/* Reserve / Unreserve */}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => openReserve(item)}
                                        className="shrink-0 bg-foreground text-background hover:bg-foreground/90 text-xs"
                                    >
                                        Reserve
                                    </Button>
                                    {item.is_claimed && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openUnreserve(item)}
                                            className="shrink-0 text-xs border-border"
                                        >
                                            Unreserve
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {
                    wishlist.items.length === 0 && (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>This wishlist is empty.</p>
                        </div>
                    )
                }
            </main >

            {/* Reserve Dialog */}
            < Dialog open={reserveOpen} onOpenChange={setReserveOpen} >
                <DialogContent>
                    <form onSubmit={handleReserve}>
                        <DialogHeader>
                            <DialogTitle>Reserve this gift</DialogTitle>
                            <DialogDescription asChild>
                                <div className="space-y-3">
                                    <p>
                                        Let {wishlist.owner_name || "them"} know you&apos;re getting &ldquo;
                                        {reserveTarget?.name}&rdquo;. Your name will be hidden from the
                                        wishlist owner.
                                    </p>
                                    {reserveTarget?.reserver_initials && reserveTarget.reserver_initials.length > 0 && (
                                        <div className="bg-accent/5 border border-accent/10 rounded-lg p-3 flex items-start gap-3 mt-4">
                                            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-accent" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium text-foreground">Already reserved by {reserveTarget.reserver_initials.join(', ')}</p>
                                                <p className="text-muted-foreground mt-0.5">Do you also want to reserve it again?</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="reserver-name">Your name</Label>
                                <Input
                                    id="reserver-name"
                                    placeholder="e.g. Chioma"
                                    value={reserverName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReserverName(e.target.value)}
                                    required
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
                                className="bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                                disabled={reserving || !reserverName.trim()}
                            >
                                {reserving ? "Reserving..." : "Reserve Now"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >

            {/* Unreserve Dialog */}
            < Dialog open={unreserveOpen} onOpenChange={setUnreserveOpen} >
                <DialogContent>
                    <form onSubmit={handleUnreserve}>
                        <DialogHeader>
                            <DialogTitle>Unreserve gift</DialogTitle>
                            <DialogDescription>
                                Enter your name exactly as you used it to reserve &ldquo;{unreserveTarget?.name}&rdquo;.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="unreserve-name">Your name</Label>
                                <Input
                                    id="unreserve-name"
                                    placeholder="e.g. Chioma"
                                    value={unreserveName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnreserveName(e.target.value)}
                                    required
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
                                variant="destructive"
                                disabled={unreserving || !unreserveName.trim()}
                            >
                                {unreserving ? "Unreserving..." : "Unreserve"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >

            {/* Clone Dialog */}
            < Dialog open={cloneOpen} onOpenChange={setCloneOpen} >
                <DialogContent>
                    <form onSubmit={handleClone}>
                        <DialogHeader>
                            <DialogTitle>Clone this Wishlist</DialogTitle>
                            <DialogDescription>
                                This will create a copy of this wishlist and all its items on your account.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="clone-title">New Wishlist Title</Label>
                                <Input
                                    id="clone-title"
                                    placeholder="e.g. My My Birthday List"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    required
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
                                className="bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                                disabled={cloning || !newTitle.trim()}
                            >
                                {cloning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {cloning ? "Cloning..." : "Clone Now"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >
        </div >
    )
}

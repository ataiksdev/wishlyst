"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles, TrendingUp, Plus, Loader2, ArrowRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    getDiscovery,
    addItem,
    listWishlists,
    type DiscoveryItem,
    type PromotedItem,
    type Wishlist,
    type CuratedWishlist,
} from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function DiscoveryItems({ mode = "all" }: { mode?: "all" | "featured" | "trending" }) {
    const [trending, setTrending] = useState<DiscoveryItem[]>([])
    const [promoted, setPromoted] = useState<PromotedItem[]>([])
    const [curated, setCurated] = useState<CuratedWishlist[]>([])
    const [loading, setLoading] = useState(true)
    const [wishlists, setWishlists] = useState<Wishlist[]>([])

    // Add state
    const [addOpen, setAddOpen] = useState(false)
    const [targetItem, setTargetItem] = useState<DiscoveryItem | null>(null)
    const [selectedWishlistId, setSelectedWishlistId] = useState("")
    const [adding, setAdding] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const [disc, lists] = await Promise.all([
                    getDiscovery(),
                    listWishlists()
                ])
                setTrending(disc.trending)
                setPromoted(disc.promoted)
                setCurated(disc.curated || [])
                setWishlists(lists)
            } catch (err) {
                console.error("Failed to load discovery", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function handleAdd() {
        if (!targetItem || !selectedWishlistId) return
        setAdding(true)
        try {
            await addItem(selectedWishlistId, {
                name: targetItem.name,
                url: targetItem.url || undefined,
                image_url: targetItem.image_url || undefined,
                price: targetItem.price || undefined,
                currency: targetItem.currency,
            })
            setSuccess(true)
            setTimeout(() => {
                setAddOpen(false)
                setSuccess(false)
                setTargetItem(null)
            }, 1500)
        } catch (err) {
            console.error("Failed to add discovery item", err)
        } finally {
            setAdding(false)
        }
    }

    if (loading) return null

    const showFeatured = mode === "all" || mode === "featured"
    const showTrending = mode === "all" || mode === "trending"

    if ((showTrending && trending.length === 0) && (showFeatured && promoted.length === 0)) return null

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Promoted Items (Inspiration) */}
            {showFeatured && promoted.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                        <h2 className="font-serif text-2xl text-foreground">Featured for You</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                        {promoted.map((item) => (
                            <DiscoveryCard
                                key={item.id}
                                item={item}
                                onAdd={() => {
                                    setTargetItem(item)
                                    setAddOpen(true)
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Curated Collections (Seasonal/Trending Wishlists) */}
            {mode === "all" && curated.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-accent" />
                        <h2 className="font-serif text-2xl text-foreground">Curated Collections</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                        {curated.map((collection, idx) => (
                            <Link
                                key={idx}
                                href={`/w/${collection.slug}`}
                                className="min-w-[280px] max-w-[280px] shrink-0 group relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all duration-300"
                            >
                                <div className="aspect-[16/9] bg-muted relative">
                                    {collection.cover_image ? (
                                        <img
                                            src={collection.cover_image.startsWith('http') ? collection.cover_image : `https://${collection.cover_image}`}
                                            alt={collection.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                            <TrendingUp className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="inline-flex items-center rounded-full bg-accent/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                            {collection.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-serif text-lg text-foreground group-hover:text-accent transition-colors truncate">
                                        {collection.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                        by {collection.owner_name} • {collection.item_count} items
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Items */}
            {showTrending && trending.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-accent" />
                        <h2 className="font-serif text-2xl text-foreground">Community Favorites</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {trending.slice(0, 8).map((item, idx) => (
                            <DiscoveryCard
                                key={idx}
                                item={item}
                                isGrid={true}
                                onAdd={() => {
                                    setTargetItem(item)
                                    setAddOpen(true)
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Add to Wishlist Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add to Wishlist</DialogTitle>
                        <DialogDescription>
                            Which wishlist should we add &ldquo;{targetItem?.name}&rdquo; to?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select onValueChange={setSelectedWishlistId} value={selectedWishlistId}>
                            <SelectTrigger className="bg-card border-border">
                                <SelectValue placeholder="Select a wishlist..." />
                            </SelectTrigger>
                            <SelectContent>
                                {wishlists.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                        {w.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all font-medium"
                            disabled={!selectedWishlistId || adding || success}
                            onClick={handleAdd}
                        >
                            {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {success ? "Added Successfully!" : "Add to List"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function DiscoveryCard({ item, onAdd, isGrid = false }: { item: DiscoveryItem; onAdd: () => void; isGrid?: boolean }) {
    const symbols: Record<string, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£" }
    const currency = symbols[item.currency] || item.currency + " "

    return (
        <Card className={`${isGrid ? 'w-full' : 'min-w-[200px] max-w-[200px] shrink-0'} overflow-hidden border-border bg-card/50 backdrop-blur-sm group hover:border-accent/40 transition-all duration-300`}>
            <div className="aspect-square bg-muted relative overflow-hidden">
                {item.image_url ? (
                    <img
                        src={item.image_url.startsWith('http') ? item.image_url : `https://${item.image_url}`}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <Plus className="h-8 w-8" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <Button size="sm" onClick={onAdd} className="bg-white text-black hover:bg-white/90 rounded-full py-1 h-auto text-xs font-bold">
                        Add to List
                    </Button>
                </div>
            </div>
            <CardContent className="p-3">
                <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                <p className="text-accent text-xs font-bold mt-1">
                    {item.price ? `${currency}${item.price.toLocaleString()}` : 'Free'}
                </p>
                {item.occurrences && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Heart className="h-2 w-2 fill-current" />
                        Added {item.occurrences} times
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

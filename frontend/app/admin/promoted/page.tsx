"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Plus,
    Trash2,
    Loader2,
    ArrowLeft,
    ExternalLink,
    Image as ImageIcon,
    Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
import { Textarea } from "@/components/ui/textarea"
import {
    listAdminPromoted,
    createAdminPromoted,
    deleteAdminPromoted,
    type PromotedItem,
} from "@/lib/api"

export default function AdminPromotedPage() {
    const [items, setItems] = useState<PromotedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Create form state
    const [createOpen, setCreateOpen] = useState(false)
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [url, setUrl] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [creating, setCreating] = useState(false)

    async function load() {
        try {
            const data = await listAdminPromoted()
            setItems(data)
        } catch {
            setError("Failed to load promoted items")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)
        setError("")
        try {
            await createAdminPromoted({
                name,
                description,
                price: price ? parseFloat(price) : undefined,
                url,
                image_url: imageUrl,
                currency: "NGN", // Defaulting to NGN for now
            })
            setCreateOpen(false)
            resetForm()
            await load()
        } catch {
            setError("Failed to create promoted item")
        } finally {
            setCreating(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this promoted item?")) return
        try {
            await deleteAdminPromoted(id)
            await load()
        } catch {
            setError("Failed to delete promoted item")
        }
    }

    function resetForm() {
        setName("")
        setDescription("")
        setPrice("")
        setUrl("")
        setImageUrl("")
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Admin
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-serif">Manage Promoted Items</h1>
                        <p className="text-sm text-muted-foreground">Hand-pick items to feature in the discovery section</p>
                    </div>
                </div>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2">
                            <Plus className="h-4 w-4" />
                            Add Featured Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Add Featured Item</DialogTitle>
                                <DialogDescription>
                                    This item will appear in the "Featured for You" section for all users.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name">Item Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Sony WH-1000XM5"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Briefly describe why this item is featured"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="price">Price (NGN)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            placeholder="500000"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="image">Image URL</Label>
                                        <Input
                                            id="image"
                                            placeholder="https://..."
                                            value={imageUrl}
                                            onChange={(e) => setImageUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="url">Store Link (optional)</Label>
                                    <Input
                                        id="url"
                                        placeholder="https://amazon.com/..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    className="bg-foreground text-background"
                                    disabled={creating || !name.trim()}
                                >
                                    {creating ? "Adding..." : "Add Item"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <div className="p-3 text-sm rounded bg-destructive/10 text-destructive">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
                        <p className="text-muted-foreground">No featured items yet. Add one to get started!</p>
                    </div>
                )}
                {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-border group">
                        <div className="aspect-video bg-muted relative">
                            {item.image_url ? (
                                <img
                                    src={item.image_url.startsWith('http') ? item.image_url : `https://${item.image_url}`}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                    <ImageIcon className="h-10 w-10" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                                {item.price ? (
                                    <p className="text-sm font-semibold text-accent mt-0.5">
                                        ₦{item.price.toLocaleString()}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-0.5">No price set</p>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {item.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2">
                                {item.url && (
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-border" asChild>
                                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3 w-3 mr-1.5" />
                                            Store Link
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

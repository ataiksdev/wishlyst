"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Plus,
    Eye,
    MoreHorizontal,
    Pencil,
    Trash2,
    Globe,
    Lock,
    ListChecks,
    Loader2,
    Share2,
    Check,
    Heart,
    Link as LinkIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { copyToClipboard } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    listWishlists,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    cloneWishlist,
    type Wishlist,
} from "@/lib/api"
import { DiscoveryItems } from "@/components/dashboard/DiscoveryItems"

export default function DashboardPage() {
    const [wishlists, setWishlists] = useState<Wishlist[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Create dialog state
    const [createOpen, setCreateOpen] = useState(false)
    const [createTitle, setCreateTitle] = useState("")
    const [createDesc, setCreateDesc] = useState("")
    const [createPublic, setCreatePublic] = useState(true)
    const [creating, setCreating] = useState(false)

    // Edit dialog state
    const [editOpen, setEditOpen] = useState(false)
    const [editWishlist, setEditWishlist] = useState<Wishlist | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editDesc, setEditDesc] = useState("")
    const [editPublic, setEditPublic] = useState(true)
    const [editing, setEditing] = useState(false)

    // Delete dialog state
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Wishlist | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Share state
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

    // Import state
    const [importOpen, setImportOpen] = useState(false)
    const [importUrl, setImportUrl] = useState("")
    const [importing, setImporting] = useState(false)

    async function load() {
        try {
            const data = await listWishlists()
            setWishlists(data)
        } catch {
            setError("Failed to load wishlists")
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
        try {
            await createWishlist(createTitle, createDesc || undefined, createPublic)
            setCreateOpen(false)
            setCreateTitle("")
            setCreateDesc("")
            setCreatePublic(true)
            await load()
        } catch {
            setError("Failed to create wishlist")
        } finally {
            setCreating(false)
        }
    }

    function openEdit(w: Wishlist) {
        setEditWishlist(w)
        setEditTitle(w.title)
        setEditDesc(w.description || "")
        setEditPublic(w.is_public)
        setEditOpen(true)
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault()
        if (!editWishlist) return
        setEditing(true)
        try {
            await updateWishlist(editWishlist.id, {
                title: editTitle,
                description: editDesc || undefined,
                is_public: editPublic,
            })
            setEditOpen(false)
            setEditWishlist(null)
            await load()
        } catch {
            setError("Failed to update wishlist")
        } finally {
            setEditing(false)
        }
    }

    function openDelete(w: Wishlist) {
        setDeleteTarget(w)
        setDeleteOpen(true)
    }

    async function handleDelete() {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await deleteWishlist(deleteTarget.id)
            setDeleteOpen(false)
            setDeleteTarget(null)
            await load()
        } catch {
            setError("Failed to delete wishlist")
        } finally {
            setDeleting(false)
        }
    }

    async function copyShareLink(slug: string) {
        const url = `${window.location.origin}/w/${slug}`
        const success = await copyToClipboard(url)
        if (success) {
            setCopiedSlug(slug)
            setTimeout(() => setCopiedSlug(null), 2000)
        }
    }

    async function handleImport(e: React.FormEvent) {
        e.preventDefault()
        setImporting(true)
        setError("")
        try {
            // Extract slug from URL
            // Handles: /w/slug, https://domain/w/slug, etc.
            const parts = importUrl.split('/w/')
            const slug = parts[parts.length - 1]?.split('?')[0]

            if (!slug) {
                throw new Error("Invalid wishlist URL. Please ensure it follows the format /w/your-wishlist-slug")
            }

            await cloneWishlist(slug, `Imported ${slug}`)
            setImportOpen(false)
            setImportUrl("")
            await load()
        } catch (err: any) {
            setError(err.message || "Failed to import wishlist")
        } finally {
            setImporting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl text-foreground">My Wishlists</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create and manage your wishlists
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={importOpen} onOpenChange={setImportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-border gap-2">
                                <LinkIcon className="h-4 w-4" />
                                Import Wishlist
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleImport}>
                                <DialogHeader>
                                    <DialogTitle>Import from URL</DialogTitle>
                                    <DialogDescription>
                                        Paste the URL or slug of a public wishlist to copy it to your account.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="import-url">Wishlist URL or Slug</Label>
                                    <Input
                                        id="import-url"
                                        placeholder="e.g. https://bore.pub:1234/w/birthday-2024"
                                        value={importUrl}
                                        onChange={(e) => setImportUrl(e.target.value)}
                                        required
                                        className="bg-card border-border mt-2"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setImportOpen(false)} type="button">Cancel</Button>
                                    <Button
                                        type="submit"
                                        className="bg-foreground text-background"
                                        disabled={importing || !importUrl.trim()}
                                    >
                                        {importing ? "Importing..." : "Clone Wishlist"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2">
                                <Plus className="h-4 w-4" />
                                New Wishlist
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle>Create a wishlist</DialogTitle>
                                    <DialogDescription>
                                        Give your wishlist a name and start adding items.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col gap-4 py-4">
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="create-title">Title</Label>
                                        <Input
                                            id="create-title"
                                            placeholder="Birthday Wishlist"
                                            value={createTitle}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateTitle(e.target.value)}
                                            required
                                            className="bg-card border-border"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="create-desc">
                                            Description{" "}
                                            <span className="text-muted-foreground font-normal">
                                                (optional)
                                            </span>
                                        </Label>
                                        <Input
                                            id="create-desc"
                                            placeholder="Things I'd love for my birthday"
                                            value={createDesc}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateDesc(e.target.value)}
                                            className="bg-card border-border"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border border-border p-4">
                                        <div>
                                            <Label htmlFor="create-public" className="font-medium">
                                                Public wishlist
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Anyone with the link can view it
                                            </p>
                                        </div>
                                        <Switch
                                            id="create-public"
                                            checked={createPublic}
                                            onCheckedChange={setCreatePublic}
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
                                        disabled={creating || !createTitle.trim()}
                                    >
                                        {creating ? "Creating..." : "Create"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Featured Inspiration Section */}
            <DiscoveryItems mode="featured" />


            {/* Error */}
            {
                error && (
                    <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3">
                        {error}
                    </div>
                )
            }

            {/* Empty State */}
            {
                wishlists.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                            <ListChecks className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="font-serif text-2xl text-foreground">
                            No wishlists yet
                        </h2>
                        <p className="text-muted-foreground max-w-sm">
                            Create your first wishlist and start adding the gifts you actually
                            want.
                        </p>
                        <Button
                            onClick={() => setCreateOpen(true)}
                            className="bg-foreground text-background hover:bg-foreground/90 gap-2 mt-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Your First Wishlist
                        </Button>
                    </div>
                )
            }

            {/* Wishlist Cards Grid */}
            {
                wishlists.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {wishlists.map((w) => (
                            <Card
                                key={w.id}
                                className="group relative transition-shadow hover:shadow-md"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <Link
                                            href={`/dashboard/${w.slug}`}
                                            className="flex-1 min-w-0"
                                        >
                                            <CardTitle className="text-lg font-serif truncate hover:text-accent transition-colors">
                                                {w.title}
                                            </CardTitle>
                                        </Link>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    copyShareLink(w.slug);
                                                }}
                                                title="Share wishlist"
                                            >
                                                {copiedSlug === w.slug ? (
                                                    <Check className="h-4 w-4 text-accent" />
                                                ) : (
                                                    <Share2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => copyShareLink(w.slug)}>
                                                        {copiedSlug === w.slug ? (
                                                            <Check className="h-4 w-4 mr-2 text-accent" />
                                                        ) : (
                                                            <Share2 className="h-4 w-4 mr-2" />
                                                        )}
                                                        {copiedSlug === w.slug ? "Copied!" : "Share"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEdit(w)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openDelete(w)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {w.description && (
                                        <CardDescription className="line-clamp-2">
                                            {w.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>

                                <CardContent>
                                    <Link
                                        href={`/dashboard/${w.slug}`}
                                        className="flex items-center gap-4 text-sm text-muted-foreground"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <ListChecks className="h-3.5 w-3.5" />
                                            {w.item_count ?? 0} items
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Eye className="h-3.5 w-3.5" />
                                            {w.view_count} views
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Heart className={`h-3.5 w-3.5 ${w.like_count > 0 ? "text-accent fill-current" : ""}`} />
                                            {w.like_count} likes
                                        </span>
                                        <span className="flex items-center gap-1.5 ml-auto">
                                            {w.is_public ? (
                                                <>
                                                    <Globe className="h-3.5 w-3.5" />
                                                    Public
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="h-3.5 w-3.5" />
                                                    Private
                                                </>
                                            )}
                                        </span>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            }

            {/* Community Favorites Section */}
            <DiscoveryItems mode="trending" />

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <form onSubmit={handleEdit}>
                        <DialogHeader>
                            <DialogTitle>Edit wishlist</DialogTitle>
                            <DialogDescription>
                                Update the details of your wishlist.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={editTitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value)}
                                    required
                                    className="bg-card border-border"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="edit-desc">Description</Label>
                                <Input
                                    id="edit-desc"
                                    value={editDesc}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDesc(e.target.value)}
                                    className="bg-card border-border"
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-border p-4">
                                <div>
                                    <Label htmlFor="edit-public" className="font-medium">
                                        Public wishlist
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Anyone with the link can view it
                                    </p>
                                </div>
                                <Switch
                                    id="edit-public"
                                    checked={editPublic}
                                    onCheckedChange={setEditPublic}
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
                                disabled={editing || !editTitle.trim()}
                            >
                                {editing ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete wishlist</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &ldquo;{deleteTarget?.title}
                            &rdquo;? This will also delete all items in it. This action cannot
                            be undone.
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
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}

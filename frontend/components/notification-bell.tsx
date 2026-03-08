"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Bell, Heart, Eye, Gift, CheckCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    getNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    type AppNotification,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

function NotifIcon({ type }: { type: AppNotification["type"] }) {
    if (type === "reservation") return <Gift className="h-4 w-4 text-accent shrink-0" />
    if (type === "like") return <Heart className="h-4 w-4 text-rose-500 shrink-0" />
    return <Eye className="h-4 w-4 text-sky-500 shrink-0" />
}

export function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [unread, setUnread] = useState(0)
    const [loaded, setLoaded] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Poll unread count every 30s
    const refreshCount = useCallback(async () => {
        try {
            const { count } = await getUnreadCount()
            setUnread(count)
        } catch {/* not authed or network error — silently skip */ }
    }, [])

    useEffect(() => {
        refreshCount()
        const interval = setInterval(refreshCount, 30_000)
        return () => clearInterval(interval)
    }, [refreshCount])

    // Load full list when panel opens
    useEffect(() => {
        if (!open) return
        if (loaded) return
            ; (async () => {
                try {
                    const data = await getNotifications()
                    setNotifications(data)
                    setLoaded(true)
                } catch { /* ignore */ }
            })()
    }, [open, loaded])

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    async function handleMarkRead(id: string) {
        try {
            await markNotificationRead(id)
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            )
            setUnread((c) => Math.max(0, c - 1))
        } catch { /* ignore */ }
    }

    async function handleMarkAll() {
        try {
            await markAllNotificationsRead()
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
            setUnread(0)
        } catch { /* ignore */ }
    }

    function handleOpen() {
        setOpen((v) => !v)
        // Refresh list on open
        if (!open) setLoaded(false)
    }

    const wishlistHref = (n: AppNotification) =>
        n.wishlist_id ? `/dashboard/${getSlugFromWishlistId(n)}` : "/dashboard"

    // We don't have the slug from the notification, navigate to dashboard
    // The notification carries wishlist_id; we'll just link to dashboard
    const handleNotifClick = async (n: AppNotification) => {
        if (!n.is_read) await handleMarkRead(n.id)
        setOpen(false)
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={handleOpen}
                aria-label="Notifications"
                className="relative flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white leading-none">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <span className="font-semibold text-sm text-foreground">Notifications</span>
                        <div className="flex items-center gap-2">
                            {unread > 0 && (
                                <button
                                    onClick={handleMarkAll}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[440px] overflow-y-auto divide-y divide-border/50">
                        {!loaded && (
                            <div className="py-8 text-center text-muted-foreground text-sm">
                                Loading...
                            </div>
                        )}
                        {loaded && notifications.length === 0 && (
                            <div className="py-10 text-center">
                                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No notifications yet</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    You'll see likes, views and reservations here
                                </p>
                            </div>
                        )}
                        {loaded && notifications.map((n) => (
                            <button
                                key={n.id}
                                onClick={() => handleNotifClick(n)}
                                className={cn(
                                    "w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors",
                                    !n.is_read && "bg-accent/5"
                                )}
                            >
                                <div className={cn(
                                    "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                    n.type === "reservation" && "bg-accent/10",
                                    n.type === "like" && "bg-rose-500/10",
                                    n.type === "view" && "bg-sky-500/10",
                                )}>
                                    <NotifIcon type={n.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm leading-snug",
                                        n.is_read ? "text-muted-foreground" : "text-foreground font-medium"
                                    )}>
                                        {n.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {n.message}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <span className="mt-1.5 h-2 w-2 rounded-full bg-accent shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    {loaded && notifications.length > 0 && (
                        <div className="border-t border-border px-4 py-2.5">
                            <Link
                                href="/dashboard"
                                onClick={() => setOpen(false)}
                                className="text-xs text-accent hover:underline"
                            >
                                Go to Dashboard →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Stub — notifications don't carry slugs, navigate to dashboard
function getSlugFromWishlistId(_n: AppNotification) {
    return ""
}

"use client"

import React from "react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Check, Star, Zap, Rocket, Heart, Users, Share2 } from "lucide-react"

const changelog = [
    {
        version: "1.2.0",
        date: "February 10, 2026",
        title: "The Engagement Update",
        icon: Heart,
        changes: [
            "Introduced Wishlist Like system for public pages.",
            "Added IP-based unique like protection to ensure authentic feedback.",
            "New Like counters on both Public and Dashboard views.",
            "Optimistic UI updates for instantaneous interaction feedback.",
            "Added Features and Changelog pages (this one!).",
        ],
    },
    {
        version: "1.1.1",
        date: "February 8, 2026",
        title: "Social & Polishing",
        icon: Share2,
        changes: [
            "Improved share button accessibility and UX.",
            "Added 'Copy Link' confirmation feedback.",
            "Refined item thumbnails and public route handling.",
            "Standardized currency formatting across the app.",
            "Fixed various TypeScript linting errors for better stability.",
        ],
    },
    {
        version: "1.1.0",
        date: "February 5, 2026",
        title: "Group Gifting & Reservations",
        icon: Users,
        changes: [
            "Launched Multi-Reservation system: multiple users can now reserve the same item.",
            "Privacy-first reservation view for public visitors (counts and initials only).",
            "Detailed reservation tracking for owners (full names and timestamps).",
            "Required name verification for unreserving items.",
            "Database migration to a dedicated `item_reservations` table.",
        ],
    },
    {
        version: "1.0.0",
        date: "January 15, 2026",
        title: "Wishlyst Initial Launch",
        icon: Rocket,
        changes: [
            "Core wishlist management system.",
            "Secure user authentication and session management.",
            "Item CRUD with URL, price, and image support.",
            "Public and Private wishlist visibility toggles.",
            "Premium dark-mode responsive UI.",
        ],
    },
]

export default function ChangelogPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-32 pb-20 px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <div className="text-center mb-20">
                        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                            Changelog
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground">
                            The latest updates, improvements, and fixes for Wishlyst.
                        </p>
                    </div>

                    <div className="space-y-16">
                        {changelog.map((entry, index) => (
                            <div key={entry.version} className="relative pl-12 group">
                                {/* Timeline line */}
                                {index !== changelog.length - 1 && (
                                    <div className="absolute left-[23px] top-10 bottom-0 w-px bg-border group-hover:bg-accent/30 transition-colors" />
                                )}

                                {/* Icon circle */}
                                <div className="absolute left-0 top-0 h-12 w-12 rounded-full border border-border bg-card flex items-center justify-center z-10 group-hover:border-accent group-hover:bg-accent/5 transition-all">
                                    <entry.icon className="h-5 w-5 text-accent" />
                                </div>

                                <div className="space-y-4 pt-1">
                                    <div className="flex flex-wrap items-baseline gap-x-4">
                                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{entry.version} — {entry.title}</h2>
                                        <p className="text-sm font-medium text-muted-foreground">{entry.date}</p>
                                    </div>

                                    <ul className="space-y-3">
                                        {entry.changes.map((change, i) => (
                                            <li key={i} className="flex gap-3 text-muted-foreground leading-relaxed">
                                                <div className="mt-2.5 h-1 w-1 rounded-full bg-accent/50 shrink-0" />
                                                <span>{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-32 p-12 rounded-3xl border border-dashed border-border text-center">
                        <Star className="h-8 w-8 text-accent/30 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground">More to come</h3>
                        <p className="mt-2 text-muted-foreground">
                            We&apos;re constantly working on new features. Stay tuned for future updates!
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}

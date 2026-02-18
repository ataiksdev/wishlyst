"use client"

import React from "react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import {
    LayoutDashboard,
    Gift,
    Users,
    Lock,
    Heart,
    Smartphone,
    ExternalLink,
    Tag,
    Eye
} from "lucide-react"

const features = [
    {
        name: "Centralized Dashboard",
        description: "Manage all your wishlists from a single, intuitive dashboard. Create as many as you need for different occasions.",
        icon: LayoutDashboard,
    },
    {
        name: "Smart Item Adding",
        description: "Add items with just a few clicks. Include URLs, prices, custom tags, and even image previews to make it easy for others.",
        icon: Gift,
    },
    {
        name: "Multi-Reservation System",
        description: "Perfect for group gifts. Multiple people can contribute or claim the same item, keeping everyone in the loop without revealing details to the owner.",
        icon: Users,
    },
    {
        name: "Privacy & Control",
        description: "Choose who sees your lists. Toggle between Public and Private modes, and benefit from secure, IP-based interaction tracking.",
        icon: Lock,
    },
    {
        name: "Social Engagement",
        description: "Let friends and family show appreciation with the Like system. Track popularity and view counts in real-time.",
        icon: Heart,
    },
    {
        name: "Premium Mobile Experience",
        description: "A fully responsive, dark-mode first design that looks stunning on desktops, tablets, and phones alike.",
        icon: Smartphone,
    },
]

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-32 pb-20 px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="text-center">
                        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                            Everything you need to <span className="text-accent underline decoration-accent/30 underline-offset-8"> gift better</span>
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                            Wishlyst is more than just a list. It&apos;s a shared experience designed to take the guesswork out of gifting.
                        </p>
                    </div>

                    <div className="mt-20">
                        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <div key={feature.name} className="relative flex flex-col gap-4 p-8 rounded-3xl border border-border bg-card/50 hover:bg-card transition-colors group">
                                    <div className="absolute -top-6 left-8 bg-accent/10 p-4 rounded-2xl border border-accent/20 group-hover:scale-110 transition-transform">
                                        <feature.icon className="h-6 w-6 text-accent" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mt-4">{feature.name}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Highlights */}
                    <div className="mt-32 space-y-24">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>New Feature</span>
                                </div>
                                <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Collaborative Group Gifting</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed text-balance">
                                    Our multi-reservation system allows friends to coordinate on expensive items.
                                    Wishlist owners can see who reserved what, while public viewers see
                                    reservation counts and prompts to join in on the gift.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                        <p className="text-foreground font-medium">Public View</p>
                                        <p className="text-xs text-muted-foreground mt-1">See counts and initials of reservers.</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                        <p className="text-foreground font-medium">Owner View</p>
                                        <p className="text-xs text-muted-foreground mt-1">Full names and timestamps of every claim.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full aspect-video bg-gradient-to-br from-accent/20 to-secondary rounded-3xl border border-border flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />
                                <div className="z-10 bg-background/90 backdrop-blur-md p-6 rounded-2xl border border-border shadow-2xl max-w-xs w-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-semibold">MacBook Pro</span>
                                        <span className="text-accent">$1,999</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-accent w-3/4" />
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>3 Reserved</span>
                                            <span>Goal met</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20">
                                    <Heart className="h-3.5 w-3.5" />
                                    <span>Community</span>
                                </div>
                                <h2 className="font-serif text-3xl sm:text-4xl text-foreground">Interactive Engagement</h2>
                                <p className="text-muted-foreground text-lg leading-relaxed text-balance">
                                    Public wishlists now feature a Like system. Get instant feedback on your choices
                                    and see which items are trending. Every view and like is recorded securely to
                                    give you a complete picture of your wishlist&apos;s impact.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        "Optimistic UI for lightning-fast likes",
                                        "IP-based unique like protection",
                                        "Real-time view tracking",
                                        "Analytics dashboard for owners"
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                                            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 w-full aspect-video bg-gradient-to-tr from-secondary to-accent/20 rounded-3xl border border-border flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-4 p-8 w-full max-w-md">
                                    <div className="p-6 rounded-2xl bg-background/50 border border-border backdrop-blur-sm flex flex-col items-center text-center">
                                        <Eye className="h-6 w-6 text-accent mb-2" />
                                        <span className="text-2xl font-bold">1,204</span>
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Views</span>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-background/50 border border-border backdrop-blur-sm flex flex-col items-center text-center">
                                        <Heart className="h-6 w-6 text-accent mb-2 fill-accent" />
                                        <span className="text-2xl font-bold">482</span>
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Likes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}

"use client"

import { Eye, TrendingUp, Users, BarChart3 } from "lucide-react"

const stats = [
  { label: "Wishlists Created", value: "124K+", icon: BarChart3 },
  { label: "Items Claimed", value: "890K+", icon: TrendingUp },
  { label: "Happy Gifters", value: "56K+", icon: Users },
  { label: "Total Views", value: "3.2M+", icon: Eye },
]

export function ViewStats() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Stats Dashboard Preview */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-serif text-xl text-card-foreground">Your Wishlist Analytics</h3>
                <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <div className="flex items-center gap-2 text-accent">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+23%</span>
              </div>
            </div>

            {/* Mini chart visualization */}
            <div className="flex items-end gap-1.5 h-32 mb-8">
              {[35, 50, 40, 65, 55, 80, 70, 90, 75, 95, 85, 100, 88, 92].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-accent/20 hover:bg-accent/40 transition-colors"
                  style={{ height: `${height}%` }}
                  role="presentation"
                />
              ))}
            </div>

            {/* View details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-background p-4 border border-border">
                <p className="text-sm text-muted-foreground">Unique viewers</p>
                <p className="text-2xl font-semibold text-foreground mt-1">284</p>
              </div>
              <div className="rounded-xl bg-background p-4 border border-border">
                <p className="text-sm text-muted-foreground">Return visits</p>
                <p className="text-2xl font-semibold text-foreground mt-1">67</p>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="flex flex-col gap-6">
            <p className="text-sm font-medium uppercase tracking-widest text-accent">View Tracking</p>
            <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground text-balance leading-[1.1]">
              Know who&apos;s checking your list
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every wishlist comes with built-in analytics. See how many people visited, track trends over time, and know your list is getting the attention it deserves before the big day.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

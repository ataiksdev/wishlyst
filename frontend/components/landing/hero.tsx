import Link from "next/link"
import { ArrowRight, Eye, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 w-fit">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-muted-foreground">Now with view tracking</span>
            </div>

            <h1 className="font-serif text-5xl lg:text-7xl tracking-tight text-foreground text-balance leading-[1.1]">
              Gifts you actually want
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Create beautiful wishlists, share a simple link, and let friends and admirers surprise you with exactly what you’ve been wishing for.
              Because special moments deserve intentional giving.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 text-base px-8 py-6" asChild>
                <Link href="/register">
                  Create Your Wishlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 py-6 border-border text-foreground bg-transparent" asChild>
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Free forever. No credit card required.
            </p>
          </div>

          {/* Right - Wishlist Preview Card */}
          <div className="relative">
            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-lg">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif text-xl text-card-foreground">Ngozi&apos;s Birthday</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Updated 2 days ago</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                  <Eye className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-medium text-foreground">142 views</span>
                </div>
              </div>

              {/* Wishlist Items */}
              <div className="flex flex-col gap-3">
                <WishlistItem
                  name="Ankara Throw Pillows"
                  price="₦18,500"
                  tag="Home"
                  claimed={false}
                />
                <WishlistItem
                  name="JBL Wireless Earbuds"
                  price="₦45,000"
                  tag="Tech"
                  claimed={true}
                />
                <WishlistItem
                  name="Designer Agbada Set"
                  price="₦85,000"
                  tag="Fashion"
                  claimed={false}
                />
                <WishlistItem
                  name="Chimamanda Collection"
                  price="₦12,000"
                  tag="Books"
                  claimed={true}
                />
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <button type="button" className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors" aria-label="Like wishlist">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">24</span>
                  </button>
                  <button type="button" className="flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors" aria-label="Share wishlist">
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">2 of 4 claimed</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-accent/10 -z-10" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-secondary -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}

function WishlistItem({ name, price, tag, claimed }: { name: string; price: string; tag: string; claimed: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${claimed ? "bg-secondary/60" : "bg-background"} border border-border`}>
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium ${claimed ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
          {claimed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            tag[0]
          )}
        </div>
        <div>
          <p className={`text-sm font-medium ${claimed ? "line-through text-muted-foreground" : "text-foreground"}`}>{name}</p>
          <span className="text-xs text-muted-foreground">{tag}</span>
        </div>
      </div>
      <span className={`text-sm font-medium ${claimed ? "text-muted-foreground" : "text-foreground"}`}>{price}</span>
    </div>
  )
}

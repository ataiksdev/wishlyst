import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="py-24 lg:py-32 bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-3xl bg-foreground px-8 py-16 lg:px-16 lg:py-24 text-center">
          <h2 className="font-serif text-3xl lg:text-5xl tracking-tight text-background text-balance mb-4">
            Start sharing what you really want
          </h2>
          <p className="text-background/70 text-lg max-w-xl mx-auto leading-relaxed mb-8">
            Join thousands of people who use Wishly to make gifting easier, more personal, and way less stressful.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-6" asChild>
              <Link href="/register">
                Create Your Free Wishlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-background/50 text-sm mt-4">No credit card required. Free forever.</p>
        </div>
      </div>
    </section>
  )
}

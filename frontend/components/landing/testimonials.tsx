import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Chidinma Okafor",
    role: "Birthday wishlist pro",
    quote: "My family finally stopped sending me the wrong gifts! I just share my Wishly link on WhatsApp and they can browse, claim, and surprise me. The view counter is so fun to watch before my birthday.",
    initials: "CO",
  },
  {
    name: "Tunde Adeyemi",
    role: "Gift-giving perfectionist",
    quote: "I used Wishly for our traditional wedding and it was amazing. We could see exactly who viewed the list, and guests loved how easy it was to claim items without buying duplicates.",
    initials: "TA",
  },
  {
    name: "Aisha Bello",
    role: "Mum of three",
    quote: "Managing three kids' Christmas and Eid wishlists used to be wahala. Now each child has their own Wishly page, the grandparents can view them anytime, and I can track everything from my phone.",
    initials: "AB",
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-widest text-accent mb-4">Testimonials</p>
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground text-balance">
            Loved by gifters everywhere
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-2xl border border-border bg-background p-8 flex flex-col"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>

              <blockquote className="text-sm text-foreground leading-relaxed flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background text-sm font-medium">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

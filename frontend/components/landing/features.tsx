import { Eye, Link2, ListChecks, Bell, Lock, Sparkles } from "lucide-react"

const features = [
  {
    icon: ListChecks,
    title: "Create in seconds",
    description: "Add items from any store, include images, prices, and notes. Organize with categories and priorities.",
  },
  {
    icon: Link2,
    title: "Share one link",
    description: "Get a unique, shareable link for each wishlist. Send it via text, email, or post it anywhere.",
  },
  {
    icon: Eye,
    title: "Track your views",
    description: "See exactly how many people have viewed your wishlist. Know when friends check it before a big event.",
  },
  {
    icon: Bell,
    title: "Claim notifications",
    description: "Friends can secretly claim items so others know what's taken. No more awkward duplicate gifts.",
  },
  {
    icon: Lock,
    title: "Privacy controls",
    description: "Make wishlists public, private, or password protected. You decide who sees what.",
  },
  {
    icon: Sparkles,
    title: "Smart suggestions",
    description: "Get personalized gift ideas based on interests and trends. Never run out of wishlist inspiration.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-widest text-accent mb-4">Features</p>
          <h2 className="font-serif text-4xl lg:text-5xl tracking-tight text-foreground text-balance">
            Everything you need to be gifted right
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Simple tools that make getting what you want effortless and delightful.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-8 transition-all hover:shadow-md hover:border-accent/30"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

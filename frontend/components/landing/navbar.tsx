"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Gift, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-accent" />
          <span className="text-xl font-semibold tracking-tight text-foreground">Wishly</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          <Link href="/#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</Link>
          <Link href="/#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How It Works</Link>
          <Link href="/#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Testimonials</Link>
          <Link href="/#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
        </div>

        <div className="hidden md:flex md:items-center md:gap-3">
          <Button variant="ghost" className="text-sm text-foreground" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button className="bg-foreground text-background hover:bg-foreground/90 text-sm" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4">
          <div className="flex flex-col gap-4">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/#testimonials" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Testimonials</Link>
            <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" className="justify-start text-sm text-foreground" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="bg-foreground text-background hover:bg-foreground/90 text-sm" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

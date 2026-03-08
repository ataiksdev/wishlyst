import React from "react"
import { Gift } from "lucide-react"

const footerLinks = {
  Product: ["Features", "Pricing", "Examples", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press"],
  Resources: ["Help Center", "Privacy Policy", "Terms of Service", "Cookie Policy", "Contact Us"],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 border-b border-border/50 pb-8 md:border-0 md:pb-0">
            <a href="/" className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-accent" />
              <span className="text-lg font-semibold text-foreground">Wishly</span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-4">
              The simplest way to create, share, and track wishlists with the people you love.
            </p>
            <div className="text-xs text-muted-foreground/80 space-y-1">
              <p>Registered Company Name</p>
              <p>RC Number: 000000</p>
              <p>Registered Address, Nigeria</p>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{category}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => {
                  let href = "#";
                  if (link === "Features") href = "/features";
                  if (link === "Changelog") href = "/changelog";
                  if (link === "Privacy Policy") href = "/privacy-policy";
                  if (link === "Terms of Service") href = "/terms";
                  if (link === "Cookie Policy") href = "/cookie-policy";
                  if (link === "Contact Us") href = "mailto:support@wishlist.ng";

                  return (
                    <li key={link}>
                      <a href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            2026 Wishly. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="/cookie-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

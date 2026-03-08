"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        // Check if the user has already consented or declined
        const hasConsented = localStorage.getItem("cookieConsent")
        if (!hasConsented) {
            setShowBanner(true)
        }
    }, [])

    const handleAccept = () => {
        localStorage.setItem("cookieConsent", "accepted")
        setShowBanner(false)
    }

    const handleDecline = () => {
        localStorage.setItem("cookieConsent", "declined")
        setShowBanner(false)
        // Optional: add logic here to disable analytics if declined
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 transition-all transform translate-y-0">
            <div className="mx-auto max-w-7xl">
                <div className="bg-background border border-border rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">We value your privacy</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We use necessary cookies to make our platform work. We'd also like to use optional analytics cookies (to track view counts and visits for our users' wishlists) to help us improve.
                            We won't set optional cookies unless you enable them. For more details, see our {" "}
                            <a href="/cookie-policy" className="text-primary hover:underline font-medium">
                                Cookie Policy
                            </a>.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                        <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
                            Decline Optional
                        </Button>
                        <Button variant="default" onClick={handleAccept} className="w-full sm:w-auto">
                            Accept All
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

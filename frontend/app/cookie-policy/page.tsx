import React from "react"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function CookiePolicyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Navbar />
            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-bold font-playfair mb-8">Cookie Policy</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p>
                        This Cookie Policy explains how we use cookies and similar tracking technologies on our platform.
                    </p>
                    {/* Content will be updated by the user */}
                </div>
            </main>
            <Footer />
        </div>
    )
}

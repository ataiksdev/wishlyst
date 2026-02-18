"use client"

import { useState } from "react"
import Link from "next/link"
import { Gift, ArrowLeft, ShieldQuestion, CheckCircle2, Loader2, KeyRound, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getResetQuestion, resetPassword } from "@/lib/api"

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [email, setEmail] = useState("")
    const [question, setQuestion] = useState("")
    const [answer, setAnswer] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleFetchQuestion(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await getResetQuestion(email)
            setQuestion(res.question)
            setStep(2)
        } catch (err: any) {
            setError(err.message || "Could not find account with that email")
        } finally {
            setLoading(false)
        }
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            await resetPassword(email, answer, newPassword)
            setStep(3)
        } catch (err: any) {
            setError(err.message || "Incorrect answer or password too weak")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
            <div className="w-full max-w-sm flex flex-col gap-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Link href="/" className="flex items-center gap-2 mb-2">
                        <Gift className="h-7 w-7 text-accent" />
                        <span className="text-2xl font-semibold tracking-tight text-foreground">Wishly</span>
                    </Link>
                    <h1 className="font-serif text-3xl text-foreground">
                        {step === 1 && "Forgot password?"}
                        {step === 2 && "Identity verification"}
                        {step === 3 && "Success!"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {step === 1 && "Enter your email to retrieve your security question."}
                        {step === 2 && "Please answer the security question you set during registration."}
                        {step === 3 && "Your password has been updated. You can now log in."}
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-3">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleFetchQuestion} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-card border-border"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-foreground text-background hover:bg-foreground/90 py-5"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                        </Button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleReset} className="flex flex-col gap-6">
                        <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex gap-3">
                            <ShieldQuestion className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Security Question</span>
                                <p className="text-sm font-medium text-foreground leading-relaxed">
                                    {question}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="answer" className="text-sm text-foreground">Your Answer</Label>
                                <Input
                                    id="answer"
                                    type="text"
                                    placeholder="Type your answer..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    required
                                    className="bg-card border-border"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="new-password" className="text-sm text-foreground">New Password</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="At least 8 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="bg-card border-border px-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-foreground text-background hover:bg-foreground/90 py-5"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                        </Button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Use a different email
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="flex flex-col gap-6 items-center animate-in zoom-in-95 duration-300">
                        <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-accent" />
                        </div>
                        <Button asChild className="w-full bg-foreground text-background hover:bg-foreground/90 py-5">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </div>
                )}

                {step !== 3 && (
                    <div className="flex flex-col gap-4 mt-4">
                        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to login
                        </Link>
                        <div className="text-[11px] text-center text-muted-foreground px-6 leading-relaxed italic border-t border-border pt-4">
                            Can&apos;t remember your answer? <br />
                            <span className="font-medium text-foreground/80">Please contact our admin team</span> for manual account recovery.
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

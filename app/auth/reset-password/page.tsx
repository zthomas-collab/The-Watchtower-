'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-wt-green mx-auto" />
        <h2 className="text-xl font-bold">Reset link sent</h2>
        <p className="text-wt-muted text-sm">
          Check <span className="text-white font-medium">{email}</span> for a
          password reset link.
        </p>
        <Link href="/auth/login" className="text-xs text-wt-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-wt-muted text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="wt-label block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-wt-surface border border-wt-border text-white placeholder-wt-muted px-4 py-2.5 text-sm focus:outline-none focus:border-wt-accent transition-colors"
          />
        </div>

        {error && (
          <div className="text-xs text-wt-red bg-wt-red/10 border border-wt-red/20 px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-wt-accent text-wt-bg font-bold py-3 text-sm hover:bg-cyan-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send reset link
        </button>
      </form>

      <div className="text-center">
        <Link href="/auth/login" className="text-xs text-wt-muted hover:text-wt-accent transition-colors">
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}

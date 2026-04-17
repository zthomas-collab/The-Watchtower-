'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PERKS = [
  'All five Watchtower scores for every metro',
  'National, state & county-level data',
  'Rankings, screener & compare tools',
  'Save up to 10 markets to your watchlist',
  'No credit card required',
]

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: name },
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-wt-green mx-auto" />
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-wt-muted text-sm leading-relaxed">
          We sent a confirmation link to{' '}
          <span className="text-white font-medium">{email}</span>.
          Click it to activate your account.
        </p>
        <Link
          href="/auth/login"
          className="inline-block text-sm text-wt-accent hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      {/* Left: perks */}
      <div className="space-y-6 hidden md:block">
        <div>
          <h2 className="text-2xl font-bold mb-2">Free forever, no card needed.</h2>
          <p className="text-wt-muted text-sm leading-relaxed">
            The Watchtower gives you institutional-grade real estate intelligence
            built on public data — completely free.
          </p>
        </div>
        <ul className="space-y-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-wt-green flex-shrink-0" />
              <span className="text-wt-muted">{perk}</span>
            </li>
          ))}
        </ul>
        <div className="wt-card p-4 text-xs text-wt-muted leading-relaxed">
          <span className="text-white font-medium">Pro tip:</span> Start with the Rankings page — filter by
          Strength Score above 65 and Risk Score below 40 to find the best markets in seconds.
        </div>
      </div>

      {/* Right: form */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-wt-muted text-sm">
            Already have one?{' '}
            <Link href="/auth/login" className="text-wt-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 border border-wt-border bg-wt-surface py-3 text-sm font-medium hover:border-wt-muted transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-wt-border" />
          <span className="text-xs text-wt-muted">or</span>
          <div className="flex-1 h-px bg-wt-border" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="wt-label block mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full bg-wt-surface border border-wt-border text-white placeholder-wt-muted px-4 py-2.5 text-sm focus:outline-none focus:border-wt-accent transition-colors"
            />
          </div>

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

          <div>
            <label className="wt-label block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 8 characters"
              className="w-full bg-wt-surface border border-wt-border text-white placeholder-wt-muted px-4 py-2.5 text-sm focus:outline-none focus:border-wt-accent transition-colors"
            />
            <p className="text-xs text-wt-muted mt-1.5">At least 8 characters</p>
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
            Create free account
          </button>

          <p className="text-xs text-wt-muted text-center leading-relaxed">
            By signing up you agree to our terms of service.
            We never sell your data.
          </p>
        </form>
      </div>
    </div>
  )
}

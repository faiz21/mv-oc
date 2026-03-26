'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/hub')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            MV
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>MV-Companion OS</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Operations Hub</div>
          </div>
        </div>

        <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Sign in
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Welcome back. Enter your credentials.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@machinvision.com"
              className="w-full px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{ background: 'var(--error-muted)', color: 'var(--error)' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

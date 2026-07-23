import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { loginUser } from '../utils/auth.functions'

export const Route = createFileRoute('/login')({
  ssr: false,
  beforeLoad: ({ context }) => {
    // If user is already logged in, redirect to home
    if (context.user) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await loginUser({
        data: {
          email,
          password,
        },
      })

      if (result?.success && result.user) {
        // Force router reload to refresh user context and redirect based on role
        window.location.href = result.user.role === 'admin' ? '/admin/dashboard' : '/'
      } else {
        setError('Login gagal. Periksa kembali email dan password Anda.')
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat masuk.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-16 bg-gradient-to-b from-[var(--sand)]/20 via-transparent to-[var(--foam)]/20">
      <div className="w-full max-w-[420px] rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 md:p-10 shadow-[0_24px_64px_rgba(23,58,64,0.06)] backdrop-blur-xl relative overflow-hidden">
        {/* Subtle top decoration light glow */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--hero-a),transparent_70%)] opacity-80" />
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--hero-b),transparent_70%)] opacity-60" />

        <div className="text-center mb-8 relative">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--lagoon-deep)]/10 text-[var(--lagoon-deep)] mb-4 shadow-[inset_0_2px_4px_rgba(79,184,178,0.1)]">
            <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--sea-ink)]">
            Selamat Datang
          </h1>
          <p className="text-xs text-[var(--sea-ink-soft)] mt-1.5 leading-relaxed">
            Masuk untuk mengakses & mengelola akun langganan premium Anda.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div>
            <label className="block text-[11px] font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-2">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-sm text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)]/50 shadow-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-4 focus:ring-[var(--lagoon-deep)]/10 transition-all duration-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider">
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] pl-4 pr-11 py-3 text-sm text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)]/50 shadow-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-4 focus:ring-[var(--lagoon-deep)]/10 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]/60 hover:text-[var(--sea-ink)] transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[var(--lagoon-deep)] py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(50,143,151,0.2)] hover:bg-[var(--lagoon)] hover:shadow-[0_6px_16px_rgba(50,143,151,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_12px_rgba(50,143,151,0.2)] transition-all duration-200 disabled:opacity-50 disabled:-translate-y-0 disabled:shadow-none cursor-pointer"
          >
            {isLoading ? 'Menghubungkan...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4 relative">
          <p className="text-xs text-[var(--sea-ink-soft)]">
            Belum memiliki akun?{' '}
            <Link to="/register" className="font-bold text-[var(--lagoon-deep)] hover:underline hover:text-[var(--lagoon)] transition-colors">
              Daftar di sini
            </Link>
          </p>
          <div className="pt-3 border-t border-[var(--line)]/50">
            <Link to="/" className="text-xs text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] font-semibold inline-flex items-center gap-1.5 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

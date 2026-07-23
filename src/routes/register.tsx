import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { registerUser } from '../utils/auth.functions'

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    // If user is already logged in, redirect to dashboard or home
    if (context.user) {
      throw redirect({ to: '/' })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await registerUser({
        data: {
          name,
          email,
          whatsapp,
          password,
        },
      })

      if (result?.success) {
        // Force router reload to refresh user context
        window.location.href = '/'
      } else {
        setError(result?.error || 'Pendaftaran gagal. Silakan coba lagi.')
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat mendaftar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-[var(--line)] bg-[var(--header-bg)] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-md relative overflow-hidden">
        {/* Aesthetic background gradients */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.15),transparent_70%)]" />
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.1),transparent_70%)]" />

        <div className="text-center mb-8 relative">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--sea-ink)]">
            Buat Akun Baru
          </h1>
          <p className="text-sm text-[var(--sea-ink-soft)] mt-2">
            Mulai berlangganan layanan premium dengan mudah dan cepat.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budi Setiawan"
              className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--sea-ink)] shadow-sm outline-none focus:border-[var(--lagoon-deep)] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi.setiawan@gmail.com"
              className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--sea-ink)] shadow-sm outline-none focus:border-[var(--lagoon-deep)] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
              No. WhatsApp (Aktif)
            </label>
            <input
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="0812XXXXXXXX"
              className="w-full rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--sea-ink)] shadow-sm outline-none focus:border-[var(--lagoon-deep)] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--line)] bg-white/70 pl-4 pr-11 py-3 text-sm text-[var(--sea-ink)] shadow-sm outline-none focus:border-[var(--lagoon-deep)] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] cursor-pointer"
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
            className="w-full rounded-xl bg-[var(--lagoon-deep)] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--sea-ink-soft)] mt-6 relative">
          Sudah memiliki akun?{' '}
          <Link to="/login" className="font-bold text-[var(--lagoon-deep)] hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  )
}

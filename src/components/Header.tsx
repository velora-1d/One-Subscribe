import { Link, useRouter, useNavigate, useLocation } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'
import { Route } from '../routes/__root'
import { logoutUser } from '../utils/auth.functions'

export default function Header() {
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard')) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      await router.invalidate()
      navigate({ to: '/' })
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center justify-between py-3 sm:py-4">
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-bold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:px-4 sm:py-2"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[linear-gradient(90deg,#f97316,#ef4444,#3b82f6)] animate-pulse" />
            OneSubscribe
          </Link>

          {/* Navigation Links (Redesigned with segmented controller tabs style) */}
          <div className="hidden items-center gap-1.5 sm:flex bg-slate-100/80 border border-slate-200/40 p-1 rounded-xl">
            <Link
              to="/"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition no-underline"
              activeProps={{ className: 'bg-white text-slate-900 shadow-sm border border-slate-200/40 font-bold' }}
            >
              Katalog
            </Link>
            {user && (
              <Link
                to="/dashboard"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition no-underline"
                activeProps={{ className: 'bg-white text-slate-900 shadow-sm border border-slate-200/40 font-bold' }}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-[var(--sea-ink-soft)] md:inline-block">
                  Halo, <strong className="text-[var(--sea-ink)]">{user.name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 border border-red-200 cursor-pointer hover:bg-red-100 transition"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 text-xs rounded-full border border-[var(--chip-line)] text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)] transition"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="bg-[var(--lagoon-deep)] px-4 py-2 text-xs text-white font-bold rounded-full shadow-sm hover:opacity-90 transition"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          <span className="h-5 w-[1px] bg-[var(--line)]" />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}

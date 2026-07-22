import { useState, useEffect } from 'react'
import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { Route as RootRoute } from './__root'
import { verifyAdminPin, logoutUser } from '../utils/auth.functions'


export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    // Auth Check Middleware
    if (!context.user) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const { user } = RootRoute.useRouteContext()
  const navigate = useNavigate()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    try {
      await logoutUser()
      await router.invalidate()
      navigate({ to: '/' })
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  useEffect(() => {
    if (user?.role === 'customer' || user?.role === 'admin') {
      setIsVerified(true)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [user])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await verifyAdminPin({ data: pinInput })
      if (res.success) {
        sessionStorage.setItem('admin_switched', 'true')
        setIsVerified(true)
        setErrorMsg(null)
      } else {
        setErrorMsg(`❌ ${res.error || 'PIN Admin salah! Silakan coba lagi.'}`)
      }
    } catch (err: any) {
      setErrorMsg('❌ Terjadi kesalahan saat memverifikasi PIN.')
    }
  }

  const handleSwitchBack = () => {
    sessionStorage.removeItem('admin_switched')
    navigate({ to: '/admin/dashboard' })
  }

  if (loading) {
    return (
      <main className="page-wrap px-4 py-16 text-center">
        <div className="animate-pulse text-sm text-[var(--sea-ink-soft)]">
          Memuat halaman...
        </div>
      </main>
    )
  }

  if (!isVerified && user?.role === 'admin') {
    return (
      <main className="page-wrap px-4 py-16 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="island-shell rounded-3xl p-8 max-w-md w-full border border-[var(--line)] space-y-6">
          <div className="text-center">
            <span className="text-3xl">🔒</span>
            <h1 className="text-xl font-extrabold text-[var(--sea-ink)] mt-3">
              Akses Terbatas: Mode Simulasi
            </h1>
            <p className="text-xs text-[var(--sea-ink-soft)] mt-2 leading-relaxed">
              Untuk beralih dari Admin Panel dan melihat Dashboard Pelanggan, Anda harus memasukkan PIN keamanan Admin.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-2 text-center">
                PIN Admin
              </label>
              <input
                type="password"
                required
                maxLength={6}
                placeholder="Masukkan PIN Admin"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-bold rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-[var(--sea-ink)] shadow-sm outline-none focus:border-slate-900 transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate({ to: '/admin/dashboard' })}
                className="flex-1 rounded-xl bg-transparent border border-[var(--line)] py-3 text-xs font-bold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)] transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-sm hover:scale-95 transition-all cursor-pointer border-0"
              >
                Verifikasi & Switch
              </button>
            </div>
          </form>
        </div>
      </main>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-900 bg-[#FCFBF7] font-sans">
      {/* SideNavBar (Desktop) */}
      <nav className="hidden md:flex h-screen w-64 bg-white border-r border-slate-200 flex-col p-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 font-extrabold text-slate-800 text-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Dashboard User</h2>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate max-w-[140px]" title={user?.name}>
              {user?.name}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1">Menu Pelanggan</span>

          {/* Link: Active Services */}
          <Link
            to="/dashboard"
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  task_alt
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Layanan Aktif
                </span>
              </>
            )}
          </Link>

          {/* Link: Order History */}
          <Link
            to="/dashboard/orders"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  receipt_long
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Riwayat Pesanan
                </span>
              </>
            )}
          </Link>

          {/* Link: My Profile */}
          <Link
            to="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  person
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Profil Saya
                </span>
              </>
            )}
          </Link>
        </div>

        {/* Bottom Section: Back to Catalog / Admin and Logout */}
        <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            Lihat Katalog
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
            >
              <span className="material-symbols-outlined text-[18px]">shield</span>
              Admin Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100/80 text-red-600 py-2.5 rounded-lg text-xs font-bold hover:scale-95 transition-transform cursor-pointer font-sans mt-1"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative flex w-64 max-w-xs flex-1 flex-col bg-white px-6 py-6 border-r border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 font-extrabold text-slate-800 text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 leading-tight">Dashboard User</h2>
                  <p className="text-[10px] font-semibold text-slate-500 truncate max-w-[120px]">{user?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 bg-transparent border-0 cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 flex-grow">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1">Menu Pelanggan</span>

              <Link
                to="/dashboard"
                activeOptions={{ exact: true }}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      task_alt
                    </span>
                    <span className={`text-xs font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Layanan Aktif
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/dashboard/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      receipt_long
                    </span>
                    <span className={`text-xs font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Riwayat Pesanan
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      person
                    </span>
                    <span className={`text-xs font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Profil Saya
                    </span>
                  </>
                )}
              </Link>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Lihat Katalog
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
                >
                  <span className="material-symbols-outlined text-[18px]">shield</span>
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50/50 hover:bg-red-100/70 text-red-600 py-2.5 rounded-lg text-xs font-bold hover:scale-95 transition-transform cursor-pointer font-sans mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 overflow-y-auto bg-[#FCFBF7] flex flex-col min-h-screen">
        {/* Mobile Top Nav (visible only on mobile) */}
        <header className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center w-full shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">OneSubscribe</h1>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-700 bg-transparent border-0 cursor-pointer flex items-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Main Content Canvas Wrap */}
        <div className="max-w-container-max w-full mx-auto px-6 py-8 md:py-12 flex flex-col gap-8">
          {user?.role === 'admin' && isVerified && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <span>⚠️ <strong>Mode Simulasi:</strong> Anda sedang melihat tampilan Dashboard Pelanggan.</span>
              <button
                onClick={handleSwitchBack}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer text-center border-0 text-xs"
              >
                Switch Kembali ke Admin
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  )
}

import { createFileRoute, Link, Outlet, redirect, useRouter, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { logoutUser } from '../utils/auth.functions'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    // Auth Middleware: Enforce admin role check
    if (!context.user || context.user.role !== 'admin') {
      throw redirect({ to: '/login' })
    }
  },
  loader: async ({ context }) => {
    return { user: context.user }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user } = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true'
    }
    return false
  })

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_sidebar_collapsed', String(next))
      }
      return next
    })
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

  const navLinks = [
    { to: '/admin/dashboard', icon: 'analytics', label: 'Ringkasan' },
    { to: '/admin/products', icon: 'inventory_2', label: 'Produk' },
    { to: '/admin/categories', icon: 'category', label: 'Kategori' },
    { to: '/admin/orders', icon: 'receipt_long', label: 'Pesanan' },
    { to: '/admin/reports', icon: 'bar_chart', label: 'Laporan' },
    { to: '/admin/users', icon: 'group', label: 'Pengguna' },
    { to: '/admin/promos', icon: 'local_offer', label: 'Promo' },
    { to: '/admin/templates', icon: 'chat_bubble', label: 'Template WA' },
    { to: '/admin/settings', icon: 'settings', label: 'Pengaturan' },
    { to: '/admin/profile', icon: 'person', label: 'Profil' },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-900 bg-transparent font-sans">
      {/* SideNavBar (Desktop - Floating Glassmorphic Collapsible) */}
      <div className="hidden md:block p-4 shrink-0 h-full transition-all duration-300 ease-in-out" style={{ width: isCollapsed ? '96px' : '280px' }}>
        <nav className="h-full w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl flex flex-col p-3.5 gap-3 shadow-xl shadow-slate-100/40 relative overflow-hidden transition-all duration-300">
          
          {/* Header & Collapse Toggle */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-2 pb-3 border-b border-slate-100 transition-all duration-300`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <img src="/logo-onesubs.webp" alt="OneSubscribe Logo" className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200/60 shadow-xs" />
                <div className="truncate">
                  <h2 className="text-xs font-black text-slate-900 leading-tight tracking-tight">Admin Panel</h2>
                  <p className="text-[9px] font-extrabold text-blue-600 mt-0.5 tracking-wider uppercase">OneSubscribe</p>
                </div>
              </div>
            ) : (
              <img src="/logo-onesubs.webp" alt="OneSubscribe Logo" className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200/60 shadow-xs" />
            )}

            <button
              onClick={toggleSidebar}
              title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
              className={`p-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-500 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-2xs ${isCollapsed ? 'mt-2' : ''}`}
            >
              <span className="material-symbols-outlined text-[18px] transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                menu_open
              </span>
            </button>
          </div>

          {/* Nav Items List */}
          <div className="flex flex-col gap-1.5 flex-grow overflow-y-auto no-scrollbar py-1">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl transition-all duration-200 no-underline group relative`}
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-blue-600'}`}
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className={`text-xs tracking-tight truncate ${isActive ? 'text-white font-bold' : 'text-slate-700 group-hover:text-blue-700 font-semibold'}`}>
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip on Collapsed State */}
                    {isCollapsed && (
                      <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-lg z-50 animate-fadeIn">
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>

          {/* Bottom Actions: View Store, View User, Logout */}
          <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-1.5">
            <Link
              to="/"
              title={isCollapsed ? "Lihat Katalog" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'} border border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700 rounded-xl text-xs font-bold transition-all no-underline shadow-2xs group relative`}
            >
              <span className="material-symbols-outlined text-[18px] text-slate-600 shrink-0 group-hover:text-blue-600">storefront</span>
              {!isCollapsed && <span className="truncate text-xs">Lihat Katalog</span>}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-lg z-50">
                  Lihat Katalog
                </span>
              )}
            </Link>

            <Link
              to="/dashboard"
              title={isCollapsed ? "Lihat Sebagai User" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'} border border-slate-200/70 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700 rounded-xl text-xs font-bold transition-all no-underline shadow-2xs group relative`}
            >
              <span className="material-symbols-outlined text-[18px] text-slate-600 shrink-0 group-hover:text-blue-600">switch_account</span>
              {!isCollapsed && <span className="truncate text-xs">Lihat User</span>}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-lg z-50">
                  Lihat Sebagai User
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              title={isCollapsed ? "Keluar" : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'} border border-red-200/70 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans shadow-2xs group relative`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">logout</span>
              {!isCollapsed && <span className="truncate text-xs">Keluar</span>}
              {isCollapsed && (
                <span className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 rounded-lg bg-rose-900 text-white text-[11px] font-bold whitespace-nowrap shadow-lg z-50">
                  Keluar
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* SideNavBar (Mobile Overlay Drawer) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="relative flex h-screen w-64 bg-white border-r border-slate-200 flex-col p-4 gap-4 z-50 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/logo-onesubs.webp" alt="OneSubscribe Logo" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">Admin Panel</h2>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">System Overview</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-700 hover:opacity-75 bg-transparent border-0 cursor-pointer flex items-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 flex-grow">
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      analytics
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Statistics
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      inventory_2
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Products
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      category
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Categories
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      receipt_long
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Orders
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      bar_chart
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Reports
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      group
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Users
                    </span>
                  </>
                )}
              </Link>

              {/* Link: Templates */}
              <Link
                to="/admin/templates"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      chat_bubble
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Templates
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      settings
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Settings
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group"
                activeProps={{ className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-500/25' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-blue-50/70 hover:text-blue-700 font-medium' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      person
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                      Profile
                    </span>
                  </>
                )}
              </Link>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:scale-95 transition-transform no-underline"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Lihat Katalog
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:scale-95 transition-transform no-underline"
              >
                <span className="material-symbols-outlined text-[18px]">switch_account</span>
                Lihat Sebagai User
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50/50 hover:bg-red-100/70 text-red-600 py-2.5 rounded-xl text-xs font-bold hover:scale-95 transition-transform cursor-pointer font-sans mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 overflow-y-auto bg-transparent flex flex-col min-h-screen">
        {/* Mobile Top Nav (visible only on mobile) */}
        <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex justify-between items-center w-full shadow-xs">
          <h1 className="text-lg font-black text-slate-900 tracking-tight">OneSubscribe</h1>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-700 bg-transparent border-0 cursor-pointer flex items-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Main Content Canvas Wrap */}
        <div className="max-w-container-max w-full mx-auto px-6 py-8 md:py-12 flex flex-col gap-10">
          <div className="page-transition flex flex-col gap-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

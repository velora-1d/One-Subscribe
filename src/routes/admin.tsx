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
    <div className="flex h-screen w-screen overflow-hidden text-slate-900 bg-transparent font-sans">
      {/* SideNavBar (Desktop - Floating Glassmorphic) */}
      <div className="hidden md:block p-4 shrink-0 h-full">
        <nav className="h-full w-64 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl flex flex-col p-5 gap-4 shadow-xl shadow-slate-100/40">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo-onesubs.webp" alt="OneSubscribe Logo" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200/50 shadow-sm" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Admin Panel</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wide uppercase">System Overview</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-grow">
            {/* Link: Statistics */}
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    analytics
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Statistics
                  </span>
                </>
              )}
            </Link>

            {/* Link: Products */}
            <Link
              to="/admin/products"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    inventory_2
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Products
                  </span>
                </>
              )}
            </Link>

            {/* Link: Categories */}
            <Link
              to="/admin/categories"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    category
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Categories
                  </span>
                </>
              )}
            </Link>

            {/* Link: Orders */}
            <Link
              to="/admin/orders"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    receipt_long
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Orders
                  </span>
                </>
              )}
            </Link>

            {/* Link: Reports */}
            <Link
              to="/admin/reports"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    bar_chart
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Reports
                  </span>
                </>
              )}
            </Link>

            {/* Link: Users */}
            <Link
              to="/admin/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    group
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Users
                  </span>
                </>
              )}
            </Link>

            {/* Link: Promos */}
            <Link
              to="/admin/promos"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    local_offer
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Promos
                  </span>
                </>
              )}
            </Link>

            {/* Link: Templates */}
            <Link
              to="/admin/templates"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    chat_bubble
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Templates
                  </span>
                </>
              )}
            </Link>

            {/* Link: Settings */}
            <Link
              to="/admin/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    settings
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Settings
                  </span>
                </>
              )}
            </Link>

            {/* Link: Profile */}
            <Link
              to="/admin/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 no-underline group hover:scale-[1.02]"
              activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800' }}
              inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'text-white font-bold' : 'text-slate-500 group-hover:text-slate-700'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    person
                  </span>
                  <span className={`text-sm font-semibold ${isActive ? 'text-white font-bold' : 'text-slate-600 group-hover:text-slate-800'}`}>
                    Profile
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Bottom Section: Navigation & Logout */}
          <div className="mt-auto pt-4 border-t border-slate-200/60 flex flex-col gap-2">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 border border-slate-200/60 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:scale-95 transition-all no-underline shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              Lihat Katalog
            </Link>
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center gap-2 border border-slate-200/60 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:scale-95 transition-all no-underline shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px]">switch_account</span>
              Lihat Sebagai User
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50/50 hover:bg-red-100/70 text-red-600 py-2.5 rounded-xl text-xs font-bold hover:scale-95 transition-all cursor-pointer font-sans mt-1"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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
                activeProps={{ className: 'bg-slate-900 text-white font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
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

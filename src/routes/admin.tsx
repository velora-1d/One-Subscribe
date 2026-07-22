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
    <div className="flex h-screen w-screen overflow-hidden text-slate-900 bg-[#FCFBF7] font-sans">
      {/* SideNavBar (Desktop) */}
      <nav className="hidden md:flex h-screen w-64 bg-white border-r border-slate-200 flex-col p-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 font-extrabold text-slate-800 text-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">Admin Panel</h2>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">System Overview</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-grow">
          {/* Link: Statistics */}
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  analytics
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Statistics
                </span>
              </>
            )}
          </Link>

          {/* Link: Products */}
          <Link
            to="/admin/products"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  inventory_2
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Products
                </span>
              </>
            )}
          </Link>

          {/* Link: Categories */}
          <Link
            to="/admin/categories"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  category
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Categories
                </span>
              </>
            )}
          </Link>

          {/* Link: Orders */}
          <Link
            to="/admin/orders"
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
                  Orders
                </span>
              </>
            )}
          </Link>

          {/* Link: Users */}
          <Link
            to="/admin/users"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  group
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Users
                </span>
              </>
            )}
          </Link>

          {/* Link: Settings */}
          <Link
            to="/admin/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
            activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
            inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  settings
                </span>
                <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  Settings
                </span>
              </>
            )}
          </Link>

          {/* Link: Profile */}
          <Link
            to="/admin/profile"
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
                  Profile
                </span>
              </>
            )}
          </Link>
        </div>

        {/* Bottom Section: Navigation & Logout */}
        <div className="mt-auto pt-4 border-t border-slate-200 flex flex-col gap-2">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            Lihat Katalog
          </Link>
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">switch_account</span>
            Lihat Sebagai User
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100/80 text-red-600 py-2.5 rounded-lg text-xs font-bold hover:scale-95 transition-transform cursor-pointer font-sans mt-1"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </nav>

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
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 font-extrabold text-slate-800 text-sm shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
                </div>
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
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      analytics
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Statistics
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      inventory_2
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Products
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/categories"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      category
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Categories
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/orders"
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
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Orders
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      group
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Users
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 no-underline"
                activeProps={{ className: 'bg-slate-100 text-slate-900 font-bold shadow-sm' }}
                inactiveProps={{ className: 'text-slate-600 hover:bg-slate-50' }}
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      settings
                    </span>
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                      Settings
                    </span>
                  </>
                )}
              </Link>

              <Link
                to="/admin/profile"
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
                    <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
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
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Lihat Katalog
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold hover:scale-95 transition-transform no-underline"
              >
                <span className="material-symbols-outlined text-[18px]">switch_account</span>
                Lihat Sebagai User
              </Link>
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
        <div className="max-w-container-max w-full mx-auto px-6 py-8 md:py-12 flex flex-col gap-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

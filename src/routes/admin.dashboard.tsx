import { createFileRoute, Link } from '@tanstack/react-router'
import { getAdminStats } from '../utils/admin.functions'

export const Route = createFileRoute('/admin/dashboard')({
  loader: async () => {
    try {
      const res = await getAdminStats()
      return {
        stats: res.success ? res.stats : null,
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { stats: null, error: err?.message || 'Gagal memuat statistik' }
    }
  },
  component: AdminDashboardPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function AdminDashboardPage() {
  const { stats, error } = Route.useLoaderData()

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-600 text-sm font-semibold">
        Error loading admin statistics: {error || 'Unknown error'}
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            Unpaid
          </span>
        )
      case 'menunggu_aktivasi':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
            Fulfill Required
          </span>
        )
      case 'aktif':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            Fulfilled
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-12 w-full text-left font-sans">
      {/* Dashboard Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 font-display">Overview</h1>
        <p className="text-sm text-slate-500 font-medium">Welcome back. Here is the latest system data.</p>
      </header>

      {/* Key Metrics Grid (Bento style) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between min-h-[160px] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600 flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-200">+12.5%</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-3xl font-bold text-slate-900 font-display">{formatIDR(stats.totalRevenue)}</h3>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between min-h-[160px] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600 flex items-center justify-center">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-200">+5.2%</span>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Active Users</p>
            <h3 className="text-3xl font-bold text-slate-900 font-display">{stats.totalCustomers}</h3>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between min-h-[160px] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg flex items-center justify-center ${stats.pendingActivations > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
              <span className="material-symbols-outlined">hourglass_empty</span>
            </div>
            {stats.pendingActivations > 0 ? (
              <span className="text-[11px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-200">Action Required</span>
            ) : (
              <span className="text-[11px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">Up to Date</span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Pending Orders</p>
            <h3 className="text-3xl font-bold text-slate-900 font-display">{stats.pendingActivations}</h3>
          </div>
        </div>
      </section>

      {/* Orders Management Table Section */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900 font-display">Recent Orders</h2>
          <button className="text-xs text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 bg-transparent border-0 cursor-pointer font-sans font-bold">
            <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
          </button>
        </div>

        {stats.recentOrders.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 border-b border-slate-200">Order ID</th>
                  <th className="px-6 py-4 border-b border-slate-200">Customer</th>
                  <th className="px-6 py-4 border-b border-slate-200">Product</th>
                  <th className="px-6 py-4 border-b border-slate-200">Status</th>
                  <th className="px-6 py-4 border-b border-slate-200 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {stats.recentOrders.map((order) => {
                  const initials = order.customerName ? order.customerName.slice(0, 2).toUpperCase() : 'CU'
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200/50">
                            {initials}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-slate-900 leading-tight">{order.customerName}</span>
                            <span className="text-[11px] text-slate-400 font-semibold mt-0.5">pelanggan@onesubscribe.com</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{order.productName}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right pr-12">
                        <div className="flex justify-end gap-2">
                          <Link
                            to="/admin/orders"
                            className="inline-flex items-center justify-center bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:scale-95 transition-all no-underline shadow-sm hover:bg-slate-800"
                          >
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-sm italic text-slate-400 font-medium bg-white">
            Belum ada pesanan masuk.
          </div>
        )}
      </section>
    </div>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminStats } from '../utils/admin.functions'
import { DashboardSkeleton } from '../components/ui/skeletons'

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
  pendingComponent: DashboardSkeleton,
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
  const [statusFilter, setStatusFilter] = useState<'semua' | 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired'>('semua')

  const filteredOrders = !stats ? [] : statusFilter === 'semua'
    ? stats.recentOrders
    : stats.recentOrders.filter((order: any) => order.status === statusFilter)

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
    <div className="flex flex-col gap-8 w-full text-left font-sans">
      {/* Dashboard Header */}
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">analytics</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Overview</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Welcome back. Here is the latest system data.</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Live
          </span>
        </div>
      </header>

      {/* Key Metrics Grid (Bento style) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/* 1. Total Revenue */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">payments</span>
            </div>
            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Total Revenue</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight line-clamp-1">{formatIDR(stats.totalRevenue)}</h3>
          </div>
        </div>

        {/* 2. Active Customers */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">group</span>
            </div>
            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">Active</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Active Users</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalCustomers}</h3>
          </div>
        </div>

        {/* 3. Pending Activations */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 ${stats.pendingActivations > 0 ? 'bg-amber-500/10 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              <span className="material-symbols-outlined text-[18px] font-bold">hourglass_empty</span>
            </div>
            {stats.pendingActivations > 0 ? (
              <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 animate-bounce">Pending</span>
            ) : (
              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">Done</span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Pending Orders</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.pendingActivations}</h3>
          </div>
        </div>

        {/* 4. Active Subscriptions */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-teal-500/10 text-teal-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">card_membership</span>
            </div>
            <span className="text-[9px] font-black bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full border border-teal-100">Active</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Active Subs</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.activeOrders}</h3>
          </div>
        </div>

        {/* 5. Unpaid Orders */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">pending_actions</span>
            </div>
            <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">Unpaid</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Unpaid Orders</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.unpaidOrders}</h3>
          </div>
        </div>

        {/* 6. Total Orders */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">shopping_bag</span>
            </div>
            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">Total</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Total Orders</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalOrders}</h3>
          </div>
        </div>

        {/* 7. Average Order Value */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-violet-500/10 text-violet-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">account_balance_wallet</span>
            </div>
            <span className="text-[9px] font-black bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-100">AOV</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Avg Order Value</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight line-clamp-1">{formatIDR(stats.avgOrderValue)}</h3>
          </div>
        </div>

        {/* 8. Total Products */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-sky-500/10 text-sky-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">inventory</span>
            </div>
            <span className="text-[9px] font-black bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full border border-sky-100">Catalog</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Total Products</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalProducts}</h3>
          </div>
        </div>

        {/* 9. Total Categories */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-pink-500/10 text-pink-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">category</span>
            </div>
            <span className="text-[9px] font-black bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100">Kategori</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Total Categories</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalCategories}</h3>
          </div>
        </div>

        {/* 10. Expired Subscriptions */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-lg shadow-slate-100/20 transition-all hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-slate-500/10 text-slate-600 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[18px] font-bold">event_busy</span>
            </div>
            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">Expired</span>
          </div>
          <div className="mt-3">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">Expired Subs</p>
            <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.expiredOrders}</h3>
          </div>
        </div>
      </section>

      {/* Orders Management Table Section */}
      <section className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-slate-100/40">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/40">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Recent Orders</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-900 transition font-medium cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
              <option value="menunggu_aktivasi">Menunggu Aktivasi</option>
              <option value="aktif">Aktif</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/20 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="pl-6 pr-2 py-4 w-16 text-left whitespace-nowrap">No</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {filteredOrders.map((order: any, index: number) => {
                  const initials = order.customerName ? order.customerName.slice(0, 2).toUpperCase() : 'CU'
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="pl-6 pr-2 py-4 text-left font-bold text-slate-400 w-16 whitespace-nowrap">{index + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">#{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-700 border border-slate-200/60 shadow-2xs">
                            {initials}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-slate-900 leading-tight">{order.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{order.customerEmail || 'pelanggan@onesubscribe.com'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex flex-col">
                          <span>{order.productName}</span>
                          {order.parentOrderId && (
                            <span className="inline-flex self-start mt-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-50 border border-indigo-150 text-indigo-600 uppercase tracking-wide">
                              Perpanjangan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right pr-12">
                        <div className="flex justify-end gap-2">
                          <Link
                            to="/admin/orders"
                            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-95 transition-all no-underline shadow-sm"
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
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 max-w-sm mx-auto shadow-xs flex flex-col items-center mt-6">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
              <span className="material-symbols-outlined text-2xl">inbox</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">Pesanan Kosong</h3>
            <p className="text-[11px] text-slate-400 font-semibold max-w-[240px] text-center leading-relaxed">
              Tidak ada data pesanan transaksi yang masuk dengan status terpilih.
            </p>
          </div>
        )}</section>
    </div>
  )
}

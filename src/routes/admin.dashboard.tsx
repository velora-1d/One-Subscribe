import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminStats } from '../utils/admin.functions'
import { DashboardSkeleton } from '../components/ui/skeletons'

export const Route = createFileRoute('/admin/dashboard')({
  ssr: false,
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Belum Bayar
          </span>
        )
      case 'menunggu_aktivasi':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70 shadow-2xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
            </span>
            Butuh Aktivasi
          </span>
        )
      case 'aktif':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Aktif
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Kedaluwarsa
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full text-left font-sans">
      {/* Dashboard Header - Glassmorphic Hero */}
      <header className="relative bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500" />
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-blue-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
            <span className="material-symbols-outlined text-[26px]">analytics</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Ringkasan Sistem</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Selamat datang, Administrator. Pantau performa langganan dan pendapatan secara real-time.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            Sistem Aktif
          </span>
        </div>
      </header>

      {/* Key Metrics Grid - Ultra Aesthetic Bento Cards (No Purple) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {/* 1. Total Revenue (Primary Accent Card) */}
        <div className="bg-gradient-to-b from-white/95 to-emerald-50/20 backdrop-blur-xl border border-emerald-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200/50 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">payments</span>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">Live</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Total Pendapatan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight line-clamp-1">{formatIDR(stats.totalRevenue)}</h3>
          </div>
        </div>

        {/* 2. Active Customers */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-blue-300/70 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center border border-blue-200/50 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">group</span>
            </div>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">Aktif</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Total Pelanggan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalCustomers}</h3>
          </div>
        </div>

        {/* 3. Pending Activations */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-amber-300/70 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className={`p-2.5 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform ${stats.pendingActivations > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span className="material-symbols-outlined text-[20px] font-bold">hourglass_empty</span>
            </div>
            {stats.pendingActivations > 0 ? (
              <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">Menunggu</span>
            ) : (
              <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">Selesai</span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Butuh Aktivasi</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.pendingActivations}</h3>
          </div>
        </div>

        {/* 4. Active Subscriptions */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-sky-300/70 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-sky-500/10 text-sky-600 rounded-xl flex items-center justify-center border border-sky-200/50 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">card_membership</span>
            </div>
            <span className="text-[10px] font-extrabold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200/60">Aktif</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Langganan Aktif</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.activeOrders}</h3>
          </div>
        </div>

        {/* 5. Unpaid Orders */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-rose-300/70 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center border border-rose-200/50 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">pending_actions</span>
            </div>
            <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/60">Belum Bayar</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Pesanan Belum Bayar</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.unpaidOrders}</h3>
          </div>
        </div>

        {/* 6. Total Orders */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-blue-300/70 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-600/10 text-blue-700 rounded-xl flex items-center justify-center border border-blue-200/50 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">shopping_bag</span>
            </div>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">Total</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Total Pesanan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalOrders}</h3>
          </div>
        </div>

        {/* 7. Average Order Value */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-cyan-300/70 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-cyan-600/10 text-cyan-700 rounded-xl flex items-center justify-center border border-cyan-200/50 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">account_balance_wallet</span>
            </div>
            <span className="text-[10px] font-extrabold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200/60">AOV</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Rata-rata Pesanan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight line-clamp-1">{formatIDR(stats.avgOrderValue)}</h3>
          </div>
        </div>

        {/* 8. Total Products */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-slate-600/10 text-slate-700 rounded-xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">inventory_2</span>
            </div>
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">Katalog</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Total Produk</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalProducts}</h3>
          </div>
        </div>

        {/* 9. Total Categories (Teal) */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-teal-300 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-teal-500/10 text-teal-600 rounded-xl flex items-center justify-center border border-teal-200/50 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">category</span>
            </div>
            <span className="text-[10px] font-extrabold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200/60">Kategori</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Total Kategori</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.totalCategories}</h3>
          </div>
        </div>

        {/* 10. Expired Subscriptions */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 group cursor-default">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-slate-400/10 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px] font-bold">event_busy</span>
            </div>
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">Kedaluwarsa</span>
          </div>
          <div className="mt-3">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Langganan Kedaluwarsa</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1.5 tracking-tight">{stats.expiredOrders}</h3>
          </div>
        </div>
      </section>

      {/* Orders Management Table Section - Polished Glassmorphism */}
      <section className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">receipt_long</span>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Pesanan Terbaru</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu_pembayaran">Belum Bayar</option>
              <option value="menunggu_aktivasi">Butuh Aktivasi</option>
              <option value="aktif">Aktif</option>
              <option value="expired">Kedaluwarsa</option>
            </select>
          </div>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/70 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200/60">
                  <th className="pl-6 pr-2 py-3.5 w-14 text-left whitespace-nowrap">No</th>
                  <th className="px-6 py-3.5">ID Pesanan</th>
                  <th className="px-6 py-3.5">Pelanggan</th>
                  <th className="px-6 py-3.5">Produk Layanan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right pr-8">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {filteredOrders.map((order: any, index: number) => {
                  const initials = order.customerName ? order.customerName.slice(0, 2).toUpperCase() : 'CU'
                  return (
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="pl-6 pr-2 py-4 text-left font-bold text-slate-400 w-14 whitespace-nowrap">{index + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          #{order.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-xs font-black text-white shadow-2xs shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-extrabold text-slate-900 leading-tight">{order.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">{order.customerEmail || 'pelanggan@onesubscribe.com'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">{order.productName}</span>
                          {order.parentOrderId && (
                            <span className="inline-flex self-start mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wide">
                              Perpanjangan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Link
                            to="/admin/orders"
                            className="inline-flex items-center justify-center bg-slate-900 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all no-underline shadow-2xs"
                          >
                            Kelola
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
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 max-w-sm mx-auto shadow-xs flex flex-col items-center my-8">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 mb-4 shadow-3xs">
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

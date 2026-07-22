import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getMyOrders } from '../utils/order.functions'

export const Route = createFileRoute('/dashboard/orders')({
  loader: async () => {
    try {
      const res = await getMyOrders()
      return {
        orders: res.success ? res.orders : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { orders: [], error: err?.message || 'Gagal memuat riwayat pesanan' }
    }
  },
  component: DashboardOrdersPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function DashboardOrdersPage() {
  const { orders, error } = Route.useLoaderData()
  const [currentPage, setCurrentPage] = useState(1)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return (
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            Menunggu Pembayaran
          </span>
        )
      case 'menunggu_aktivasi':
        return (
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            Menunggu Aktivasi
          </span>
        )
      case 'aktif':
        return (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            Aktif
          </span>
        )
      case 'expired':
        return (
          <span className="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            Expired
          </span>
        )
      default:
        return null
    }
  }

  const itemsPerPage = 5
  const totalPages = Math.ceil(orders.length / itemsPerPage)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedOrders = orders.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  return (
    <div className="space-y-8 font-sans text-left">
      {/* Title Panel */}
      <header className="relative bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Riwayat Pesanan Saya
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Daftar seluruh transaksi pemesanan langganan digital Anda.
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {orders.length > 0 ? (
        <div className="island-shell border border-[var(--line)] rounded-3xl overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-[var(--sea-ink-soft)]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--chip-bg)] text-xs font-bold uppercase tracking-wider text-[var(--sea-ink)]">
                  <th className="pl-6 pr-2 py-4 w-16 text-left text-[var(--sea-ink)] whitespace-nowrap">No</th>
                  <th className="px-6 py-4">ID Pesanan & Tanggal</th>
                  <th className="px-6 py-4">Layanan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Bayar</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-[var(--header-bg)]">
                {paginatedOrders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-[var(--link-bg-hover)] transition">
                    <td className="pl-6 pr-2 py-4 text-left font-bold text-[var(--sea-ink-soft)] w-16 whitespace-nowrap">{((activePage - 1) * itemsPerPage) + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="block text-xs font-bold text-[var(--sea-ink)]">{order.id}</strong>
                      <span className="text-[10px] text-[var(--sea-ink-soft)]">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {order.productImageUrl && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 border border-[var(--line)] flex-shrink-0">
                            <img src={order.productImageUrl} alt={order.productName} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <strong className="text-xs font-bold text-[var(--sea-ink)] block">{order.productName}</strong>
                          <span className="text-[10px] text-[var(--sea-ink-soft)] font-semibold uppercase tracking-wider">
                            {order.productCategory} • {order.remainingDuration} Bln
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-[var(--sea-ink)]">
                      {formatIDR(order.price)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {order.status === 'menunggu_pembayaran' && order.paymentRedirectUrl && (
                        <a
                          href={order.paymentRedirectUrl}
                          className="inline-block rounded-full bg-amber-500 hover:bg-amber-600 px-4.5 py-1.5 text-xs font-extrabold text-white shadow-sm no-underline transition"
                        >
                          Bayar
                        </a>
                      )}
                      {order.status === 'menunggu_aktivasi' && (
                        <span className="text-xs text-[var(--sea-ink-soft)] font-bold italic">
                          Menunggu Aktivasi
                        </span>
                      )}
                      {order.status === 'aktif' && (
                        <Link
                          to="/dashboard"
                          className="inline-block rounded-full bg-[var(--lagoon-deep)] hover:opacity-90 px-4.5 py-1.5 text-xs font-extrabold text-white shadow-sm no-underline transition"
                        >
                          Layanan
                        </Link>
                      )}
                      {order.status === 'expired' && (
                        <span className="text-xs text-red-500 font-bold">
                          Expired
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] font-semibold text-left">
                <div>
                  Menampilkan {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, orders.length)} dari {orders.length} entri
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7.5 h-7.5 rounded-lg text-center cursor-pointer transition ${
                          activePage === pageNum
                            ? 'bg-slate-900 border border-slate-900 text-white font-extrabold shadow-sm'
                            : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-bold'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 island-shell border border-[var(--line)] rounded-3xl">
          <svg className="mx-auto h-12 w-12 text-[var(--sea-ink-soft)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-bold text-[var(--sea-ink)] mb-1">Belum Ada Transaksi</h3>
          <p className="text-sm text-[var(--sea-ink-soft)] max-w-sm mx-auto mb-6">
            Anda belum pernah melakukan pemesanan layanan premium apa pun.
          </p>
          <Link
            to="/"
            className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:scale-95 hover:bg-slate-800 transition-all no-underline"
          >
            Lihat Katalog Layanan
          </Link>
        </div>
      )}
    </div>
  )
}

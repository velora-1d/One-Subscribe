import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { getMyOrders, cancelOrder } from '../utils/order.functions'
import { PageTableSkeleton } from '../components/ui/skeletons'

export const Route = createFileRoute('/dashboard/orders')({
  ssr: false,
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
  pendingComponent: PageTableSkeleton,
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
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orderToCancel, setOrderToCancel] = useState<any>(null)
  const [isCanceling, setIsCanceling] = useState(false)

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return
    setIsCanceling(true)
    try {
      const res = await cancelOrder({ data: orderToCancel.id })
      if (res.success) {
        toast.success('Pesanan berhasil dibatalkan.')
        setOrderToCancel(null)
        router.invalidate()
      } else {
        toast.error(res.error || 'Gagal membatalkan pesanan.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsCanceling(false)
    }
  }

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
      case 'dibatalkan':
        return (
          <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full whitespace-nowrap">
            Dibatalkan
          </span>
        )
      default:
        return null
    }
  }


  const totalPages = Math.ceil(orders.length / itemsPerPage)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedOrders = orders.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  return (
    <div className="space-y-8 font-sans text-left">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4 group">
        <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        Kembali ke Dashboard
      </Link>

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
                      <div className="flex items-center justify-center gap-2">
                        {order.status === 'menunggu_pembayaran' && (
                          <div className="flex items-center gap-1.5">
                            {order.paymentRedirectUrl && (
                              <a
                                href={order.paymentRedirectUrl}
                                className="inline-block rounded-full bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm no-underline transition"
                              >
                                Bayar
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setOrderToCancel(order)}
                              className="rounded-full bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition cursor-pointer"
                              title="Batalkan Pesanan Ini"
                            >
                              Batalkan
                            </button>
                          </div>
                        )}
                        {order.status === 'menunggu_aktivasi' && (
                          <span className="text-xs text-[var(--sea-ink-soft)] font-bold italic">
                            Aktivasi
                          </span>
                        )}
                        {order.status === 'aktif' && (
                          <Link
                            to="/dashboard"
                            className="inline-block rounded-full bg-[var(--lagoon-deep)] hover:opacity-90 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm no-underline transition"
                          >
                            Layanan
                          </Link>
                        )}
                        {order.status === 'expired' && (
                          <span className="text-xs text-red-500 font-bold">
                            Expired
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="h-7.5 w-7.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer shrink-0"
                          title="Lihat Struk"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {orders.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] font-semibold text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Menampilkan {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, orders.length)} dari {orders.length} entri
                  </span>
                  <div className="flex items-center gap-1.5 ml-0 sm:ml-2 border-l border-slate-200 pl-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tampilkan:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="rounded-lg border border-slate-250 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 focus:border-slate-900 outline-none transition cursor-pointer font-sans"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={40}>40</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                {totalPages > 1 && (
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
                )}
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

      {/* Premium Printable Receipt Modal */}
      {mounted && selectedOrder && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 flex flex-col gap-5 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-700">receipt</span>
                Invoice Preview
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer flex items-center p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Printable Area */}
            <div 
              id="print-receipt-area" 
              className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto text-left relative"
            >
              {/* LUNAS Watermark */}
              {(selectedOrder.status === 'aktif' || selectedOrder.status === 'menunggu_aktivasi') && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                  <div className="border-[6px] border-emerald-500/10 rounded-2xl px-6 py-2 rotate-[-25deg] text-center">
                    <span className="text-5xl font-black text-emerald-500/10 tracking-widest uppercase">LUNAS</span>
                  </div>
                </div>
              )}
              {/* Logo & Inv Header */}
              <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4 z-10">
                <div className="flex items-center gap-2">
                  <img src="/logo-onesubs.webp" className="w-8 h-8 rounded-full object-cover" alt="Logo" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 leading-tight">OneSubscribe</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Digital Shop</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs text-slate-800 tracking-wider">STRUK RESMI</span>
                  <p className="text-[9px] text-slate-400 font-mono">ID: {selectedOrder.id}</p>
                </div>
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-dashed border-slate-200 pb-4">
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Tanggal</span>
                  <span className="font-bold text-slate-700">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Status</span>
                  <span className={`inline-block font-extrabold text-[9px] px-2 py-0.5 rounded-full border ${
                    selectedOrder.status === 'aktif' ? 'text-emerald-700 bg-emerald-50 border-emerald-250' :
                    selectedOrder.status === 'menunggu_aktivasi' ? 'text-blue-700 bg-blue-50 border-blue-255' :
                    selectedOrder.status === 'menunggu_pembayaran' ? 'text-amber-700 bg-amber-50 border-amber-255' :
                    'text-slate-500 bg-slate-50 border-slate-255'
                  }`}>
                    {selectedOrder.status === 'aktif' ? 'Layanan Aktif' :
                     selectedOrder.status === 'menunggu_aktivasi' ? 'Menunggu Aktivasi' :
                     selectedOrder.status === 'menunggu_pembayaran' ? 'Menunggu Pembayaran' :
                     'Expired'}
                  </span>
                </div>
              </div>

              {/* Customer billing details */}
              <div className="text-xs border-b border-dashed border-slate-200 pb-4">
                <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-1.5">Pelanggan</span>
                <strong className="text-slate-800 block">{user?.name}</strong>
                <span className="text-slate-500 block">{user?.email}</span>
                {user?.whatsapp && (
                  <span className="text-slate-400 text-[10px] mt-0.5 block">{user.whatsapp}</span>
                )}
              </div>

              {/* Purchase Details */}
              <div className="text-xs border-b border-dashed border-slate-200 pb-4">
                <div className="flex justify-between font-bold text-[9px] text-slate-400 uppercase tracking-wider mb-2.5">
                  <span>Deskripsi</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-slate-800 text-xs block">{selectedOrder.productName}</strong>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">
                      {selectedOrder.productCategory} • {selectedOrder.remainingDuration} Bulan
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">{formatIDR(selectedOrder.price)}</span>
                </div>
              </div>

              {/* Order Total summary */}
              <div className="text-xs flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-700">{formatIDR(selectedOrder.price)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Biaya Admin</span>
                  <span className="text-slate-700">{formatIDR(0)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-800 border-t border-slate-200/60 pt-2.5 mt-1">
                  <span>Total Bayar</span>
                  <span>{formatIDR(selectedOrder.price)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-100/60 rounded-xl p-3 flex flex-col gap-1.5 z-10 mt-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Gateway Pembayaran:</span>
                  <span className="font-bold text-slate-700 font-sans">
                    {selectedOrder.paymentMethod?.toLowerCase() === 'pakasir' || selectedOrder.paymentMethod?.toLowerCase() === 'midtrans'
                      ? 'OneSubscribe'
                      : (selectedOrder.paymentMethod || 'OneSubscribe')}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Metode Bayar:</span>
                  <span className="font-bold text-slate-700">QRIS / VA Transfer (Otomatis)</span>
                </div>
              </div>

              {/* Invoice Footer Notes */}
              <div className="text-center text-[9px] text-slate-400 font-semibold pt-3 border-t border-slate-100 flex flex-col gap-0.5 mt-2">
                <p>Terima kasih atas pembelian Anda!</p>
                <p className="text-[8px] text-slate-350">Struk elektronik ini valid dan diterbitkan otomatis oleh sistem OneSubscribe.</p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex gap-3 mt-1 no-print">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-xl bg-slate-55 border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-md hover:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5 border-0"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Cetak / Save PDF
              </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #print-receipt-area, #print-receipt-area * {
                  visibility: visible !important;
                }
                #print-receipt-area {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  margin: 0 !important;
                  padding: 24px !important;
                  background: white !important;
                  color: black !important;
                  box-shadow: none !important;
                  border: none !important;
                  z-index: 9999999 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />
          </div>
        </div>,
        document.body
      )}

      {/* Custom Aesthetic Cancel Order Modal */}
      {orderToCancel && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4 text-left font-sans animate-in zoom-in-95 duration-150 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 m-0">Batalkan Pesanan?</h3>
                <p className="text-[11px] text-slate-500 font-medium m-0 mt-0.5">
                  ID: <span className="font-mono text-slate-800 font-bold">{orderToCancel.id}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">
              Apakah Anda yakin ingin membatalkan pesanan untuk layanan <span className="font-bold text-slate-900">{orderToCancel.productName}</span>? Pesanan yang dibatalkan tidak dapat diproses kembali.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                disabled={isCanceling}
                className="px-4 py-2 border border-slate-200 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmCancelOrder}
                disabled={isCanceling}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border-0 shadow-sm"
              >
                <span className="material-symbols-outlined text-[14px]">cancel</span>
                {isCanceling ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

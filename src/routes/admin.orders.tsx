import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminOrders, fulfillOrder, cancelAdminOrder, deleteAdminOrder } from '../utils/admin.functions'

export const Route = createFileRoute('/admin/orders')({
  loader: async () => {
    try {
      const res = await getAdminOrders()
      return {
        orders: res.success ? res.orders : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { orders: [], error: err?.message || 'Gagal memuat daftar pesanan' }
    }
  },
  component: AdminOrdersPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function AdminOrdersPage() {
  const { orders: initialOrders, error } = Route.useLoaderData()
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState<'semua' | 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired'>('semua')

  // Fulfillment Dialog States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isFulfilling, setIsFulfilling] = useState(false)
  const [fulfillError, setFulfillError] = useState<string | null>(null)

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'cancel' | 'delete';
    orderId: string | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'cancel',
    orderId: null
  })

  // Custom Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  })

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleOpenFulfill = (orderId: string) => {
    setSelectedOrderId(orderId)
    setEmail('')
    setPassword('')
    setRemarks('')
    setFulfillError(null)
  }

  const handleCancelOrder = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Batalkan Pesanan',
      message: `Apakah Anda yakin ingin membatalkan pesanan ${orderId}? Status pesanan akan disetel menjadi Expired/Batal secara permanen.`,
      type: 'cancel',
      orderId
    })
  }

  const handleDeleteOrder = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pesanan Permanen',
      message: `Apakah Anda yakin ingin MENGHAPUS PERMANEN pesanan ${orderId}? Tindakan ini akan menghapus riwayat pesanan & kredensial terkait secara permanen dan tidak dapat dibatalkan.`,
      type: 'delete',
      orderId
    })
  }

  const handleConfirmAction = async () => {
    const { type, orderId } = confirmModal
    if (!orderId) return

    setConfirmModal(prev => ({ ...prev, isOpen: false }))

    try {
      if (type === 'cancel') {
        const res = await cancelAdminOrder({ data: orderId })
        if (res.success) {
          setOrders(
            orders.map((o) => (o.id === orderId ? { ...o, status: 'expired' } : o))
          )
          showToast(`Pesanan ${orderId} berhasil dibatalkan.`, 'success')
        } else {
          showToast(res.error || 'Gagal membatalkan pesanan.', 'error')
        }
      } else if (type === 'delete') {
        const res = await deleteAdminOrder({ data: orderId })
        if (res.success) {
          setOrders(orders.filter((o) => o.id !== orderId))
          showToast(`Pesanan ${orderId} berhasil dihapus permanen.`, 'success')
        } else {
          showToast(res.error || 'Gagal menghapus pesanan.', 'error')
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Terjadi kesalahan sistem.', 'error')
    }
  }

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderId) return

    setIsFulfilling(true)
    setFulfillError(null)

    try {
      const res = await fulfillOrder({
        data: {
          orderId: selectedOrderId,
          email,
          password,
          remarks,
        },
      })

      if (res.success) {
        setOrders(
          orders.map((o) => (o.id === selectedOrderId ? { ...o, status: 'aktif' } : o))
        )
        setSelectedOrderId(null)
        showToast(`Pesanan ${selectedOrderId} berhasil diaktivasi!`, 'success')
      } else {
        setFulfillError(res.error || 'Gagal mengirim kredensial.')
      }
    } catch (err: any) {
      setFulfillError(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsFulfilling(false)
    }
  }

  // Filter orders based on selected tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'semua') return true
    return o.status === activeTab
  })

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
            Butuh Aktivasi
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
            Batal / Expired
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Custom Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3.5 rounded-full shadow-lg border border-slate-800 animate-slideDown max-w-sm">
          <span className={`material-symbols-outlined text-[16px] font-bold ${
            toast.type === 'success' ? 'text-emerald-400' : toast.type === 'error' ? 'text-red-400' : 'text-blue-400'
          }`}>
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="text-[10px] font-extrabold tracking-wide whitespace-nowrap">
            {toast.message}
          </span>
        </div>
      )}

      {/* Title Panel */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--sea-ink)]">
          Manajemen Pesanan & Aktivasi Kredensial
        </h1>
        <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
          Pantau status tagihan pesanan, input kredensial premium akun pelanggan, & pantau durasi langganan.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex">
        <div className="flex flex-wrap bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 shadow-inner gap-1">
          {(['semua', 'menunggu_pembayaran', 'menunggu_aktivasi', 'aktif', 'expired'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {tab === 'semua' ? 'Semua Pesanan' : tab === 'menunggu_pembayaran' ? 'Unpaid' : tab === 'menunggu_aktivasi' ? 'Butuh Aktivasi' : tab === 'aktif' ? 'Aktif' : 'Expired'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="island-shell border border-[var(--line)] rounded-3xl p-0 overflow-hidden bg-[var(--header-bg)]">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--chip-bg)] border-b border-[var(--line)] font-bold uppercase tracking-wider text-[var(--sea-ink)]">
                  <th className="px-6 py-4">ID & Tanggal</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Layanan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Bayar</th>
                  <th className="px-6 py-4 text-center">Fulfill / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-[var(--sea-ink-soft)]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--link-bg-hover)] transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="block text-xs font-bold text-[var(--sea-ink)]">{order.id}</strong>
                      <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="block text-xs font-bold text-[var(--sea-ink)]">{order.customerName}</strong>
                      <span className="block">{order.customerEmail}</span>
                      <span className="block text-[10px] text-[var(--sea-ink-soft)]">{order.customerWhatsapp}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="block text-xs font-bold text-[var(--sea-ink)]">{order.productName}</strong>
                      <span className="text-[10px] uppercase font-bold">{order.remainingDuration} Bln</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-[var(--sea-ink)]">
                      {formatIDR(order.price)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {order.status === 'menunggu_aktivasi' && (
                          <button
                            onClick={() => handleOpenFulfill(order.id)}
                            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-3.5 py-1.5 text-[10px] font-extrabold cursor-pointer transition whitespace-nowrap"
                          >
                            Aktivasi Akun
                          </button>
                        )}
                        {order.status === 'aktif' && (
                          <button
                            onClick={() => handleOpenFulfill(order.id)}
                            className="rounded-full bg-[var(--chip-bg)] border border-[var(--chip-line)] hover:bg-slate-200 text-[var(--sea-ink)] px-3.5 py-1.5 text-[10px] font-bold cursor-pointer transition whitespace-nowrap"
                          >
                            Update Kredensial
                          </button>
                        )}
                        
                        {/* Cancel Button */}
                        {(order.status === 'menunggu_pembayaran' || order.status === 'menunggu_aktivasi') && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            title="Batalkan Pesanan"
                            className="h-7.5 w-7.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 transition cursor-pointer shrink-0 animate-fadeIn"
                          >
                            <span className="material-symbols-outlined text-[14px] font-bold">block</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Hapus Pesanan"
                          className="h-7.5 w-7.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-600 transition cursor-pointer shrink-0 animate-fadeIn"
                        >
                          <span className="material-symbols-outlined text-[14px] font-bold">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 italic text-xs">
            Belum ada pesanan dengan status terpilih.
          </div>
        )}
      </div>

      {/* Fulfillment Dialog Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[var(--header-bg)] border border-[var(--line)] rounded-[2rem] p-8 shadow-xl animate-fadeIn bg-white">
            <h2 className="text-lg font-extrabold text-[var(--sea-ink)] mb-1">
              Fulfillment Akun Premium
            </h2>
            <p className="text-[10px] text-[var(--sea-ink-soft)] mb-6">
              Kredensial email & password ini akan di-enkripsi di database sebelum disimpan demi keamanan pelanggan.
            </p>

            {fulfillError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">
                {fulfillError}
              </div>
            )}

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                  Email Akun Premium
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@premium-service.com"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                  Password Akun
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-slate-900 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                  Catatan Tambahan (Remarks)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Tulis informasi tambahan seperti profile user, durasi garansi, dll."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-slate-900 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isFulfilling}
                  className="rounded-full bg-slate-950 hover:bg-slate-900 text-white shadow-sm px-6 py-2.5 text-xs font-black transition cursor-pointer"
                >
                  {isFulfilling ? 'Mengaktifkan...' : 'Kirim Kredensial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white border border-[var(--line)] rounded-[2rem] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                confirmModal.type === 'delete' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              }`}>
                <span className="material-symbols-outlined text-[20px] font-bold">
                  {confirmModal.type === 'delete' ? 'delete' : 'block'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[var(--sea-ink)]">
                  {confirmModal.title}
                </h3>
                <p className="text-[9px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider mt-0.5">
                  Konfirmasi Admin
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed font-medium">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 text-[10px] font-bold cursor-pointer transition"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`rounded-full px-5 py-2 text-[10px] font-black text-white shadow-sm transition cursor-pointer ${
                  confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-200/50 shadow-md' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200/50 shadow-md'
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

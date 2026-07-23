import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { getAdminOrders, fulfillOrder, cancelAdminOrder, deleteAdminOrder, sendCustomWhatsapp, getAdminMessageTemplates } from '../utils/admin.functions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const WhatsappIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.497 1.45 5.416 1.451 5.416 0 9.825-4.41 9.829-9.823.002-2.623-1.02-5.088-2.88-6.95-1.86-1.862-4.322-2.883-6.942-2.884-5.421 0-9.83 4.41-9.834 9.822-.001 1.986.518 3.926 1.502 5.642l-.997 3.64 3.734-.979zm11.391-6.196c-.297-.148-1.758-.867-2.03-.967-.273-.099-.471-.148-.669.148-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.568-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
  </svg>
)

import { PageTableSkeleton } from '../components/ui/skeletons'

export const Route = createFileRoute('/admin/orders')({
  ssr: false,
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
  pendingComponent: PageTableSkeleton,
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
  const [activeTab, setActiveTab] = useState<'semua' | 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired' | 'dibatalkan'>('semua')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Mounted state for portals
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Fulfillment Dialog States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [targetOrder, setTargetOrder] = useState<any>(null)
  const [fulfillmentType, setFulfillmentType] = useState<string>('credentials')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isFulfilling, setIsFulfilling] = useState(false)
  const [fulfillError, setFulfillError] = useState<string | null>(null)

  // WhatsApp Modal States
  const [isWaModalOpen, setIsWaModalOpen] = useState(false)
  const [waTargetNumber, setWaTargetNumber] = useState('')
  const [waTargetName, setWaTargetName] = useState('')
  const [waMessage, setWaMessage] = useState('')
  const [isSendingWa, setIsSendingWa] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [checkedTemplates, setCheckedTemplates] = useState<string[]>([])
  const [waOrderDetails, setWaOrderDetails] = useState<{ id: string, productName: string, price: number } | null>(null)

  const handleOpenWhatsappModal = async (
    whatsapp: string,
    name: string,
    orderDetails?: { id: string, productName: string, price: number }
  ) => {
    setWaTargetNumber(whatsapp || '')
    setWaTargetName(name || '')
    setWaMessage(`Halo ${name || ''},\n\n`)
    setCheckedTemplates([])
    setWaOrderDetails(orderDetails || null)
    setIsWaModalOpen(true)

    try {
      const res = await getAdminMessageTemplates()
      if (res.success) {
        setTemplates(res.templates)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleTemplate = (code: string, checked: boolean) => {
    let nextChecked = [...checkedTemplates]
    if (checked) {
      nextChecked.push(code)
    } else {
      nextChecked = nextChecked.filter((c) => c !== code)
    }
    setCheckedTemplates(nextChecked)

    // Build the concatenated message
    let combinedText = `Halo ${waTargetName || ''},\n\n`
    nextChecked.forEach((c) => {
      const template = templates.find((t) => t.code === c)
      if (template) {
        const parsed = template.content
          .replaceAll('{customerName}', waTargetName)
          .replaceAll('{orderId}', waOrderDetails?.id || '')
          .replaceAll('{productName}', waOrderDetails?.productName || '')
          .replaceAll('{price}', waOrderDetails ? `Rp ${waOrderDetails.price.toLocaleString('id-ID')}` : '');
        combinedText += parsed + '\n\n'
      }
    })
    setWaMessage(combinedText.trim())
  }

  const handleSendWaAutomatic = async () => {
    if (!waTargetNumber) {
      toast.error('Nomor WhatsApp tujuan kosong.')
      return
    }
    if (!waMessage.trim()) {
      toast.error('Pesan WhatsApp tidak boleh kosong.')
      return
    }

    setIsSendingWa(true)
    try {
      const res = await sendCustomWhatsapp({
        data: {
          whatsapp: waTargetNumber,
          message: waMessage,
        }
      })
      if (res.success) {
        toast.success('Pesan WhatsApp berhasil terkirim melalui gateway!')
        setIsWaModalOpen(false)
      } else {
        toast.error(`Gagal: ${res.error || 'Terjadi kesalahan'}`)
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal mengirim pesan'}`)
    } finally {
      setIsSendingWa(false)
    }
  }

  const handleSendWaManual = () => {
    if (!waTargetNumber) {
      toast.error('Nomor WhatsApp tujuan kosong.')
      return
    }
    if (!waMessage.trim()) {
      toast.error('Pesan WhatsApp tidak boleh kosong.')
      return
    }

    let formattedPhone = waTargetNumber.replace(/[^0-9]/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1)
    }

    const encodedText = encodeURIComponent(waMessage)
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`
    window.open(waUrl, '_blank')
    setIsWaModalOpen(false)
  }

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'success') {
      toast.success(message)
    } else if (type === 'error') {
      toast.error(message)
    } else {
      toast(message)
    }
  }

  const handleOpenFulfill = (order: any) => {
    setSelectedOrderId(order.id)
    setTargetOrder(order)
    const type = order.productFulfillmentType || 'credentials'
    setFulfillmentType(type)
    setDownloadUrl(order.productDownloadUrl || '')
    setLicenseKey('')
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
          fulfillmentType,
          email: fulfillmentType === 'credentials' ? email : undefined,
          password: fulfillmentType === 'credentials' ? password : undefined,
          downloadUrl: fulfillmentType === 'download_link' ? downloadUrl : undefined,
          licenseKey: fulfillmentType === 'license_key' ? licenseKey : undefined,
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


  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedOrders = filteredOrders.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

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

  return (
    <div className="space-y-6 relative">

      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4 group">
        <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        Kembali ke Dashboard Admin
      </Link>

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
          {(['semua', 'menunggu_pembayaran', 'menunggu_aktivasi', 'aktif', 'expired', 'dibatalkan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {tab === 'semua'
                ? 'Semua Pesanan'
                : tab === 'menunggu_pembayaran'
                ? 'Unpaid'
                : tab === 'menunggu_aktivasi'
                ? 'Butuh Aktivasi'
                : tab === 'aktif'
                ? 'Aktif'
                : tab === 'expired'
                ? 'Expired'
                : 'Dibatalkan'}
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
                  <th className="pl-6 pr-2 py-4 w-16 text-left whitespace-nowrap">No</th>
                  <th className="px-6 py-4">ID & Tanggal</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Layanan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Bayar</th>
                  <th className="px-6 py-4 text-center">Aktivasi Akun</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-[var(--sea-ink-soft)]">
                {paginatedOrders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-[var(--link-bg-hover)] transition">
                    <td className="pl-6 pr-2 py-4 text-left font-bold text-slate-400 w-16 whitespace-nowrap">{((activePage - 1) * itemsPerPage) + index + 1}</td>
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
                    {/* Aktivasi Akun Column */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {order.status === 'menunggu_aktivasi' && (
                        <button
                          onClick={() => handleOpenFulfill(order)}
                          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-3.5 py-1.5 text-[10px] font-extrabold cursor-pointer transition whitespace-nowrap border-0"
                        >
                          Proses Aktivasi
                        </button>
                      )}
                      {order.status === 'aktif' && (
                        <button
                          onClick={() => handleOpenFulfill(order)}
                          className="rounded-full bg-[var(--chip-bg)] border border-[var(--chip-line)] hover:bg-slate-200 text-[var(--sea-ink)] px-3.5 py-1.5 text-[10px] font-bold cursor-pointer transition whitespace-nowrap"
                        >
                          Update Kredensial
                        </button>
                      )}
                      {order.status !== 'menunggu_aktivasi' && order.status !== 'aktif' && (
                        <span className="text-[11px] text-slate-400 font-medium italic">-</span>
                      )}
                    </td>
                    {/* Quick Actions Column */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* WhatsApp Button */}
                        <button
                          onClick={() => handleOpenWhatsappModal(order.customerWhatsapp || '', order.customerName, { id: order.id, productName: order.productName, price: order.price })}
                          title="Kirim WhatsApp"
                          className="h-7.5 w-7.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 transition cursor-pointer shrink-0 animate-fadeIn"
                        >
                          <WhatsappIcon className="h-4 w-4" />
                        </button>

                        {/* Struk Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          title="Lihat Struk"
                          className="h-7.5 w-7.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-650 transition cursor-pointer shrink-0 animate-fadeIn"
                        >
                          <span className="material-symbols-outlined text-[15px] font-bold">receipt</span>
                        </button>

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

            {filteredOrders.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] font-semibold text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Menampilkan {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} entri
                  </span>
                  <div className="flex items-center gap-1.5 ml-0 sm:ml-2 border-l border-slate-200 pl-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tampilkan:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-bold text-[11px] outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={activePage === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 transition cursor-pointer"
                  >
                    Sebelumnya
                  </button>

                  <span className="px-2 text-slate-700 font-bold text-xs">
                    {activePage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 transition cursor-pointer"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            Belum ada pesanan dengan status terpilih.
          </div>
        )}
      </div>

      {/* Fulfillment Dialog Modal */}
      {mounted && selectedOrderId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[var(--header-bg)] border border-[var(--line)] rounded-[2rem] p-8 shadow-xl animate-fadeIn bg-white">
            <h2 className="text-lg font-extrabold text-[var(--sea-ink)] mb-1">
              {fulfillmentType === 'download_link' ? 'Pengiriman Link Download' :
               fulfillmentType === 'license_key' ? 'Pengiriman Kode Lisensi' :
               fulfillmentType === 'email_invite' ? 'Aktivasi Undangan Email' :
               fulfillmentType === 'topup_service' ? 'Aktivasi Top-Up / Jasa' :
               'Aktivasi Akun Premium'}
            </h2>
            <p className="text-[10px] text-[var(--sea-ink-soft)] mb-6">
              {fulfillmentType === 'download_link' ? 'Masukkan link download/akses file yang akan dikirimkan ke pelanggan.' :
               fulfillmentType === 'license_key' ? 'Masukkan kode serial key / lisensi unik untuk pelanggan.' :
               fulfillmentType === 'email_invite' ? 'Pastikan Anda telah meng-invite email pelanggan di aplikasi/layanan terkait.' :
               fulfillmentType === 'topup_service' ? 'Pastikan proses Top-Up / Jasa untuk ID pelanggan telah diselesaikan.' :
               'Kredensial email & password ini akan di-enkripsi di database demi keamanan pelanggan.'}
            </p>

            {fulfillError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">
                {fulfillError}
              </div>
            )}

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              {fulfillmentType === 'credentials' && (
                <>
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
                </>
              )}

              {fulfillmentType === 'download_link' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                    Link Download / Access URL
                  </label>
                  <input
                    type="url"
                    required
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-slate-900 transition"
                  />
                </div>
              )}

              {fulfillmentType === 'license_key' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                    Kode Lisensi / Serial Key
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="XXXXX-YYYYY-ZZZZZ-12345"
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs font-mono text-[var(--sea-ink)] outline-none focus:border-slate-900 transition"
                  />
                </div>
              )}

              {fulfillmentType === 'email_invite' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                  <p className="font-bold">Target Email Undangan:</p>
                  <p className="font-mono text-sm">{targetOrder?.customerInput || targetOrder?.user?.email}</p>
                  <p className="text-[10px] text-blue-700 pt-1">
                    Lakukan invite email ini pada platform (misal Canva Team/Spotify Family). Klik konfirmasi di bawah jika sudah di-invite.
                  </p>
                </div>
              )}

              {fulfillmentType === 'topup_service' && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Target ID / Input Pembeli:</p>
                  <p className="font-mono text-sm">{targetOrder?.customerInput || targetOrder?.user?.whatsapp || '-'}</p>
                  <p className="text-[10px] text-amber-700 pt-1">
                    Pastikan kredit/topup telah berhasil diisi ke ID ini sebelum mengaktifkan pesanan.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                  Catatan Tambahan (Remarks)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Tulis instruksi tambahan, durasi garansi, atau catatan khusus..."
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
                  {isFulfilling ? 'Mengaktifkan...' : 'Kirim / Aktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal */}
      {mounted && confirmModal.isOpen && createPortal(
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
        </div>,
        document.body
      )}
      {/* WhatsApp Modal */}
      <Dialog open={isWaModalOpen} onOpenChange={setIsWaModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-fadeIn">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <WhatsappIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-display">Kirim Pesan WhatsApp</span>
                <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                  Tujuan: {waTargetName} ({waTargetNumber})
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Selector with Checkboxes */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Centang Template untuk Menggabungkan Pesan:
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {templates.map((t) => {
                  const isChecked = checkedTemplates.includes(t.code);
                  return (
                    <label key={t.id} className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none py-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToggleTemplate(t.code, e.target.checked)}
                        className="rounded border-slate-300 text-slate-905 focus:ring-slate-900 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold block text-slate-800 leading-tight">{t.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Trigger: {t.code}</span>
                      </div>
                    </label>
                  );
                })}
                {templates.length === 0 && (
                  <span className="text-[10px] text-slate-400 font-bold block text-center py-2">
                    Belum ada template terdaftar.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Pesan WhatsApp
              </label>
              <textarea
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="Tulis pesan Anda di sini..."
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition resize-none font-sans"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleSendWaManual}
              className="w-full sm:w-1/2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 py-3 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Kirim WA Manual (Web)
            </button>
            <button
              onClick={handleSendWaAutomatic}
              disabled={isSendingWa}
              className="w-full sm:w-1/2 rounded-full bg-slate-950 hover:bg-slate-800 text-xs font-bold text-white py-3 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              {isSendingWa ? 'Mengirim...' : 'Kirim WA Gateway'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Printable Receipt Modal (Admin View) */}
      {mounted && selectedOrder && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 flex flex-col gap-5 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-700">receipt</span>
                Invoice Preview (Admin)
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
                    {selectedOrder.status === 'aktif' ? 'Layanan/Aktif' :
                     selectedOrder.status === 'menunggu_aktivasi' ? 'Menunggu Aktivasi' :
                     selectedOrder.status === 'menunggu_pembayaran' ? 'Menunggu Pembayaran' :
                     'Expired'}
                  </span>
                </div>
              </div>

              {/* Customer billing details */}
              <div className="text-xs border-b border-dashed border-slate-200 pb-4">
                <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-1.5">Pelanggan</span>
                <strong className="text-slate-800 block">{selectedOrder.customerName}</strong>
                <span className="text-slate-500 block">{selectedOrder.customerEmail}</span>
                {selectedOrder.customerWhatsapp && (
                  <span className="text-slate-400 text-[10px] mt-0.5 block">{selectedOrder.customerWhatsapp}</span>
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
                      {selectedOrder.remainingDuration} Bulan Langganan
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
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-800">{formatIDR(selectedOrder.price)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice Calculations */}
              <div className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col gap-2 mt-1 z-10">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400 font-semibold">Harga Langganan</span>
                  <span className="font-bold text-slate-700">{formatIDR(selectedOrder.price + selectedOrder.discountAmount)}</span>
                </div>
                
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-indigo-600 font-semibold">
                    <span>Diskon Promo / Voucer</span>
                    <span>-{formatIDR(selectedOrder.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400 font-semibold">Biaya Layanan & PPN</span>
                  <span className="text-emerald-600 font-bold">Rp 0</span>
                </div>

                <div className="flex justify-between text-[10.5px] font-black text-slate-900 border-t border-dashed border-slate-100 pt-2 mt-1">
                  <span>Total Bayar</span>
                  <span className="text-xs font-black text-slate-950">{formatIDR(selectedOrder.price)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-100/60 rounded-xl p-3 flex flex-col gap-1.5 z-10">
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
                <div className="flex justify-between text-[9px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Status Transaksi:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black w-max ${
                    selectedOrder.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' :
                    selectedOrder.status === 'menunggu_aktivasi' ? 'bg-indigo-50 text-indigo-600' :
                    selectedOrder.status === 'expired' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {selectedOrder.status === 'aktif' ? 'AKTIF' :
                     selectedOrder.status === 'menunggu_aktivasi' ? 'DIBAYAR' :
                     selectedOrder.status === 'expired' ? 'KADALUARSA' : 'BELUM BAYAR'}
                  </span>
                </div>
              </div>

              {/* Invoice Footer Notes */}
              <div className="text-center text-[9px] text-slate-400 font-semibold pt-3 border-t border-slate-100 flex flex-col gap-0.5 mt-2">
                <p>Terima kasih atas kepercayaan Anda!</p>
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

            {/* Print Only CSS Hack styling to cleanly force print area */}
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
    </div>
  )
}

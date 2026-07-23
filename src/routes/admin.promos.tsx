import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getPromos, createPromo, togglePromoActive, deletePromo, updatePromo } from '../utils/promo.functions'
import { getAdminProducts } from '../utils/admin.functions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'

export const Route = createFileRoute('/admin/promos')({
  loader: async () => {
    try {
      const [promoRes, productRes] = await Promise.all([
        getPromos(),
        getAdminProducts(),
      ])
      return {
        promos: promoRes.success ? promoRes.promos : [],
        products: productRes.success ? productRes.products : [],
        error: promoRes.success ? null : promoRes.error,
      }
    } catch (err: any) {
      return { promos: [], products: [], error: err?.message || 'Gagal memuat data' }
    }
  },
  component: AdminPromosPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function AdminPromosPage() {
  const { promos: initialPromos, products, error } = Route.useLoaderData()
  const [promosList, setPromosList] = useState(initialPromos)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductCategoryFilter, setSelectedProductCategoryFilter] = useState('Semua')

  // Editing state
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)

  // Listing filter states
  const [filterCategory, setFilterCategory] = useState('Semua')
  const [filterStock, setFilterStock] = useState('Semua') // Semua | Tersedia | Habis
  const [filterPeriod, setFilterPeriod] = useState('Semua') // Semua | Berjalan | Belum Mulai | Kadaluarsa
  const [filterMinPurchase, setFilterMinPurchase] = useState('Semua') // Semua | 1 | 3 | 6 | 12
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Form states
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [minDurationMonths, setMinDurationMonths] = useState(1)
  const [isCatalogSlashed, setIsCatalogSlashed] = useState(false)
  const [productId, setProductId] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    codeName: string;
  }>({
    isOpen: false,
    id: '',
    codeName: '',
  })

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleOpenAdd = () => {
    setEditingPromoId(null)
    setCode('')
    setDiscountType('percentage')
    setDiscountValue('')
    setMaxDiscountAmount('')
    setMinDurationMonths(1)
    setIsCatalogSlashed(false)
    setProductId('')
    setMaxUses('')
    setValidFrom('')
    setValidUntil('')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (promo: any) => {
    setEditingPromoId(promo.id)
    setCode(promo.code || '')
    setDiscountType(promo.discountType)
    setDiscountValue(String(promo.discountValue))
    setMaxDiscountAmount(promo.maxDiscountAmount ? String(promo.maxDiscountAmount) : '')
    setMinDurationMonths(promo.minDurationMonths)
    setIsCatalogSlashed(promo.isCatalogSlashed)
    setProductId(promo.productId || '')
    setMaxUses(promo.maxUses ? String(promo.maxUses) : '')
    setValidFrom(promo.validFrom ? new Date(promo.validFrom).toISOString().slice(0, 10) : '')
    setValidUntil(promo.validUntil ? new Date(promo.validUntil).toISOString().slice(0, 10) : '')
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await togglePromoActive({ data: { id, isActive: !currentStatus } })
      if (res.success) {
        setPromosList(prev =>
          prev.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p)
        )
        showToast('Status promo berhasil diubah.', 'success')
      } else {
        showToast(res.error || 'Gagal mengubah status.', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error')
    }
  }

  const handleDelete = async (id: string, codeName: string) => {
    try {
      const res = await deletePromo({ data: id })
      if (res.success) {
        setPromosList(prev => prev.filter(p => p.id !== id))
        showToast('Promo berhasil dihapus.', 'success')
      } else {
        showToast(res.error || 'Gagal menghapus promo.', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    const parsedDiscountValue = Number(discountValue)
    if (isNaN(parsedDiscountValue) || parsedDiscountValue <= 0) {
      setFormError('Nilai diskon harus berupa angka lebih dari 0.')
      setIsSubmitting(false)
      return
    }

    try {
      if (editingPromoId) {
        const res = await updatePromo({
          data: {
            id: editingPromoId,
            code: code.trim() || null,
            discountType,
            discountValue: parsedDiscountValue,
            maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
            minDurationMonths,
            isCatalogSlashed,
            productId: productId || null,
            maxUses: maxUses ? Number(maxUses) : null,
            validFrom: validFrom || null,
            validUntil: validUntil || null,
          }
        })

        if (res.success) {
          // Refresh promos list
          const updated = await getPromos()
          if (updated.success) {
            setPromosList(updated.promos)
          }
          setIsModalOpen(false)
          showToast('Promo berhasil diperbarui.', 'success')
        } else {
          setFormError(res.error || 'Gagal memperbarui promo.')
        }
      } else {
        const res = await createPromo({
          data: {
            code: code.trim() || null,
            discountType,
            discountValue: parsedDiscountValue,
            maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
            minDurationMonths,
            isCatalogSlashed,
            productId: productId || null,
            maxUses: maxUses ? Number(maxUses) : null,
            validFrom: validFrom || null,
            validUntil: validUntil || null,
          }
        })

        if (res.success && res.promo) {
          // Refresh promos list
          const updated = await getPromos()
          if (updated.success) {
            setPromosList(updated.promos)
          }
          setIsModalOpen(false)
          showToast('Promo baru berhasil ditambahkan.', 'success')
        } else {
          setFormError(res.error || 'Gagal membuat promo.')
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const now = new Date()

  const filteredPromos = promosList.filter(promo => {
    // 1. Category Filter
    const productObj = products.find(p => p.id === promo.productId)
    const category = productObj ? productObj.category : 'Global'
    if (filterCategory !== 'Semua') {
      if (filterCategory === 'Global' && promo.productId !== null) return false
      if (filterCategory !== 'Global' && category !== filterCategory) return false
    }

    // 2. Stock Filter
    if (filterStock !== 'Semua') {
      const isAvailable = !promo.maxUses || promo.usedCount < promo.maxUses
      if (filterStock === 'Tersedia' && !isAvailable) return false
      if (filterStock === 'Habis' && isAvailable) return false
    }

    // 3. Period Filter
    if (filterPeriod !== 'Semua') {
      const isStarted = !promo.validFrom || now >= new Date(promo.validFrom)
      const isExpired = promo.validUntil && now > new Date(promo.validUntil)
      const isRunning = isStarted && !isExpired

      if (filterPeriod === 'Berjalan' && !isRunning) return false
      if (filterPeriod === 'Belum Mulai' && isStarted) return false
      if (filterPeriod === 'Kadaluarsa' && !isExpired) return false
    }

    // 4. Min Purchase Filter
    if (filterMinPurchase !== 'Semua') {
      if (promo.minDurationMonths !== Number(filterMinPurchase)) return false
    }

    return true
  })


  const totalPages = Math.ceil(filteredPromos.length / itemsPerPage)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedPromos = filteredPromos.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  return (
    <div className="space-y-8 font-sans text-left">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-xl border animate-fadeIn ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">local_offer</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Manajemen Promo & Voucher
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Buat voucher diskon belanja, harga coret katalog, dan batasan durasi pembelian.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white border border-slate-950 hover:scale-95 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Buat Promo Baru
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Filters Panel */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 grid gap-4 grid-cols-2 md:grid-cols-4 shadow-2xs text-left">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-250 bg-white px-3 py-2 text-xs outline-none focus:border-slate-900 transition"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Global">Global (Semua Layanan)</option>
            {Array.from(new Set(products.map(p => p.category))).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stok / Kuota</label>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="w-full rounded-xl border border-slate-250 bg-white px-3 py-2 text-xs outline-none focus:border-slate-900 transition"
          >
            <option value="Semua">Semua Status Kuota</option>
            <option value="Tersedia">Kuota Tersedia</option>
            <option value="Habis">Kuota Habis</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Periode</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full rounded-xl border border-slate-250 bg-white px-3 py-2 text-xs outline-none focus:border-slate-900 transition"
          >
            <option value="Semua">Semua Periode</option>
            <option value="Berjalan">Sedang Berjalan</option>
            <option value="Belum Mulai">Belum Mulai</option>
            <option value="Kadaluarsa">Sudah Kadaluarsa</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Min. Pembelian</label>
          <select
            value={filterMinPurchase}
            onChange={(e) => setFilterMinPurchase(e.target.value)}
            className="w-full rounded-xl border border-slate-250 bg-white px-3 py-2 text-xs outline-none focus:border-slate-900 transition"
          >
            <option value="Semua">Semua Durasi</option>
            <option value="1">1 Bulan</option>
            <option value="3">3 Bulan</option>
            <option value="6">6 Bulan</option>
            <option value="12">12 Bulan</option>
          </select>
        </div>
      </div>

      {/* Promos Table */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-slate-100/40">
        {filteredPromos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/20 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="pl-6 pr-2 py-4 w-16 text-left whitespace-nowrap">No</th>
                  <th className="px-6 py-4">Kode / Tipe</th>
                  <th className="px-6 py-4">Besar Diskon</th>
                  <th className="px-6 py-4">Min. Pembelian</th>
                  <th className="px-6 py-4">Target Produk</th>
                  <th className="px-6 py-4">Penggunaan (Kuota)</th>
                  <th className="px-6 py-4">Masa Berlaku</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedPromos.map((promo, index) => (
                  <tr key={promo.id} className="hover:bg-slate-50/50 transition">
                    <td className="pl-6 pr-2 py-4 text-left font-bold text-slate-400 w-16 whitespace-nowrap">{((activePage - 1) * itemsPerPage) + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {promo.code ? (
                        <code className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-md text-xs">
                          {promo.code}
                        </code>
                      ) : (
                        <span className="text-slate-400 italic">Diskon Langsung</span>
                      )}
                      <div className="mt-1.5 flex gap-1">
                        {promo.isCatalogSlashed && (
                          <span className="inline-block bg-pink-50 border border-pink-100 text-pink-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                            Harga Coret
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="text-slate-900 text-xs block">
                        {promo.discountType === 'percentage' ? `${promo.discountValue}%` : formatIDR(promo.discountValue)}
                      </strong>
                      {promo.maxDiscountAmount && (
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          Maks: {formatIDR(promo.maxDiscountAmount)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                        {promo.minDurationMonths} Bulan
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {promo.productName ? (
                        <span className="text-slate-800 font-bold block truncate max-w-[180px]" title={promo.productName}>
                          {promo.productName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Semua Layanan (Global)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <strong className="text-slate-800 font-bold">{promo.usedCount}</strong>
                      <span className="text-slate-400"> / {promo.maxUses || '∞'}</span>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-slate-900 h-full rounded-full"
                          style={{
                            width: promo.maxUses ? `${Math.min(100, (promo.usedCount / promo.maxUses) * 100)}%` : '20%'
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {promo.validUntil ? (
                        new Date(promo.validUntil).toLocaleDateString('id-ID', { dateStyle: 'medium' })
                      ) : (
                        <span className="text-slate-400">Selamanya</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggleStatus(promo.id, promo.isActive)}
                        className={`inline-block px-2.5 py-1 text-[10px] font-black rounded-full border cursor-pointer transition ${
                          promo.isActive
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {promo.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(promo)}
                          className="rounded-lg border border-slate-250 bg-slate-50 text-slate-655 hover:bg-slate-100 p-1.5 transition cursor-pointer hover:scale-95 flex items-center justify-center"
                          title="Edit Promo"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: promo.id, codeName: promo.code || 'Promo Katalog' })}
                          className="rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 p-1.5 transition cursor-pointer hover:scale-95 flex items-center justify-center"
                          title="Hapus Promo"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPromos.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] font-semibold text-left">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Menampilkan {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, filteredPromos.length)} dari {filteredPromos.length} entri
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
        ) : (
          <div className="text-center py-16 bg-white border-t border-slate-150 p-8 max-w-sm mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
              <span className="material-symbols-outlined text-2xl">local_offer</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">Kupon Kosong</h3>
            <p className="text-[11px] text-slate-400 font-semibold max-w-[240px] text-center leading-relaxed">
              Belum ada promo, voucher, atau kupon diskon terdaftar di sistem saat ini.
            </p>
          </div>
        )}
      </div>

      {/* Create Promo Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto font-sans text-left">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              {editingPromoId ? 'Edit Promo / Kupon' : 'Buat Promo / Kupon Baru'}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Kode Voucher (Kupon)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CONTOH: HEMAT30 (Kosongkan jika diskon katalog otomatis)"
                className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tipe Diskon
                </label>
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (IDR)</option>
                </select>
              </div>

              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nilai Diskon
                </label>
                <input
                  type="number"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '15 (%)' : '15000 (IDR)'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
                />
              </div>
            </div>

            {discountType === 'percentage' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Maksimal Diskon (IDR)
                </label>
                <input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="Batas maksimal nominal diskon (Opsional)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
                />
              </div>
            )}

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Min. Durasi Langganan
                </label>
                <select
                  value={minDurationMonths}
                  onChange={(e) => setMinDurationMonths(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
                >
                  {[1, 2, 3, 6, 12].map(m => (
                    <option key={m} value={m}>{m} Bulan</option>
                  ))}
                </select>
              </div>

              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Target Produk
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 truncate" title={productId ? products.find(p => p.id === productId)?.name || 'Produk Terpilih' : 'Semua Layanan'}>
                    {productId ? products.find(p => p.id === productId)?.name || 'Produk Terpilih' : 'Semua Layanan'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProductSearch('')
                      setIsProductPickerOpen(true)
                    }}
                    className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl px-3 py-2 text-xs font-black border-0 cursor-pointer transition whitespace-nowrap shrink-0"
                  >
                    Pilih
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Batas Kuota Pemakaian
                </label>
                <input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Maksimal pemakaian (Opsional)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
                />
              </div>

              <div className="w-1/2 flex items-center pl-2 pt-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCatalogSlashed}
                    onChange={(e) => setIsCatalogSlashed(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-200"
                  />
                  Harga Coret Katalog
                </label>
              </div>
            </div>

            <div className="flex gap-4 border-t border-slate-100 pt-4">
              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mulai Berlaku
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
                />
              </div>

              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Berakhir Pada
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-55 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-2.5 text-xs font-bold transition border-0 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-slate-950 hover:bg-slate-900 text-white shadow-sm px-6 py-2.5 text-xs font-black transition border-0 cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : (editingPromoId ? 'Simpan Perubahan' : 'Simpan Promo')}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Picker Modal (Strategy 2 & 3 Combined) */}
      <Dialog open={isProductPickerOpen} onOpenChange={setIsProductPickerOpen}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto font-sans text-left flex flex-col">
          <DialogHeader className="mb-3">
            <DialogTitle className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Pilih Target Produk
            </DialogTitle>
          </DialogHeader>

          {/* Search Box */}
          <div className="mb-4 relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs outline-none focus:border-slate-900 transition"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 mb-4 border-b border-slate-100 pb-3">
            {['Semua', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedProductCategoryFilter(cat)}
                className={`px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition border cursor-pointer ${
                  selectedProductCategoryFilter === cat
                    ? 'bg-slate-900 border-slate-950 text-white shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-550 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product list grouped by category */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[45vh] pr-1">
            {/* Global option: Semua Layanan */}
            {selectedProductCategoryFilter === 'Semua' && (!productSearch || 'semua layanan'.includes(productSearch.toLowerCase())) && (
              <div>
                <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Pilihan Global</h4>
                <div
                  onClick={() => {
                    setProductId('')
                    setIsProductPickerOpen(false)
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    !productId
                      ? 'bg-indigo-50/50 border-indigo-250 text-indigo-700 font-extrabold'
                      : 'bg-slate-50/30 border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs">Semua Layanan (Global)</span>
                  {!productId && <span className="material-symbols-outlined text-sm">check_circle</span>}
                </div>
              </div>
            )}

            {/* Categorized options */}
            {(() => {
              // Group active products
              const groups: Record<string, typeof products> = {}
              products.forEach(p => {
                const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase())
                const matchesCategory = selectedProductCategoryFilter === 'Semua' || p.category === selectedProductCategoryFilter

                if (matchesSearch && matchesCategory) {
                  const cat = p.category || 'Lainnya'
                  if (!groups[cat]) groups[cat] = []
                  groups[cat].push(p)
                }
              })

              const groupKeys = Object.keys(groups)

              if (groupKeys.length === 0) {
                return (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    Tidak ada produk yang cocok dengan filter atau kata kunci Anda.
                  </div>
                )
              }

              return groupKeys.map(cat => {
                const filteredProducts = groups[cat]

                return (
                  <div key={cat} className="space-y-1.5">
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mt-2 mb-1">
                      Kategori: {cat}
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {filteredProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setProductId(p.id)
                            setIsProductPickerOpen(false)
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                            productId === p.id
                              ? 'bg-indigo-50/50 border-indigo-250 text-indigo-700 font-extrabold'
                              : 'bg-slate-50/30 border-slate-100 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="text-left truncate mr-2">
                            <span className="text-xs block font-bold text-slate-800 truncate" title={p.name}>{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                              {formatIDR(p.price)} / {p.durationMonths} Bln
                            </span>
                          </div>
                          {productId === p.id && <span className="material-symbols-outlined text-sm text-indigo-600 flex-shrink-0">check_circle</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsProductPickerOpen(false)}
              className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2 text-xs font-bold transition border-0 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Confirmation Dialog Modal for Deletion */}
      <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-slate-500 font-semibold leading-relaxed">
            Apakah Anda yakin ingin menghapus promo <strong className="text-slate-800">"{deleteConfirm.codeName}"</strong>? Tindakan ini tidak dapat dibatalkan.
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm({ isOpen: false, id: '', codeName: '' })}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={async () => {
                const { id, codeName } = deleteConfirm
                setDeleteConfirm({ isOpen: false, id: '', codeName: '' })
                await handleDelete(id, codeName)
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-sm cursor-pointer border-0"
            >
              Ya, Hapus
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

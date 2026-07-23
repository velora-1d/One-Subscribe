import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { getAdminProducts, getAdminCategories, createAdminProduct, updateAdminProduct, toggleProductStatus, deleteAdminProduct, bulkUpdateProductStock, updateProductsOrder } from '../utils/admin.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { PageTableSkeleton } from '../components/ui/skeletons'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/admin/products')({
  ssr: false,
  loader: async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
      ])
      return {
        products: prodRes.success ? prodRes.products : [],
        categories: catRes.success ? catRes.categories : [],
        error: prodRes.success && catRes.success ? null : (prodRes.error || catRes.error),
      }
    } catch (err: any) {
      return { products: [], categories: [], error: err?.message || 'Gagal memuat data produk' }
    }
  },
  pendingComponent: PageTableSkeleton,
  component: AdminProductsPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumberWithDots(num: number | string): string {
  const rawVal = num.toString().replace(/\D/g, '')
  if (!rawVal) return ''
  return parseInt(rawVal).toLocaleString('id-ID')
}

function parseDotsToNumber(str: string): number {
  const cleanStr = str.replace(/\D/g, '')
  return parseInt(cleanStr) || 0
}

interface ProductFormState {
  name: string
  description: string
  price: number
  durationMonths: number
  category: string
  imageUrl: string
  stock: number
  fulfillmentType: 'credentials' | 'download_link' | 'license_key' | 'email_invite' | 'topup_service'
  downloadUrl: string
  fulfillmentInstructions: string
}

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: 0,
  durationMonths: 1,
  category: '',
  imageUrl: '',
  stock: 10,
  fulfillmentType: 'credentials',
  downloadUrl: '',
  fulfillmentInstructions: '',
}

function AdminProductsPage() {
  const { products: initialProducts, categories, error } = Route.useLoaderData()
  const [products, setProducts] = useState(initialProducts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: '',
    name: '',
  })

  // Bulk Stock States
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false)
  const [bulkEdits, setBulkEdits] = useState<{ id: string; name: string; category: string; currentStock: number; adjustment: number }[]>([])
  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkQuickVal, setBulkQuickVal] = useState('')
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false)

  // Order States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderedProducts, setOrderedProducts] = useState<any[]>([])
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('semua')

  // Apply filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory === 'semua' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      category: categories[0]?.name || '',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenBulkStock = () => {
    setBulkEdits(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: p.stock ?? 0,
        adjustment: 0,
      }))
    )
    setBulkSearch('')
    setBulkQuickVal('')
    setIsBulkStockModalOpen(true)
  }

  const handleApplyQuickStock = () => {
    const val = parseInt(bulkQuickVal) || 0
    setBulkEdits(prev =>
      prev.map(item => ({
        ...item,
        adjustment: val,
      }))
    )
    toast.success(`Berhasil menerapkan penyesuaian ${val >= 0 ? '+' : ''}${val} ke semua produk.`)
  }

  const handleSaveBulkStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingBulk(true)
    try {
      const updates = bulkEdits
        .filter(x => x.adjustment !== 0)
        .map(x => ({ productId: x.id, adjustment: x.adjustment }))

      if (updates.length === 0) {
        toast.info('Tidak ada perubahan stok yang dibuat.')
        setIsBulkStockModalOpen(false)
        return
      }

      const res = await bulkUpdateProductStock({ data: { updates } })
      if (res.success) {
        setProducts(prev =>
          prev.map(p => {
            const match = updates.find(u => u.productId === p.id)
            if (match) {
              return { ...p, stock: Math.max(0, (p.stock ?? 0) + match.adjustment) }
            }
            return p
          })
        )
        toast.success('Pembaruan stok masal berhasil disimpan!')
        setIsBulkStockModalOpen(false)
      } else {
        toast.error(res.error || 'Gagal menyimpan pembaruan stok masal.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsSubmittingBulk(false)
    }
  }

  const handleOpenOrderModal = () => {
    const sorted = [...products].sort((a, b) => {
      if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setOrderedProducts(sorted);
    setIsOrderModalOpen(true);
  }

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const list = [...orderedProducts];
    const temp = list[idx];
    list[idx] = list[idx - 1];
    list[idx - 1] = temp;
    setOrderedProducts(list);
  }

  const handleMoveDown = (idx: number) => {
    if (idx === orderedProducts.length - 1) return;
    const list = [...orderedProducts];
    const temp = list[idx];
    list[idx] = list[idx + 1];
    list[idx + 1] = temp;
    setOrderedProducts(list);
  }

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    try {
      const updates = orderedProducts.map((p, idx) => ({
        productId: p.id,
        sortOrder: idx + 1,
      }));

      const res = await updateProductsOrder({ data: { updates } });
      if (res.success) {
        const updatedProducts = products.map((p) => {
          const match = updates.find((u) => u.productId === p.id);
          return match ? { ...p, sortOrder: match.sortOrder } : p;
        }).sort((a, b) => {
          if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
            return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setProducts(updatedProducts);
        toast.success('Urutan produk berhasil disimpan!');
        setIsOrderModalOpen(false);
      } else {
        toast.error(res.error || 'Gagal menyimpan urutan produk.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  const handleOpenEdit = (p: any) => {
     setEditingId(p.id)
     setForm({
       name: p.name,
       description: p.description,
       price: p.price,
       durationMonths: p.durationMonths,
       category: p.category,
       imageUrl: p.imageUrl || '',
       stock: p.stock ?? 0,
       fulfillmentType: p.fulfillmentType || 'credentials',
       downloadUrl: p.downloadUrl || '',
       fulfillmentInstructions: p.fulfillmentInstructions || '',
     })
     setFormError(null)
     setIsModalOpen(true)
   }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleProductStatus({ data: { id, isActive: !currentStatus } })
      if (res.success) {
        setProducts(
          products.map((p) => (p.id === id ? { ...p, isActive: !currentStatus } : p))
        )
        toast.success(`Status produk berhasil diubah.`)
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal mengubah status'}`)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await deleteAdminProduct({ data: id })
      if (res.success) {
        setProducts(products.filter((p) => p.id !== id))
        toast.success(`Produk "${name}" berhasil dihapus.`)
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal menghapus produk'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    if (!form.imageUrl) {
      setFormError('Gambar ilustrasi produk wajib diunggah.')
      setIsSubmitting(false)
      return
    }

    try {
      if (editingId) {
        // Edit Mode
        const res = await updateAdminProduct({
          data: {
            id: editingId,
            product: form,
          },
        })
        if (res.success && res.product) {
          setProducts(products.map((p) => (p.id === editingId ? res.product : p)))
          setIsModalOpen(false)
        } else {
          setFormError(res.error || 'Gagal memperbarui produk.')
        }
      } else {
        // Add Mode
        const res = await createAdminProduct({ data: form })
        if (res.success && res.product) {
          setProducts([res.product, ...products])
          setIsModalOpen(false)
        } else {
          setFormError(res.error || 'Gagal menambah produk baru.')
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 font-sans text-left">
      {/* Title Panel */}
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Manajemen Produk & Katalog
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Tambah, sunting, non-aktifkan, atau kelola opsi langganan premium pelanggan.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleOpenOrderModal}
            className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <span className="material-symbols-outlined text-[18px]">reorder</span>
            Atur Urutan Tampil
          </button>
          <button
            onClick={handleOpenBulkStock}
            className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <span className="material-symbols-outlined text-[18px]">inventory</span>
            Kelola Stok Masal
          </button>
          <button
            onClick={handleOpenAdd}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white border border-slate-950 hover:scale-95 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Tambah Produk Baru
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Interactive Filters Panel */}
      <section className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-lg shadow-slate-100/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-lg">filter_alt</span>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Katalog</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs"
            />
          </div>
          {/* Category Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs cursor-pointer"
            >
              <option value="semua">Semua Kategori</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Products grid list - redesigned to be 30% more compact (5-6 columns) */}
      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredProducts.map((p) => (
          <Card key={p.id} className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl overflow-hidden relative group flex flex-col p-0 shadow-lg shadow-slate-100/20 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300">
            {/* Image Section (Forced 1:1 aspect ratio) */}
            <div className="relative aspect-square w-full bg-slate-50/50 overflow-hidden border-b border-slate-100 flex items-center justify-center shrink-0">
              <Link to="/products/$productId" params={{ productId: p.id }} search={{ from: 'admin' }} className="absolute inset-0 w-full h-full cursor-pointer z-0">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 w-full h-full">
                    <span className="material-symbols-outlined text-3xl">inventory_2</span>
                    <span className="text-[9px] font-bold uppercase mt-1.5 text-slate-400">No Image</span>
                  </div>
                )}
              </Link>
              
              {/* Category overlay */}
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-white/95 backdrop-blur-sm text-slate-700 border border-slate-200/60 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {p.category}
                </span>
              </div>

              {/* Status overlay (pill layout) */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(p.id, p.isActive)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer transition-all border shadow-sm ${
                    p.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80' 
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Klik untuk ubah status"
                >
                  <span className={`h-1 w-1 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {p.isActive ? 'Aktif' : 'Draft'}
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col justify-between flex-grow gap-3">
              <div>
                <Link to="/products/$productId" params={{ productId: p.id }} search={{ from: 'admin' }} className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1 hover:underline cursor-pointer block" title={p.name}>
                  {p.name}
                </Link>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                  {p.description || 'Tidak ada deskripsi produk.'}
                </p>
              </div>

              {/* Stock indicator badge */}
              <div className="flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stok Tersedia</span>
                {p.stock <= 0 ? (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200/60 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Habis
                  </span>
                ) : p.stock < 5 ? (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs animate-pulse">
                    Tinggal {p.stock} Slot
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    {p.stock} Slot
                  </span>
                )}
              </div>

              {/* Price & Duration row */}
              <div className="flex justify-between items-baseline border-t border-slate-100 pt-2.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{p.durationMonths} Bulan</span>
                <span className="text-sm font-bold text-slate-900">{formatIDR(p.price)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(p)}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 font-sans"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ isOpen: true, id: p.id, name: p.name })}
                  className="flex-1 bg-red-50/50 hover:bg-red-100/70 text-red-600 border border-red-200 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 font-sans"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Hapus
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      ) : (
        <div className="text-center py-16 italic text-xs text-slate-400 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl">
          Tidak ada produk yang cocok dengan filter pencarian atau kategori.
        </div>
      )}

      {/* dialog Popup for Product Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl sm:max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto font-sans text-left">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-slate-900 font-display">
              {editingId ? 'Edit Detail Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Layanan
                </Label>
                <Input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Netflix Premium 1 Bulan"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition"
                />
              </div>

              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition cursor-pointer font-medium"
                >
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Produk & Fitur
              </Label>
              <Textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Rincian fitur, klaim garansi, & spesifikasi akun langganan..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 py-2 text-xs text-slate-800 outline-none transition resize-none min-h-[80px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga (IDR)
                </Label>
                <Input
                  type="text"
                  required
                  value={form.price ? formatNumberWithDots(form.price) : ''}
                  onChange={(e) => {
                    const parsedValue = parseDotsToNumber(e.target.value)
                    setForm({ ...form, price: parsedValue })
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition"
                />
              </div>
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Durasi (Bulan)
                </Label>
                <Input
                  type="number"
                  required
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition"
                />
              </div>
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stok Produk
                </Label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition"
                />
              </div>
            </div>

            {/* Interactive Fulfillment Type Selector */}
            <div className="pt-2">
              <Label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Tipe Pengiriman Produk (Fulfillment Type)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    id: 'credentials',
                    title: 'Kredensial Akun',
                    subtitle: 'Email & Password',
                    desc: 'Admin mengisikan kredensial Email & Password saat memproses pesanan.',
                    icon: 'key',
                  },
                  {
                    id: 'download_link',
                    title: 'Link Download',
                    subtitle: 'Material / File Digital',
                    desc: 'Pembeli langsung mendapat link download/akses file digital saat pesanan diaktifkan.',
                    icon: 'link',
                  },
                  {
                    id: 'license_key',
                    title: 'Kode Lisensi',
                    subtitle: 'Serial Key Unik',
                    desc: 'Pembeli mendapatkan kode lisensi / serial key aktivasi.',
                    icon: 'confirmation_number',
                  },
                  {
                    id: 'email_invite',
                    title: 'Undangan Email',
                    subtitle: 'Family / Team Plan',
                    desc: 'Admin meng-invite email pelanggan ke akun family/team.',
                    icon: 'mail',
                  },
                  {
                    id: 'topup_service',
                    title: 'Jasa Top-Up',
                    subtitle: 'Input User ID / Target',
                    desc: 'Pembeli memasukkan ID Account/No Target saat checkout untuk diproses admin.',
                    icon: 'bolt',
                  },
                ].map((opt) => {
                  const isSelected = form.fulfillmentType === opt.id
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setForm({ ...form, fulfillmentType: opt.id as any })}
                      className={`relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                        isSelected
                          ? 'border-slate-900 bg-slate-950/5 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg flex items-center justify-center ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            <span className="material-symbols-outlined text-sm font-bold">{opt.icon}</span>
                          </div>
                          <span className="text-xs font-black text-slate-900">{opt.title}</span>
                        </div>
                        {/* Custom Checkbox Indicator */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                          isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <span className="material-symbols-outlined text-[10px] font-black">check</span>}
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">{opt.subtitle}</p>
                      <p className="text-[9px] text-slate-400 leading-tight mt-auto pt-1">{opt.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {form.fulfillmentType === 'download_link' && (
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Link Download / Akses File (Google Drive / Cloud URL)
                </Label>
                <Input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={form.downloadUrl}
                  onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition"
                />
              </div>
            )}

            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">
                Gambar Ilustrasi Produk
              </Label>
              <div className="space-y-3">
                {form.imageUrl ? (
                  <div className="relative aspect-square w-36 mx-auto bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center rounded-lg">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setForm({ ...form, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold p-1.5 px-3 h-7 text-[10px] transition cursor-pointer rounded-lg"
                    >
                      Hapus Gambar
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-square w-36 mx-auto border border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 transition cursor-pointer rounded-lg">
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <svg className="w-6 h-6 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-[10px] font-bold text-slate-700">Unggah Gambar</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">1:1 Ratio (Square)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setForm({ ...form, imageUrl: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-5 h-10 text-xs font-bold text-slate-600 transition cursor-pointer font-sans"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-slate-900 text-white px-6 h-10 text-xs font-bold shadow-sm hover:scale-95 transition disabled:opacity-50 cursor-pointer border border-slate-950 font-sans"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
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
            Apakah Anda yakin ingin menghapus produk <strong className="text-slate-800">"{deleteConfirm.name}"</strong>? Tindakan ini tidak dapat dibatalkan.
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={async () => {
                const { id, name } = deleteConfirm
                setDeleteConfirm({ isOpen: false, id: '', name: '' })
                await handleDelete(id, name)
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition shadow-sm cursor-pointer border-0"
            >
              Ya, Hapus
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Pembaruan Stok Masal */}
      <Dialog open={isBulkStockModalOpen} onOpenChange={setIsBulkStockModalOpen}>
        <DialogContent className="w-11/12 sm:max-w-4xl md:max-w-5xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto font-sans text-left flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <span className="material-symbols-outlined">published_with_changes</span>
              Kelola Stok Masal
            </DialogTitle>
          </DialogHeader>

          {/* Quick-Apply Panel */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600 font-semibold">
              <strong className="text-slate-800">Alat Cepat:</strong> Masukkan angka positif atau negatif untuk menerapkan penyesuaian stok serentak ke semua produk.
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <Input
                type="number"
                placeholder="Misal: 10 atau -5"
                value={bulkQuickVal}
                onChange={(e) => setBulkQuickVal(e.target.value)}
                className="w-28 rounded-lg border border-slate-200 bg-white px-3 h-9 text-xs text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={handleApplyQuickStock}
                className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 h-9 text-xs font-bold transition cursor-pointer"
              >
                Terapkan Ke Semua
              </button>
            </div>
          </div>

          {/* Search bar inside bulk modal */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari produk di dalam daftar..."
              value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition"
            />
          </div>

          <form onSubmit={handleSaveBulkStock} className="flex flex-col gap-4 flex-grow overflow-hidden">
            {/* Scrollable products list in 2-column grid */}
            <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-[45vh] bg-slate-50 p-4">
              {bulkEdits.filter(item => item.name.toLowerCase().includes(bulkSearch.toLowerCase())).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bulkEdits
                    .filter(item => item.name.toLowerCase().includes(bulkSearch.toLowerCase()))
                    .map((item) => {
                      const finalStock = Math.max(0, item.currentStock + item.adjustment);
                      const isChanged = item.adjustment !== 0;
                      return (
                        <div key={item.id} className="p-4 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-4 hover:shadow-md hover:border-slate-300 transition duration-200">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{item.category}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            {/* Real-time preview indicator */}
                            <div className="text-right w-20">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Preview</span>
                              <span className="text-xs font-semibold text-slate-500">
                                {item.currentStock}
                                <span className={`mx-1 font-bold ${isChanged ? 'text-indigo-600' : 'text-slate-400'}`}>&rarr;</span>
                                <span className={`font-bold ${
                                  isChanged 
                                    ? item.adjustment > 0 
                                      ? 'text-emerald-600' 
                                      : 'text-rose-600' 
                                    : 'text-slate-700'
                                }`}>
                                  {finalStock}
                                </span>
                              </span>
                            </div>

                            {/* Adjustment input */}
                            <div className="w-18">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1 text-center">Ubah</span>
                              <Input
                                type="number"
                                value={item.adjustment}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setBulkEdits(prev =>
                                    prev.map(x => x.id === item.id ? { ...x, adjustment: val } : x)
                                  );
                                }}
                                className="w-full text-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 h-8 text-xs font-bold text-slate-800 px-1"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                  Tidak ada produk yang cocok dengan pencarian.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkStockModalOpen(false)}
                className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-5 h-10 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingBulk}
                className="rounded-lg bg-slate-900 text-white px-6 h-10 text-xs font-bold shadow-sm hover:scale-95 transition disabled:opacity-50 cursor-pointer border border-slate-950 flex items-center justify-center gap-1.5"
              >
                {isSubmittingBulk ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Simpan Perubahan Stok
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Atur Urutan Tampil */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="w-11/12 sm:max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto font-sans text-left flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <span className="material-symbols-outlined">reorder</span>
              Atur Urutan Tampil Katalog
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Gunakan tombol <strong>Naik ⬆️</strong> atau <strong>Turun ⬇️</strong> untuk menyesuaikan posisi tampil produk di katalog pembeli. Produk di bagian atas akan muncul lebih dulu.
          </p>

          <form onSubmit={handleSaveOrder} className="flex flex-col gap-4 flex-grow overflow-hidden">
            {/* List for sorting */}
            <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-[50vh] divide-y divide-slate-100 bg-white">
              {orderedProducts.length > 0 ? (
                orderedProducts.map((item, idx) => (
                  <div key={item.id} className="p-3 px-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{item.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition cursor-pointer"
                        title="Naik"
                      >
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === orderedProducts.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition cursor-pointer"
                        title="Turun"
                      >
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Belum ada produk untuk diurutkan.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="rounded-lg bg-white border border-slate-200 hover:bg-slate-50 px-5 h-10 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="rounded-lg bg-slate-900 text-white px-6 h-10 text-xs font-bold shadow-sm hover:scale-95 transition disabled:opacity-50 cursor-pointer border border-slate-950 flex items-center justify-center gap-1.5"
              >
                {isSubmittingOrder ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Simpan Urutan Baru
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

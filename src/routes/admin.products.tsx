import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { getAdminProducts, getAdminCategories, createAdminProduct, updateAdminProduct, toggleProductStatus, deleteAdminProduct } from '../utils/admin.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/admin/products')({
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
}

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: 0,
  durationMonths: 1,
  category: '',
  imageUrl: '',
}

function AdminProductsPage() {
  const { products: initialProducts, categories, error } = Route.useLoaderData()
  const [products, setProducts] = useState(initialProducts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleOpenEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      durationMonths: p.durationMonths,
      category: p.category,
      imageUrl: p.imageUrl || '',
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
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return
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
        <button
          onClick={handleOpenAdd}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white border border-slate-950 hover:scale-95 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Tambah Produk Baru
        </button>
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
                  onClick={() => handleDelete(p.id, p.name)}
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
        <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto font-sans text-left">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 font-display">
              {editingId ? 'Edit Detail Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition cursor-pointer"
              >
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
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

            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

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
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminProducts, getAdminCategories, createAdminProduct, updateAdminProduct, toggleProductStatus, deleteAdminProduct } from '../utils/admin.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Gagal mengubah status'}`)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) return
    try {
      const res = await deleteAdminProduct({ data: id })
      if (res.success) {
        setProducts(products.filter((p) => p.id !== id))
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || 'Gagal menghapus produk'}`)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Manajemen Produk & Katalog
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Tambah, sunting, non-aktifkan, atau kelola opsi langganan premium pelanggan.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white border-0 hover:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-sans"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Tambah Produk Baru
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Products grid list - redesigned to be 30% more compact (5-6 columns) */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((p) => (
          <Card key={p.id} className="rounded-xl overflow-hidden relative group border border-slate-200 bg-white flex flex-col p-0 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Image Section (Forced 1:1 aspect ratio) */}
            <div className="relative aspect-square w-full bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center shrink-0">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-3xl">inventory_2</span>
                  <span className="text-[9px] font-bold uppercase mt-1.5 text-slate-400">No Image</span>
                </div>
              )}
              
              {/* Category overlay */}
              <div className="absolute top-2 left-2">
                <span className="bg-white/95 backdrop-blur-sm text-slate-700 border border-slate-200/60 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  {p.category}
                </span>
              </div>

              {/* Status overlay (pill layout) */}
              <div className="absolute top-2 right-2">
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
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-700 transition line-clamp-1" title={p.name}>
                  {p.name}
                </h3>
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

      {/* dialog Popup for Product Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto font-sans text-left">
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga (IDR)
                </Label>
                <Input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
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
                className="rounded-lg bg-slate-900 text-white px-6 h-10 text-xs font-bold shadow-sm hover:scale-95 transition disabled:opacity-50 cursor-pointer border-0 font-sans"
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

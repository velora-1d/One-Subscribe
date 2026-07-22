import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from '../utils/admin.functions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/admin/categories')({
  loader: async () => {
    try {
      const res = await getAdminCategories()
      return {
        categories: res.success ? res.categories : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { categories: [], error: err?.message || 'Gagal memuat kategori' }
    }
  },
  component: AdminCategoriesPage,
})

interface CategoryFormState {
  name: string
  description: string
}

const emptyForm: CategoryFormState = {
  name: '',
  description: '',
}

function formatDate(dateInput: any): string {
  const d = new Date(dateInput)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AdminCategoriesPage() {
  const { categories: initialCategories, error } = Route.useLoaderData()
  const [categoriesList, setCategoriesList] = useState(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      description: cat.description || '',
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?`)) return
    try {
      const res = await deleteAdminCategory({ data: id })
      if (res.success) {
        setCategoriesList(categoriesList.filter((c) => c.id !== id))
        toast.success(`Kategori "${name}" berhasil dihapus.`)
      } else {
        toast.error(res.error || 'Gagal menghapus kategori.')
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal menghapus kategori'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      if (editingId) {
        // Edit Mode
        const res = await updateAdminCategory({
          data: {
            id: editingId,
            category: form,
          },
        })
        if (res.success && res.category) {
          setCategoriesList(
            categoriesList.map((c) => (c.id === editingId ? res.category : c))
          )
          setIsModalOpen(false)
        } else {
          setFormError(res.error || 'Gagal memperbarui kategori.')
        }
      } else {
        // Add Mode
        const res = await createAdminCategory({ data: form })
        if (res.success && res.category) {
          setCategoriesList([res.category, ...categoriesList])
          setIsModalOpen(false)
        } else {
          setFormError(res.error || 'Gagal menambah kategori baru.')
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const itemsPerPage = 10
  const totalPages = Math.ceil(categoriesList.length / itemsPerPage)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedCategories = categoriesList.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  return (
    <div className="space-y-8 font-sans text-left">
      {/* Title Panel */}
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">category</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Kelola Kategori Produk
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Tambah, ubah, dan hapus kategori katalog layanan digital Anda.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-bold text-white border border-slate-950 hover:scale-95 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          Tambah Kategori Baru
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Categories Management Table Section */}
      <section className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-slate-100/40">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/40">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Semua Kategori</h2>
          <span className="text-xs text-slate-500 font-bold">{categoriesList.length} Kategori terdaftar</span>
        </div>

        {categoriesList.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/20 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="pl-6 pr-2 py-4 w-16 text-left whitespace-nowrap">No</th>
                  <th className="px-6 py-4">Nama Kategori</th>
                  <th className="px-6 py-4">Deskripsi</th>
                  <th className="px-6 py-4">Tanggal Dibuat</th>
                  <th className="px-6 py-4 text-right pr-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {paginatedCategories.map((cat, index) => {
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="pl-6 pr-2 py-4 text-left font-bold text-slate-400 w-16 whitespace-nowrap">{((activePage - 1) * itemsPerPage) + index + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{cat.name}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={cat.description || ''}>
                        {cat.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {formatDate(cat.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right pr-12">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 font-sans"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="bg-red-50/50 hover:bg-red-100/70 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 font-sans"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] font-semibold text-left">
                <div>
                  Menampilkan {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, categoriesList.length)} dari {categoriesList.length} entri
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
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 max-w-sm mx-auto shadow-xs flex flex-col items-center mt-6">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
              <span className="material-symbols-outlined text-2xl">category</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">Kategori Kosong</h3>
            <p className="text-[11px] text-slate-400 font-semibold max-w-[240px] text-center leading-relaxed">
              Belum ada kategori yang ditambahkan dalam database saat ini.
            </p>
          </div>
        )}
      </section>

      {/* Dialog Popup for Category Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto font-sans text-left">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 font-display">
              {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
                Nama Kategori
              </Label>
              <Input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: AI Tools, Streaming, Design"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 h-10 text-xs text-slate-800 outline-none transition"
              />
            </div>

            <div>
              <Label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Kategori (Opsional)
              </Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Penjelasan singkat mengenai kategori produk ini..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-slate-900 px-3 py-2 text-xs text-slate-800 outline-none transition resize-none min-h-[80px]"
              />
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
                {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

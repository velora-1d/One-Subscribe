import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  getAdminMessageTemplates,
  saveAdminMessageTemplate,
  deleteAdminMessageTemplate,
} from '../utils/admin.functions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/admin/templates')({
  loader: async () => {
    try {
      const res = await getAdminMessageTemplates()
      return {
        templates: res.success ? res.templates : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { templates: [], error: err?.message || 'Gagal memuat template' }
    }
  },
  component: AdminTemplatesPage,
})

interface TemplateFormState {
  name: string
  code: string
  content: string
}

const emptyForm: TemplateFormState = {
  name: '',
  code: '',
  content: '',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_')
}

function formatDate(dateInput: any): string {
  const d = new Date(dateInput)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AdminTemplatesPage() {
  const { templates: initialTemplates, error } = Route.useLoaderData()
  const [templatesList, setTemplatesList] = useState(initialTemplates)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null)

  const [itemsPerPage, setItemsPerPage] = useState(10)

  const handleOpenAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (t: any) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      code: t.code,
      content: t.content,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)
    const newValue = before + variable + after
    setForm(prev => ({ ...prev, content: newValue }))
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + variable.length
    }, 0)
  }

  const handleDelete = (id: string, name: string, code: string) => {
    if (code === 'payment_success' || code === 'fulfillment_success') {
      toast.error(`Template "${name}" adalah bawaan sistem otomatis dan tidak dapat dihapus.`)
      return
    }
    setDeleteTarget({ id, name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const { id, name } = deleteTarget
    setDeleteTarget(null)
    try {
      const res = await deleteAdminMessageTemplate({ data: id })
      if (res.success) {
        setTemplatesList(templatesList.filter((t) => t.id !== id))
        toast.success(`Template "${name}" berhasil dihapus.`)
      } else {
        toast.error(res.error || 'Gagal menghapus template.')
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal menghapus template'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      const res = await saveAdminMessageTemplate({
        data: {
          id: editingId || undefined,
          name: form.name,
          code: form.code,
          content: form.content,
        },
      })

      if (res.success) {
        toast.success(editingId ? 'Template berhasil diperbarui!' : 'Template berhasil ditambahkan!')
        const refreshed = await getAdminMessageTemplates()
        if (refreshed.success) {
          setTemplatesList(refreshed.templates)
        }
        setIsModalOpen(false)
      } else {
        setFormError(res.error || 'Gagal menyimpan template.')
      }
    } catch (err: any) {
      setFormError(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredTemplates = templatesList.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage)
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Manajemen Template Pesan
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Kelola template pesan otomatis dan kustom untuk WhatsApp & Email pelanggan.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 shadow-md transition-transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer shadow-slate-900/10"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Tambah Template
        </button>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Filter and Content panel */}
      <div className="island-shell border border-[var(--line)] rounded-3xl p-6 bg-white shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama atau kode template..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-850 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-medium text-slate-600">
             <thead className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-4 text-center w-14 whitespace-nowrap">No.</th>
                <th className="px-6 py-4">Nama Template</th>
                <th className="px-6 py-4">Kode Pemicu / Trigger</th>
                <th className="px-6 py-4">Isi Konten Pesan</th>
                <th className="px-6 py-4">Terakhir Diupdate</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedTemplates.length > 0 ? (
                paginatedTemplates.map((t, index) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-4 text-center font-semibold text-slate-500 whitespace-nowrap">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{t.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold rounded-lg text-[10px]">
                        {t.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-500 font-medium whitespace-pre-wrap">
                      {t.content}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-semibold">{formatDate(t.updatedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer hover:scale-95 flex items-center justify-center shadow-2xs"
                          title="Edit Template"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name, t.code)}
                          className={`h-8 w-8 rounded-lg border transition cursor-pointer hover:scale-95 flex items-center justify-center shadow-2xs ${
                            t.code === 'payment_success' || t.code === 'fulfillment_success'
                              ? 'border-slate-200 bg-slate-50 text-slate-450 hover:bg-slate-100'
                              : 'border-red-200 bg-red-50 text-red-650 hover:bg-red-100'
                          }`}
                          title={
                            t.code === 'payment_success' || t.code === 'fulfillment_success'
                              ? 'Template sistem tidak dapat dihapus'
                              : 'Hapus Template'
                          }
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                    Tidak ada data template ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {/* Pagination Section */}
        {filteredTemplates.length > 10 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-slate-500 font-semibold text-left">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTemplates.length)} dari {filteredTemplates.length} Template
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
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-2 text-slate-700 transition cursor-pointer hover:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-2 text-slate-700 transition cursor-pointer hover:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-900">
              {editingId ? 'Edit Template Pesan' : 'Tambah Template Pesan Baru'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl text-center">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Nama Template
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => {
                  const val = e.target.value
                  setForm(prev => {
                    const isPresetCode = [
                      'payment_success',
                      'fulfillment_success',
                      'order_created',
                      'payment_pending',
                      'payment_failed',
                      'manual_send'
                    ].includes(prev.code)
                    return {
                      ...prev,
                      name: val,
                      code: isPresetCode ? prev.code : slugify(val)
                    }
                  })
                }}
                placeholder="Contoh: Notifikasi Tagihan"
                required
                className="rounded-xl border-slate-200 focus:ring-slate-900 bg-slate-50 focus:bg-white text-xs py-2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Kode Pemicu / Trigger
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pb-1">
                {[
                  { label: 'Pembayaran Sukses (Sistem)', code: 'payment_success' },
                  { label: 'Aktivasi Akun (Sistem)', code: 'fulfillment_success' },
                  { label: 'Pesanan Dibuat', code: 'order_created' },
                  { label: 'Menunggu Pembayaran', code: 'payment_pending' },
                  { label: 'Pembayaran Gagal', code: 'payment_failed' },
                  { label: 'Hanya Kirim Manual', code: 'manual_send' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setForm({ ...form, code: item.code })}
                    disabled={editingId !== null && (form.code === 'payment_success' || form.code === 'fulfillment_success')}
                    className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border transition cursor-pointer flex items-center justify-center text-center leading-tight h-10 w-full ${
                      form.code === item.code
                        ? 'bg-slate-900 border-slate-950 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    <span className="line-clamp-2">{item.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, code: form.name ? slugify(form.name) : 'custom_trigger' })}
                  disabled={editingId !== null && (form.code === 'payment_success' || form.code === 'fulfillment_success')}
                  className={`px-2 py-1.5 text-[10px] font-bold rounded-lg border transition cursor-pointer flex items-center justify-center text-center leading-tight h-10 w-full ${
                    ![
                      'payment_success',
                      'fulfillment_success',
                      'order_created',
                      'payment_pending',
                      'payment_failed',
                      'manual_send',
                    ].includes(form.code)
                      ? 'bg-slate-900 border-slate-950 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  Kustom Lainnya
                </button>
              </div>

              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="Contoh: tagihan_reminder (gunakan huruf kecil, angka, dan underscore)"
                required
                disabled={editingId !== null && (form.code === 'payment_success' || form.code === 'fulfillment_success')}
                className="rounded-xl border-slate-200 focus:ring-slate-900 bg-slate-50 focus:bg-white text-xs py-2.5 font-mono"
              />
              <span className="text-[10px] text-slate-400 font-semibold block leading-tight">
                * Gunakan kode pemicu unik. `payment_success` dan `fulfillment_success` adalah kode sistem otomatis.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Konten Template Pesan
              </Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Tulis isi pesan Anda..."
                required
                rows={6}
                className="rounded-xl border-slate-200 focus:ring-slate-900 bg-slate-50 focus:bg-white text-xs py-2"
              />
              
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                  Klik Variabel untuk Menyisipkan ke Kursor:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { label: 'Nama Pelanggan', val: '{customerName}' },
                    { label: 'Nama Produk', val: '{productName}' },
                    { label: 'ID Pesanan', val: '{orderId}' },
                    { label: 'Harga Pembelian', val: '{price}' },
                    { label: 'Catatan Tambahan', val: '{remarks}' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => insertVariable(item.val)}
                      className="px-2.5 py-2 text-[10px] font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer flex items-center justify-start gap-1.5 shadow-2xs w-full"
                    >
                      <span className="material-symbols-outlined text-[14px] font-bold text-emerald-500 shrink-0">add_circle</span>
                      <span className="truncate">{item.label} ({item.val})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Template'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-slate-100 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-red-50 text-red-650 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] font-bold text-red-650">warning</span>
              </div>
              <span className="font-display">Konfirmasi Hapus Template</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus template <span className="font-bold text-slate-900">"{deleteTarget?.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 shadow-md transition cursor-pointer"
            >
              Hapus Template
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

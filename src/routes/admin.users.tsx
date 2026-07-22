import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  getAdminUsers,
  toggleUserStatus,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  sendCustomWhatsapp,
  getAdminMessageTemplates,
} from '../utils/admin.functions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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

export const Route = createFileRoute('/admin/users')({
  loader: async () => {
    try {
      const res = await getAdminUsers()
      return {
        users: res.success ? res.users : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { users: [], error: err?.message || 'Gagal memuat data user' }
    }
  },
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { users: initialUsers, error } = Route.useLoaderData()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // WhatsApp Modal States
  const [isWaModalOpen, setIsWaModalOpen] = useState(false)
  const [waTargetNumber, setWaTargetNumber] = useState('')
  const [waTargetName, setWaTargetName] = useState('')
  const [waMessage, setWaMessage] = useState('')
  const [isSendingWa, setIsSendingWa] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [checkedTemplates, setCheckedTemplates] = useState<string[]>([])

  const handleOpenWhatsappModal = async (whatsapp: string, name: string) => {
    setWaTargetNumber(whatsapp || '')
    setWaTargetName(name || '')
    setWaMessage(`Halo ${name || ''},\n\n`)
    setCheckedTemplates([])
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
          .replaceAll('{orderId}', '')
          .replaceAll('{productName}', '')
          .replaceAll('{price}', '');
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

  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [role, setRole] = useState<'customer' | 'admin'>('customer')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleOpenAdd = () => {
    setModalMode('add')
    setEditingUserId(null)
    setName('')
    setEmail('')
    setWhatsapp('')
    setRole('customer')
    setPassword('')
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user: any) => {
    setModalMode('edit')
    setEditingUserId(user.id)
    setName(user.name)
    setEmail(user.email)
    setWhatsapp(user.whatsapp)
    setRole(user.role)
    setPassword('')
    setShowPassword(false)
    setIsModalOpen(true)
  }

  const handleToggleBlock = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'memblokir' : 'mengaktifkan kembali'
    if (!confirm(`Apakah Anda yakin ingin ${actionText} user ini?`)) return

    try {
      const res = await toggleUserStatus({
        data: {
          id,
          isActive: !currentStatus,
        },
      })

      if (res.success) {
        setUsers(
          users.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
        )
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal mengubah status'}`)
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return

    try {
      const res = await deleteAdminUser({ data: id })
      if (res.success) {
        setUsers(users.filter((u) => u.id !== id))
        toast.success(`User "${name}" berhasil dihapus.`)
      } else {
        toast.error(`Gagal menghapus: ${res.error}`)
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Gagal menghapus'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (modalMode === 'add') {
        const res = await createAdminUser({
          data: {
            name,
            email,
            password,
            whatsapp,
            role,
          },
        })

        if (res.success) {
          const refreshedRes = await getAdminUsers()
          if (refreshedRes.success) {
            setUsers(refreshedRes.users)
          }
          setIsModalOpen(false)
          toast.success(`User "${name}" berhasil dibuat!`)
        } else {
          toast.error(`Gagal: ${res.error}`)
        }
      } else {
        if (!editingUserId) return

        const res = await updateAdminUser({
          data: {
            id: editingUserId,
            name,
            email,
            whatsapp,
            role,
            password: password || undefined,
          },
        })

        if (res.success) {
          const refreshedRes = await getAdminUsers()
          if (refreshedRes.success) {
            setUsers(refreshedRes.users)
          }
          setIsModalOpen(false)
          toast.success(`User "${name}" berhasil diperbarui!`)
        } else {
          toast.error(`Gagal: ${res.error}`)
        }
      }
    } catch (err: any) {
      toast.error(`Error: ${err?.message || 'Terjadi kesalahan'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase()
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
  })

  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedUsers = filteredUsers.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">group</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Manajemen Akun User
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Kelola administrator dan pelanggan terdaftar, buat akun manual, edit data kontak, atau hapus & blokir akun bermasalah.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full sm:w-64 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs"
          />
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white border border-slate-950 hover:scale-95 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Tambah User
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-slate-100/40">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/20 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="pl-6 pr-2 py-4 w-16 text-left whitespace-nowrap">No</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Kontak Email</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Tanggal Registrasi</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedUsers.map((u, index) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="pl-6 pr-2 py-4 text-left font-bold text-slate-400 w-16 whitespace-nowrap">{((activePage - 1) * itemsPerPage) + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {u.whatsapp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-md border uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
                          : 'text-slate-600 bg-slate-50 border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-black rounded-full border ${
                        u.isActive
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                          : 'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        {u.isActive ? 'Aktif' : 'Diblokir'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenWhatsappModal(u.whatsapp, u.name)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-600 transition cursor-pointer hover:scale-95 flex items-center justify-center shadow-2xs"
                          title="Kirim WhatsApp"
                        >
                          <WhatsappIcon className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer hover:scale-95 flex items-center justify-center shadow-2xs"
                          title="Edit User"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleBlock(u.id, u.isActive)}
                          className={`h-8 w-8 rounded-lg border transition cursor-pointer hover:scale-95 flex items-center justify-center shadow-2xs ${
                            u.isActive
                              ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
                              : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={u.isActive ? 'Blokir' : 'Aktifkan'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {u.isActive ? 'block' : 'check_circle'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="h-8 w-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer hover:scale-95 flex items-center justify-center shadow-2xs"
                          title="Hapus User"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] font-semibold text-left">
                <div>
                  Menampilkan {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, filteredUsers.length)} dari {filteredUsers.length} entri
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
          <div className="text-center py-16 bg-white border-t border-slate-150 p-8 max-w-sm mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">Pengguna Kosong</h3>
            <p className="text-[11px] text-slate-400 font-semibold max-w-[240px] text-center leading-relaxed">
              Tidak ada data pengguna terdaftar yang cocok dengan pencarian kata kunci Anda.
            </p>
          </div>
        )}
      </div>

      {/* Dialog Form Popup */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto font-sans text-left">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 font-display border-b border-slate-100 pb-2">
              {modalMode === 'add' ? 'Tambah User Baru' : 'Ubah Data User'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nama Lengkap</Label>
              <Input
                type="text"
                required
                placeholder="Masukkan nama lengkap..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Alamat Email</Label>
              <Input
                type="email"
                required
                placeholder="Masukkan email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nomor WhatsApp</Label>
              <Input
                type="tel"
                required
                placeholder="Contoh: 081234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs"
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Role Pengguna</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'customer' | 'admin')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs cursor-pointer"
              >
                <option value="customer">Customer (Pelanggan)</option>
                <option value="admin">Admin (Administrator)</option>
              </select>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Password {modalMode === 'edit' && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required={modalMode === 'add'}
                  placeholder={modalMode === 'add' ? "Minimal 6 karakter..." : "Masukkan password baru untuk reset..."}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 py-2 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center cursor-pointer border-0 bg-transparent"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
                {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}

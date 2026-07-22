import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminUsers, toggleUserStatus } from '../utils/admin.functions'

export const Route = createFileRoute('/admin/users')({
  loader: async () => {
    try {
      const res = await getAdminUsers()
      return {
        users: res.success ? res.users : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { users: [], error: err?.message || 'Gagal memuat data pelanggan' }
    }
  },
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { users: initialUsers, error } = Route.useLoaderData()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')

  const handleToggleBlock = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'memblokir' : 'mengaktifkan kembali'
    if (!confirm(`Apakah Anda yakin ingin ${actionText} pelanggan ini?`)) return

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
      alert(`Error: ${err?.message || 'Gagal mengubah status'}`)
    }
  }

  // Filter users based on search query
  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase()
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--sea-ink)]">
            Manajemen Akun Pelanggan
          </h1>
          <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
            Pantau akun pelanggan terdaftar, cari data kontak WhatsApp, serta non-aktifkan/blokir akun bermasalah.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon-deep)] transition"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="island-shell border border-[var(--line)] rounded-3xl p-0 overflow-hidden bg-[var(--header-bg)]">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--chip-bg)] border-b border-[var(--line)] font-bold uppercase tracking-wider text-[var(--sea-ink)]">
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Kontak Email</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Tanggal Registrasi</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Aksi Blokir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-[var(--sea-ink-soft)]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--link-bg-hover)] transition">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-[var(--sea-ink)]">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {u.whatsapp}
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
                      <button
                        onClick={() => handleToggleBlock(u.id, u.isActive)}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold border transition cursor-pointer ${
                          u.isActive
                            ? 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'
                            : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive ? 'Blokir' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 italic text-xs">
            Tidak ada pelanggan terdaftar yang cocok dengan pencarian.
          </div>
        )}
      </div>
    </div>
  )
}

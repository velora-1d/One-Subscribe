import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { updateProfile, changePassword } from '../utils/auth.functions'
import { Route as RootRoute } from './__root'

export const Route = createFileRoute('/admin/profile')({
  component: AdminProfilePage,
})

function AdminProfilePage() {
  const { user } = RootRoute.useRouteContext()

  // Profile Form States
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '')
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password Form States
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passSuccess, setPassSuccess] = useState<string | null>(null)
  const [passError, setPassError] = useState<string | null>(null)
  const [isUpdatingPass, setIsUpdatingPass] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileSuccess(null)
    setProfileError(null)

    try {
      const res = await updateProfile({
        data: { name, email, whatsapp },
      })

      if (res?.success) {
        setProfileSuccess('✅ Profil berhasil diperbarui!')
        // Reload page to refresh context
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setProfileError(res?.error || 'Gagal memperbarui profil.')
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPass(true)
    setPassSuccess(null)
    setPassError(null)

    try {
      const res = await changePassword({
        data: { oldPassword, newPassword },
      })

      if (res?.success) {
        setPassSuccess('✅ Password berhasil diperbarui!')
        setOldPassword('')
        setNewPassword('')
      } else {
        setPassError(res?.error || 'Gagal mengubah password.')
      }
    } catch (err: any) {
      setPassError(err?.message || 'Terjadi kesalahan.')
    } finally {
      setIsUpdatingPass(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--sea-ink)]">
          Pengaturan Akun & Profil Admin
        </h1>
        <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
          Perbarui informasi profil diri Anda atau ganti password akun Anda.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info Form */}
        <div className="island-shell border border-[var(--line)] rounded-3xl p-6 bg-white shadow-xs">
          <h2 className="text-base font-extrabold text-[var(--sea-ink)] mb-4">
            Informasi Profil
          </h2>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-600">
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] shadow-sm outline-none focus:border-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] shadow-sm outline-none focus:border-slate-900 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                Nomor WhatsApp
              </label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] shadow-sm outline-none focus:border-slate-900 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full rounded-xl bg-slate-950 hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-sm hover:scale-95 transition-all disabled:opacity-50 cursor-pointer border-0"
            >
              {isUpdatingProfile ? 'Menyimpan...' : 'Perbarui Profil'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="island-shell border border-[var(--line)] rounded-3xl p-6 bg-white shadow-xs">
          <h2 className="text-base font-extrabold text-[var(--sea-ink)] mb-4">
            Ubah Password
          </h2>

          {passSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-600">
              {passSuccess}
            </div>
          )}

          {passError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] pl-4 pr-11 py-2.5 text-xs text-[var(--sea-ink)] shadow-sm outline-none focus:border-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] cursor-pointer"
                >
                  {showOldPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] pl-4 pr-11 py-2.5 text-xs text-[var(--sea-ink)] shadow-sm outline-none focus:border-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] cursor-pointer"
                >
                  {showNewPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingPass}
              className="w-full rounded-xl bg-slate-950 hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-sm hover:scale-95 transition-all disabled:opacity-50 cursor-pointer border-0"
            >
              {isUpdatingPass ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

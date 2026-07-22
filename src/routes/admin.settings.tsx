import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getAllSystemSettings, updateSystemSettings, testConnection } from '../utils/settings.functions'

export const Route = createFileRoute('/admin/settings')({
  loader: async () => {
    try {
      const res = await getAllSystemSettings()
      return {
        initialSettings: res.success ? res.settings : {},
      }
    } catch (e) {
      return { initialSettings: {} }
    }
  },
  component: AdminSettingsPage,
})

function AdminSettingsPage() {
  const { initialSettings } = Route.useLoaderData()
  
  const [activeGateway, setActiveGateway] = useState(initialSettings.active_payment_gateway || 'midtrans')
  const [midtransEnv, setMidtransEnv] = useState(initialSettings.midtrans_env || 'sandbox')
  const [pakasirEnv, setPakasirEnv] = useState(initialSettings.pakasir_env || 'sandbox')
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; success?: boolean; message?: string }>>({})

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMsg(null)

    const payload = {
      active_payment_gateway: activeGateway,
      midtrans_env: midtransEnv,
      pakasir_env: pakasirEnv,
    }

    try {
      const res = await updateSystemSettings({ data: payload })
      if (res.success) {
        setSuccessMsg('✅ Pengaturan sistem berhasil disimpan!')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        alert(res.error || 'Gagal menyimpan pengaturan.')
      }
    } catch (err: any) {
      alert(err?.message || 'Terjadi kesalahan saat menyimpan pengaturan.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async (service: 'midtrans' | 'pakasir' | 'fonnte' | 'evolution' | 'rustfs') => {
    setTestStatus(prev => ({ ...prev, [service]: { loading: true, message: undefined } }))

    try {
      const res = await testConnection({ data: { service } })
      setTestStatus(prev => ({
        ...prev,
        [service]: { loading: false, success: res.success, message: res.message || res.error }
      }))
    } catch (err: any) {
      setTestStatus(prev => ({
        ...prev,
        [service]: { loading: false, success: false, message: err?.message || 'Gagal melakukan tes koneksi.' }
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--sea-ink)]">
          Pengaturan Sistem & API
        </h1>
        <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
          Kendalikan gerbang pembayaran aktif, toggle lingkungan (sandbox/production), dan verifikasi status integrasi langsung dari variabel environment (`.env`).
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-600 rounded-xl text-center">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Active Payment Gateway Selector Card */}
        <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-[var(--header-bg)] shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3 pb-3 border-b border-[var(--line)]">
            <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-sm">settings_input_component</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                Gerbang Pembayaran Utama (Aktif)
              </h2>
              <p className="text-[10px] text-[var(--sea-ink-soft)] font-medium">
                Pilih gerbang pembayaran otomatis yang akan digunakan oleh pembeli saat checkout
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Midtrans Active Card */}
            <div
              onClick={() => setActiveGateway('midtrans')}
              className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                activeGateway === 'midtrans'
                  ? 'border-slate-900 bg-slate-50 shadow-sm'
                  : 'border-[var(--line)] hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  activeGateway === 'midtrans' ? 'border-slate-950' : 'border-slate-300'
                }`}>
                  {activeGateway === 'midtrans' && (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Midtrans Gateway</span>
                  <span className="text-[10px] text-[var(--sea-ink-soft)]">Otomatisasi via QRIS, GoPay, Transfer VA Bank</span>
                </div>
              </div>
              <span className="text-[9px] font-black tracking-widest text-[var(--sea-ink-soft)] uppercase bg-white border border-[var(--line)] px-2.5 py-1 rounded-md shadow-2xs">
                MIDTRANS
              </span>
            </div>

            {/* Pakasir Active Card */}
            <div
              onClick={() => setActiveGateway('pakasir')}
              className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                activeGateway === 'pakasir'
                  ? 'border-slate-900 bg-slate-50 shadow-sm'
                  : 'border-[var(--line)] hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  activeGateway === 'pakasir' ? 'border-slate-950' : 'border-slate-300'
                }`}>
                  {activeGateway === 'pakasir' && (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Pakasir Gateway</span>
                  <span className="text-[10px] text-[var(--sea-ink-soft)]">Otomatisasi via Alfamart/Indomaret & E-Wallet Lokal</span>
                </div>
              </div>
              <span className="text-[9px] font-black tracking-widest text-[var(--sea-ink-soft)] uppercase bg-white border border-[var(--line)] px-2.5 py-1 rounded-md shadow-2xs">
                PAKASIR
              </span>
            </div>
          </div>
        </div>

        {/* Row 1 Grid: 3 Columns (Midtrans, Pakasir, RustFS) */}
        <div className="grid gap-6 md:grid-cols-3 animate-fadeIn">
          {/* Payment Gateway: Midtrans */}
          <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-white shadow-xs h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
              <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                Midtrans API Settings
              </h2>
              <button
                type="button"
                disabled={testStatus['midtrans']?.loading}
                onClick={() => handleTestConnection('midtrans')}
                className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-1.5 text-[10px] font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
                {testStatus['midtrans']?.loading ? 'Menguji...' : 'Tes Koneksi'}
              </button>
            </div>

            {testStatus['midtrans']?.message && (
              <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
                testStatus['midtrans']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {testStatus['midtrans']?.success ? 'check_circle' : 'error'}
                </span>
                <span>{testStatus['midtrans']?.message}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                Environment Mode
              </label>
              <select
                value={midtransEnv}
                onChange={(e) => setMidtransEnv(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-slate-900 transition"
              >
                <option value="sandbox">Sandbox (Development / Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>

            <p className="text-[10px] text-[var(--sea-ink-soft)] leading-relaxed italic m-0">
              Menggunakan kredensial dari `.env`: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{midtransEnv === 'production' ? 'MIDTRANS_PRODUCTION_SERVER_KEY' : 'MIDTRANS_SANDBOX_SERVER_KEY'}</code>.
            </p>
          </div>

          {/* Payment Gateway: Pakasir */}
          <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-white shadow-xs h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
              <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                Pakasir API Settings
              </h2>
              <button
                type="button"
                disabled={testStatus['pakasir']?.loading}
                onClick={() => handleTestConnection('pakasir')}
                className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-1.5 text-[10px] font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
                {testStatus['pakasir']?.loading ? 'Menguji...' : 'Tes Koneksi'}
              </button>
            </div>

            {testStatus['pakasir']?.message && (
              <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
                testStatus['pakasir']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {testStatus['pakasir']?.success ? 'check_circle' : 'error'}
                </span>
                <span>{testStatus['pakasir']?.message}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-1">
                Environment Mode
              </label>
              <select
                value={pakasirEnv}
                onChange={(e) => setPakasirEnv(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-slate-900 transition"
              >
                <option value="sandbox">Sandbox (Development / Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>

            <p className="text-[10px] text-[var(--sea-ink-soft)] leading-relaxed italic m-0">
              Menggunakan kredensial dari `.env`: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">PAKASIR_SLUG</code> & <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{pakasirEnv === 'production' ? 'PAKASIR_PRODUCTION_API_KEY' : 'PAKASIR_API_KEY'}</code>.
            </p>
          </div>

          {/* Storage Gateway: RustFS */}
          <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-white shadow-xs h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
                <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                  RustFS Storage Gateway
                </h2>
                <button
                  type="button"
                  disabled={testStatus['rustfs']?.loading}
                  onClick={() => handleTestConnection('rustfs')}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-1.5 text-[10px] font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
                  {testStatus['rustfs']?.loading ? 'Menguji...' : 'Tes Koneksi'}
                </button>
              </div>

              {testStatus['rustfs']?.message && (
                <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
                  testStatus['rustfs']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {testStatus['rustfs']?.success ? 'check_circle' : 'error'}
                  </span>
                  <span>{testStatus['rustfs']?.message}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-[var(--sea-ink-soft)] leading-relaxed italic m-0">
              Menggunakan kredensial dari `.env`: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">RUSTFS_ENDPOINT</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">RUSTFS_ACCESS_KEY</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">RUSTFS_SECRET_KEY</code>, & <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">RUSTFS_BUCKET</code>.
            </p>
          </div>
        </div>

        {/* Row 2 Grid: 2 Columns (Fonnte, Evolution) */}
        <div className="grid gap-6 md:grid-cols-2 animate-fadeIn">
          {/* Messaging Gateway: Fonnte */}
          <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-white shadow-xs h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
              <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                Fonnte WhatsApp API
              </h2>
              <button
                type="button"
                disabled={testStatus['fonnte']?.loading}
                onClick={() => handleTestConnection('fonnte')}
                className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-1.5 text-[10px] font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
                {testStatus['fonnte']?.loading ? 'Menguji...' : 'Tes Koneksi'}
              </button>
            </div>

            {testStatus['fonnte']?.message && (
              <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
                testStatus['fonnte']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {testStatus['fonnte']?.success ? 'check_circle' : 'error'}
                </span>
                <span>{testStatus['fonnte']?.message}</span>
              </div>
            )}

            <p className="text-[10px] text-[var(--sea-ink-soft)] leading-relaxed italic m-0">
              Menggunakan token dari `.env`: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">FONNTE_TOKEN</code>.
              Pastikan device Anda di Fonnte dalam status terhubung (connected) agar pengiriman pesan WhatsApp lancar.
            </p>
          </div>

          {/* Messaging Gateway: Evolution API */}
          <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-white shadow-xs h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
              <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                Evolution API WhatsApp
              </h2>
              <button
                type="button"
                disabled={testStatus['evolution']?.loading}
                onClick={() => handleTestConnection('evolution')}
                className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-1.5 text-[10px] font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
                {testStatus['evolution']?.loading ? 'Menguji...' : 'Tes Koneksi'}
              </button>
            </div>

            {testStatus['evolution']?.message && (
              <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
                testStatus['evolution']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {testStatus['evolution']?.success ? 'check_circle' : 'error'}
                </span>
                <span>{testStatus['evolution']?.message}</span>
              </div>
            )}

            <p className="text-[10px] text-[var(--sea-ink-soft)] leading-relaxed italic m-0">
              Menggunakan kredensial dari `.env`: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">EVO_API_URL</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">EVO_API_KEY</code>, & <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">EVO_INSTANCE</code>.
            </p>
          </div>
        </div>

        {/* Save button panel */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-slate-950 px-8 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { getAllSystemSettings, updateSystemSettings, testConnection } from '../utils/settings.functions'
import { PageTableSkeleton } from '../components/ui/skeletons'

export const Route = createFileRoute('/admin/settings')({
  loader: async () => {
    try {
      const res = await getAllSystemSettings()
      return {
        initialSettings: (res.success ? res.settings : {}) as Record<string, string>,
      }
    } catch (e) {
      return { initialSettings: {} as Record<string, string> }
    }
  },
  pendingComponent: PageTableSkeleton,
  component: AdminSettingsPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function AdminSettingsPage() {
  const { initialSettings } = Route.useLoaderData()
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false)
  
  const [activeGateway, setActiveGateway] = useState(initialSettings.active_payment_gateway || 'midtrans')
  const [midtransEnv, setMidtransEnv] = useState(initialSettings.midtrans_env || 'sandbox')
  const [pakasirEnv, setPakasirEnv] = useState(initialSettings.pakasir_env || 'sandbox')
  const [activeWaGateway, setActiveWaGateway] = useState(initialSettings.active_wa_gateway || 'fonnte')
  
  const [isSaving, setIsSaving] = useState(false)
  const [testStatus, setTestStatus] = useState<Record<string, { loading: boolean; success?: boolean; message?: string }>>({})

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = {
      active_payment_gateway: activeGateway,
      midtrans_env: midtransEnv,
      pakasir_env: pakasirEnv,
      active_wa_gateway: activeWaGateway,
    }

    try {
      const res = await updateSystemSettings({ data: payload })
      if (res.success) {
        toast.success('Pengaturan sistem berhasil disimpan!')
      } else {
        toast.error(res.error || 'Gagal menyimpan pengaturan.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat menyimpan pengaturan.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async (service: 'midtrans' | 'pakasir' | 'fonnte' | 'evolution' | 'rustfs' | 'midtrans_callback' | 'pakasir_callback' | 'email') => {
    setTestStatus(prev => ({ ...prev, [service]: { loading: true, message: undefined } }))

    try {
      const res = await testConnection({ data: { service } })
      setTestStatus(prev => ({
        ...prev,
        [service]: { loading: false, success: res.success, message: (res as any).message || (res as any).error }
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
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">settings</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Pengaturan Sistem & API
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Kendalikan gerbang pembayaran aktif, toggle lingkungan (sandbox/production), dan verifikasi status integrasi langsung dari variabel environment (`.env`).
            </p>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsReceiptPreviewOpen(true)}
            className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-350 px-5 py-2.5 text-xs font-bold text-slate-700 transition flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">receipt</span>
            Pratinjau Struk PDF
          </button>
        </div>
      </header>

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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={testStatus['midtrans']?.loading}
                  onClick={() => handleTestConnection('midtrans')}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1 text-[10px] font-bold text-slate-800 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
                  {testStatus['midtrans']?.loading ? 'Menguji...' : 'Tes Koneksi'}
                </button>
                <button
                  type="button"
                  disabled={testStatus['midtrans_callback']?.loading}
                  onClick={() => handleTestConnection('midtrans_callback')}
                  className="rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 text-[10px] font-bold text-indigo-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">webhook</span>
                  {testStatus['midtrans_callback']?.loading ? 'Menguji...' : 'Tes Callback'}
                </button>
              </div>
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

            {testStatus['midtrans_callback']?.message && (
              <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
                testStatus['midtrans_callback']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {testStatus['midtrans_callback']?.success ? 'check_circle' : 'error'}
                </span>
                <span>{testStatus['midtrans_callback']?.message}</span>
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={testStatus['pakasir']?.loading}
                  onClick={() => handleTestConnection('pakasir')}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1 text-[10px] font-bold text-slate-800 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
                  {testStatus['pakasir']?.loading ? 'Menguji...' : 'Tes Koneksi'}
                </button>
                <button
                  type="button"
                  disabled={testStatus['pakasir_callback']?.loading}
                  onClick={() => handleTestConnection('pakasir_callback')}
                  className="rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 text-[10px] font-bold text-indigo-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">webhook</span>
                  {testStatus['pakasir_callback']?.loading ? 'Menguji...' : 'Tes Callback'}
                </button>
              </div>
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

            {testStatus['pakasir_callback']?.message && (
              <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
                testStatus['pakasir_callback']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {testStatus['pakasir_callback']?.success ? 'check_circle' : 'error'}
                </span>
                <span>{testStatus['pakasir_callback']?.message}</span>
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

        {/* Active WhatsApp Gateway Selector Card */}
        <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-[var(--header-bg)] shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
          <div className="flex items-center gap-3 pb-3 border-b border-[var(--line)]">
            <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-sm">chat</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                WhatsApp Gateway Utama (Aktif)
              </h2>
              <p className="text-[10px] text-[var(--sea-ink-soft)] font-medium">
                Pilih gateway WhatsApp yang akan digunakan untuk mengirimkan notifikasi transaksi ke pembeli
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Fonnte Active Card */}
            <div
              onClick={() => setActiveWaGateway('fonnte')}
              className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                activeWaGateway === 'fonnte'
                  ? 'border-slate-900 bg-slate-50 shadow-sm'
                  : 'border-[var(--line)] hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  activeWaGateway === 'fonnte' ? 'border-slate-950' : 'border-slate-300'
                }`}>
                  {activeWaGateway === 'fonnte' && (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Fonnte API</span>
                  <span className="text-[10px] text-[var(--sea-ink-soft)] font-medium">Pengiriman pesan menggunakan Fonnte WA Gateway</span>
                </div>
              </div>
              <span className="text-[9px] font-black tracking-widest text-[var(--sea-ink-soft)] uppercase bg-white border border-[var(--line)] px-2.5 py-1 rounded-md shadow-2xs">
                FONNTE
              </span>
            </div>

            {/* Evolution API Active Card */}
            <div
              onClick={() => setActiveWaGateway('evolution')}
              className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                activeWaGateway === 'evolution'
                  ? 'border-slate-900 bg-slate-50 shadow-sm'
                  : 'border-[var(--line)] hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  activeWaGateway === 'evolution' ? 'border-slate-950' : 'border-slate-300'
                }`}>
                  {activeWaGateway === 'evolution' && (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-950" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Evolution API</span>
                  <span className="text-[10px] text-[var(--sea-ink-soft)] font-medium">Pengiriman pesan menggunakan Evolution API mandiri</span>
                </div>
              </div>
              <span className="text-[9px] font-black tracking-widest text-[var(--sea-ink-soft)] uppercase bg-white border border-[var(--line)] px-2.5 py-1 rounded-md shadow-2xs">
                EVOLUTION
              </span>
            </div>
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

        {/* Email Gateway Card */}
        <div className="island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4 bg-white shadow-xs animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-sm">mail</span>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[var(--sea-ink)]">
                  Email Gateway (SMTP / Resend)
                </h2>
                <p className="text-[10px] text-[var(--sea-ink-soft)] font-medium">
                  Status integrasi layanan email transaksional aktif
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={testStatus['email']?.loading}
              onClick={() => handleTestConnection('email')}
              className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-1.5 text-[10px] font-bold text-slate-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[12px] font-bold">sync_alt</span>
              {testStatus['email']?.loading ? 'Menguji...' : 'Tes Koneksi'}
            </button>
          </div>

          {testStatus['email']?.message && (
            <div className={`p-3 rounded-xl text-[10px] font-semibold flex items-center gap-2 ${
              testStatus['email']?.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-fadeIn' : 'bg-red-50 text-red-600 border border-red-100 animate-fadeIn'
            }`}>
              <span className="material-symbols-outlined text-[14px]">
                {testStatus['email']?.success ? 'check_circle' : 'error'}
              </span>
              <span>{testStatus['email']?.message}</span>
            </div>
          )}

          <p className="text-[10px] text-[var(--sea-ink-soft)] leading-relaxed italic m-0">
            Menggunakan provider email aktif dari berkas konfigurasi `.env`. 
            Provider aktif: <strong className="uppercase text-slate-800">{process.env.EMAIL_PROVIDER || 'resend'}</strong>. 
            {(process.env.EMAIL_PROVIDER) === 'smtp' ? (
              <span> Host SMTP terhubung ke <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{process.env.SMTP_HOST || 'smtp.sumopod.com'}</code>.</span>
            ) : (
              <span> Resend API terhubung menggunakan <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">RESEND_API_KEY</code>.</span>
            )}
          </p>
        </div>

        {/* Save button panel */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-slate-950 border border-slate-850 px-8 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>

      {/* Mock Receipt Preview Modal for Admins */}
      {isReceiptPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 flex flex-col gap-5 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-700">receipt</span>
                Template Struk (Pratinjau)
              </h3>
              <button
                type="button"
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer flex items-center p-1.5 hover:bg-slate-100 rounded-full transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Printable Area */}
            <div 
              id="print-receipt-area" 
              className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto text-left relative"
            >
              {/* LUNAS Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                <div className="border-[6px] border-emerald-500/10 rounded-2xl px-6 py-2 rotate-[-25deg] text-center">
                  <span className="text-5xl font-black text-emerald-500/10 tracking-widest uppercase">LUNAS</span>
                </div>
              </div>
              {/* Logo & Inv Header */}
              <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4 z-10">
                <div className="flex items-center gap-2">
                  <img src="/logo-onesubs.webp" className="w-8 h-8 rounded-full object-cover" alt="Logo" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 leading-tight">OneSubscribe</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Digital Shop</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-xs text-slate-800 tracking-wider">STRUK RESMI</span>
                  <p className="text-[9px] text-slate-400 font-mono">ID: SUB-MOCK-9999</p>
                </div>
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-dashed border-slate-200 pb-4">
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Tanggal</span>
                  <span className="font-bold text-slate-700">
                    {new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider">Status</span>
                  <span className="inline-block font-extrabold text-[9px] px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-250">
                    Layanan Aktif
                  </span>
                </div>
              </div>

              {/* Customer billing details */}
              <div className="text-xs border-b border-dashed border-slate-200 pb-4">
                <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-1.5">Pelanggan</span>
                <strong className="text-slate-800 block">Mahin Utsman (Contoh)</strong>
                <span className="text-slate-500 block">nawawimahinutsman@gmail.com</span>
                <span className="text-slate-400 text-[10px] mt-0.5 block">082120318007</span>
              </div>

              {/* Purchase Details */}
              <div className="text-xs border-b border-dashed border-slate-200 pb-4">
                <div className="flex justify-between font-bold text-[9px] text-slate-400 uppercase tracking-wider mb-2.5">
                  <span>Deskripsi</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-slate-800 text-xs block">Netflix Premium (1 Bulan)</strong>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">
                      Streaming • 1 Bulan Langganan
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">{formatIDR(149000)}</span>
                </div>
              </div>

              {/* Order Total summary */}
              <div className="text-xs flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-700">{formatIDR(149000)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Biaya Admin</span>
                  <span className="text-slate-700">{formatIDR(0)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-800 border-t border-slate-200/60 pt-2.5 mt-1">
                  <span>Total Bayar</span>
                  <span>{formatIDR(149000)}</span>
                </div>
              </div>

              {/* Invoice Footer Notes */}
              <div className="text-center text-[9px] text-slate-400 font-semibold pt-3 border-t border-slate-100 flex flex-col gap-0.5 mt-2">
                <p>Terima kasih atas kepercayaan Anda!</p>
                <p className="text-[8px] text-slate-350">Struk elektronik ini valid dan diterbitkan otomatis oleh sistem OneSubscribe.</p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex gap-3 mt-1 no-print">
              <button
                type="button"
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="flex-1 rounded-xl bg-slate-55 border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-md hover:scale-98 transition cursor-pointer flex items-center justify-center gap-1.5 border-0"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Cetak / Save PDF
              </button>
            </div>

            {/* Print Only CSS Hack styling to cleanly force print area */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #print-receipt-area, #print-receipt-area * {
                  visibility: visible !important;
                }
                #print-receipt-area {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  margin: 0 !important;
                  padding: 24px !important;
                  background: white !important;
                  color: black !important;
                  box-shadow: none !important;
                  border: none !important;
                  z-index: 9999999 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />
          </div>
        </div>
      )}
    </div>
  )
}

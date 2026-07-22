import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getActiveSubscriptions, createOrder } from '../utils/order.functions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'

export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    try {
      const res = await getActiveSubscriptions()
      return {
        subscriptions: res.success ? res.subscriptions : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { subscriptions: [], error: err?.message || 'Gagal memuat langganan' }
    }
  },
  component: DashboardIndexPage,
})

function DashboardIndexPage() {
  const { subscriptions, error } = Route.useLoaderData()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Renewal State Variables
  const [selectedSub, setSelectedSub] = useState<any | null>(null)
  const [renewalDuration, setRenewalDuration] = useState<number>(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [renewalError, setRenewalError] = useState<string | null>(null)

  const handleOpenRenewal = (sub: any) => {
    setSelectedSub(sub)
    setRenewalDuration(sub.productDurationMonths || 1)
    setRenewalError(null)
  }

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub) return
    setIsSubmitting(true)
    setRenewalError(null)
    try {
      const res = await createOrder({
        data: {
          productId: selectedSub.productId,
          parentOrderId: selectedSub.id,
          durationMonths: renewalDuration,
        }
      })
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl
      } else {
        setRenewalError('Gagal membuat pesanan perpanjangan.')
      }
    } catch (err: any) {
      setRenewalError(err.message || 'Terjadi kesalahan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRenewalPriceInfo = () => {
    if (!selectedSub) return { basePrice: 0, finalPrice: 0, discountPercent: 0 }
    const baseMonthlyPrice = Math.round(selectedSub.productPrice / selectedSub.productDurationMonths)
    const basePrice = baseMonthlyPrice * renewalDuration
    let finalPrice = basePrice
    let discountPercent = 0

    if (renewalDuration === 3) {
      finalPrice = Math.round(finalPrice * 0.95)
      discountPercent = 5
    } else if (renewalDuration === 6) {
      finalPrice = Math.round(finalPrice * 0.90)
      discountPercent = 10
    } else if (renewalDuration === 12) {
      finalPrice = Math.round(finalPrice * 0.85)
      discountPercent = 15
    }

    return { basePrice, finalPrice, discountPercent }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <header className="relative bg-white border border-slate-200/85 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
              Layanan Aktif Saya
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Daftar seluruh langganan digital premium Anda yang sedang aktif.
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:scale-95 hover:bg-slate-800 transition-all no-underline shrink-0"
        >
          <span className="material-symbols-outlined text-[16px] font-bold">add</span>
          <span>Beli Langganan Baru</span>
        </Link>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {subscriptions.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {subscriptions.map((sub, index) => (
            <div
              key={sub.id}
              className="island-shell border border-[var(--line)] rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition duration-300 relative overflow-hidden"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex gap-3 items-center">
                    {sub.productImageUrl && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-[var(--line)] flex-shrink-0">
                        <img src={sub.productImageUrl} alt={sub.productName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-extrabold text-[var(--sea-ink)] leading-snug flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold">#{index + 1}</span>
                        {sub.productName}
                      </h3>
                      <span className="text-[10px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider">
                        {sub.productCategory}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                    Sisa {sub.remainingDuration} Bulan
                  </span>
                </div>

                {/* Credentials display block */}
                <div className="mt-4 p-4 rounded-2xl bg-[var(--chip-bg)] border border-[var(--chip-line)] space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--sea-ink-soft)] mb-2">
                    Kredensial Login
                  </h4>

                  {sub.accountEmail && sub.accountPassword ? (
                    <div className="space-y-2 text-xs">
                      {/* Email field */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--sea-ink-soft)] font-semibold">Email:</span>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <code className="text-[var(--sea-ink)] font-bold truncate block select-all">
                            {sub.accountEmail}
                          </code>
                          <button
                            onClick={() => copyToClipboard(sub.accountEmail, `${sub.id}-email`)}
                            className="text-[10px] text-[var(--lagoon-deep)] font-extrabold hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            {copiedId === `${sub.id}-email` ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                      </div>

                      {/* Password field */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[var(--sea-ink-soft)] font-semibold">Password:</span>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <code className="text-[var(--sea-ink)] font-bold truncate block select-all">
                            {sub.accountPassword}
                          </code>
                          <button
                            onClick={() => copyToClipboard(sub.accountPassword, `${sub.id}-pass`)}
                            className="text-[10px] text-[var(--lagoon-deep)] font-extrabold hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            {copiedId === `${sub.id}-pass` ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-[var(--sea-ink-soft)] italic m-0">
                        Kredensial sedang disiapkan oleh admin. Cek kembali nanti.
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional remarks */}
                {sub.remarks && (
                  <div className="mt-4 text-xs text-[var(--sea-ink-soft)] bg-amber-50/40 border border-amber-100 rounded-xl p-3">
                    <strong className="text-[var(--sea-ink)] font-bold">Catatan Admin:</strong> {sub.remarks}
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="mt-6 pt-4 border-t border-[var(--line)] text-[10px] text-[var(--sea-ink-soft)] flex justify-between items-center">
                <div className="flex flex-col text-left">
                  <span>Diaktifkan pada:</span>
                  <span className="font-semibold text-slate-800">{new Date(sub.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                </div>
                <button
                  onClick={() => handleOpenRenewal(sub)}
                  className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 text-[10px] shadow-sm transition hover:scale-95 cursor-pointer flex items-center gap-1 border-0"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">history_toggle</span>
                  Perpanjang
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 island-shell border border-[var(--line)] rounded-3xl">
          <svg className="mx-auto h-12 w-12 text-[var(--sea-ink-soft)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5a2 2 0 012-2h12a2 2 0 012 2z" />
          </svg>
          <h3 className="text-lg font-bold text-[var(--sea-ink)] mb-1">Belum Ada Layanan Aktif</h3>
          <p className="text-sm text-[var(--sea-ink-soft)] max-w-sm mx-auto mb-6">
            Anda belum berlangganan layanan premium apa pun atau pesanan Anda sedang menunggu pembayaran/aktivasi.
          </p>
          <Link
            to="/"
            className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:scale-95 hover:bg-slate-800 transition-all no-underline"
          >
            Lihat Katalog Layanan
          </Link>
        </div>
      )}

      {/* Renewal Dialog Modal */}
      {selectedSub && (
        <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
          <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl text-left font-sans">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                Perpanjang Masa Aktif Layanan
              </DialogTitle>
            </DialogHeader>

            {renewalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">
                {renewalError}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedSub.productImageUrl && (
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img src={selectedSub.productImageUrl} alt={selectedSub.productName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 leading-snug">{selectedSub.productName}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedSub.productCategory}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-650">
                <div className="flex justify-between">
                  <span>ID Langganan:</span>
                  <strong className="font-mono text-slate-800">{selectedSub.id}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Masa Aktif Sekarang:</span>
                  <strong className="text-slate-800">{selectedSub.remainingDuration} Bulan</strong>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Durasi Perpanjangan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 3, 6, 12].map((dur) => {
                    const baseMonthlyPrice = Math.round(selectedSub.productPrice / selectedSub.productDurationMonths)
                    let price = baseMonthlyPrice * dur
                    let discount = 0
                    if (dur === 3) {
                      price = Math.round(price * 0.95)
                      discount = 5
                    } else if (dur === 6) {
                      price = Math.round(price * 0.90)
                      discount = 10
                    } else if (dur === 12) {
                      price = Math.round(price * 0.85)
                      discount = 15
                    }

                    return (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setRenewalDuration(dur)}
                        className={`p-3 rounded-xl border-2 text-left transition cursor-pointer hover:border-slate-400 ${
                          renewalDuration === dur
                            ? 'border-slate-900 bg-slate-900/5'
                            : 'border-slate-200 bg-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-extrabold text-slate-800">+{dur} Bulan</span>
                          {discount > 0 && (
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded">
                              -{discount}%
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Subtotal:</span>
                  <span className="line-through">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(getRenewalPriceInfo().basePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-850">
                  <span>Total Bayar Baru:</span>
                  <span className="text-slate-900">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(getRenewalPriceInfo().finalPrice)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-855 px-6 py-2.5 text-xs font-bold transition cursor-pointer border-0"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRenewalSubmit}
                  disabled={isSubmitting}
                  className="rounded-full bg-slate-950 hover:bg-slate-900 text-white shadow-sm px-6 py-2.5 text-xs font-black transition cursor-pointer flex items-center gap-1.5 border-0"
                >
                  {isSubmitting ? 'Memproses...' : 'Lanjut Pembayaran'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

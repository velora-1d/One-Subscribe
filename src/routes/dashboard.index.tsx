import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getActiveSubscriptions } from '../utils/order.functions'

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--sea-ink)]">
            Layanan Aktif Saya
          </h1>
          <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
            Daftar seluruh langganan digital premium Anda yang sedang aktif.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:scale-95 hover:bg-slate-800 transition-all no-underline"
        >
          + Beli Langganan Baru
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {subscriptions.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {subscriptions.map((sub) => (
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
                      <h3 className="text-sm font-extrabold text-[var(--sea-ink)] leading-snug">
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
              <div className="mt-6 pt-4 border-t border-[var(--line)] text-[10px] text-[var(--sea-ink-soft)] flex justify-between">
                <span>Diaktifkan pada:</span>
                <span className="font-semibold">{new Date(sub.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
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
    </div>
  )
}

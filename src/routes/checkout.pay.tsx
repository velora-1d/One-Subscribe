import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getOrderById, simulatePaymentSuccess } from '../utils/order.functions'

export const Route = createFileRoute('/checkout/pay')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' })
    }
  },
  validateSearch: (search: Record<string, unknown> | undefined) => {
    return {
      orderId: (search?.orderId as string) || '',
    }
  },
  loaderDeps: ({ search: { orderId } }) => ({ orderId }),
  loader: async ({ deps: { orderId } }) => {
    try {
      const res = await getOrderById({ data: orderId })
      return {
        order: res.success ? res.order : null,
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { order: null, error: err?.message || 'Gagal memuat detail pesanan' }
    }
  },
  component: PaymentIframePage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function PaymentIframePage() {
  const { order, error } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null)
  const [showDevPanel, setShowDevPanel] = useState(false)

  // Real-time polling to auto-redirect when payment webhook updates the order status
  useEffect(() => {
    if (!order || order.status !== 'menunggu_pembayaran') return

    const interval = setInterval(async () => {
      try {
        const res = await getOrderById({ data: order.id })
        if (res.success && res.order && res.order.status !== 'menunggu_pembayaran') {
          clearInterval(interval)
          // Redirect to success page
          window.location.href = `/checkout/success?orderId=${order.id}`
        }
      } catch (e) {
        console.error('Error polling order status:', e)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [order])

  if (error || !order) {
    return (
      <main className="page-wrap px-4 py-16 text-center">
        <div className="island-shell rounded-3xl p-8 max-w-md mx-auto border border-[var(--line)] bg-white shadow-xs">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-sm text-[var(--sea-ink-soft)] mb-6">{error || 'Pesanan tidak ditemukan.'}</p>
          <Link to="/" className="rounded-full bg-slate-950 px-6 py-2.5 text-xs font-bold text-white no-underline">
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    )
  }

  const handleSimulatePayment = async () => {
    setIsProcessing(true)
    setStatusMsg(null)
    setStatusType(null)

    try {
      const res = await simulatePaymentSuccess({ data: order.id })
      if (res.success) {
        setStatusType('success')
        setStatusMsg('Pembayaran Berhasil! Mengalihkan ke halaman sukses...')
        setTimeout(() => {
          window.location.href = `/checkout/success?orderId=${order.id}`
        }, 1500)
      } else {
        setStatusType('error')
        setStatusMsg('Gagal memproses simulasi pembayaran.')
      }
    } catch (err: any) {
      setStatusType('error')
      setStatusMsg(`Error: ${err?.message || 'Terjadi kesalahan'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="page-wrap px-4 py-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--header-bg)] border border-[var(--line)] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)]">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="h-9 w-9 rounded-full bg-white border border-[var(--line)] flex items-center justify-center text-slate-800 hover:bg-slate-50 transition shadow-xs no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-[var(--sea-ink)] flex items-center gap-2">
              Pembayaran Pesanan
              <span className="text-xs bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-mono">
                {order.id}
              </span>
            </h1>
            <p className="text-[10px] text-[var(--sea-ink-soft)] font-medium mt-0.5">
              Selesaikan transaksi Anda melalui gerbang pembayaran aman di bawah ini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-[var(--sea-ink)]">
          <div className="text-right">
            <span className="text-[10px] text-[var(--sea-ink-soft)] block uppercase tracking-wider">Total Tagihan</span>
            <span className="text-sm font-black text-slate-900">{formatIDR(order.price)}</span>
          </div>
        </div>
      </div>

      {/* Main Payment Iframe Section */}
      <div className="bg-white border border-[var(--line)] rounded-[2rem] shadow-xs overflow-hidden flex flex-col min-h-[680px]">
        {/* Frame Title Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-[var(--line)] flex items-center justify-between text-xs text-[var(--sea-ink-soft)] font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="capitalize">Gerbang Pembayaran Resmi (OneSubscribe)</span>
          </div>
          <a
            href={order.paymentRedirectUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--lagoon-deep)] hover:underline flex items-center gap-1 text-[11px] no-underline font-bold"
          >
            Buka di Tab Baru
            <span className="material-symbols-outlined text-[12px] font-bold">open_in_new</span>
          </a>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-grow bg-slate-100 relative min-h-[600px]">
          {order.paymentRedirectUrl ? (
            <iframe
              src={order.paymentRedirectUrl}
              className="absolute inset-0 w-full h-full border-0 bg-white"
              title="Secure Payment Gateway Frame"
              allow="payment"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div>
                <span className="material-symbols-outlined text-[48px] text-red-500 mb-2">error</span>
                <p className="text-xs font-bold text-slate-800">URL Pembayaran tidak valid.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper notice */}
      <div className="text-center text-[10px] text-[var(--sea-ink-soft)] font-medium max-w-lg mx-auto leading-relaxed">
        Jendela pembayaran ini terhubung langsung secara aman. Jangan menutup halaman ini setelah membayar; Anda akan dialihkan secara otomatis setelah pembayaran terdeteksi.
      </div>

      {/* collapsible developer simulation panel */}
      <div className="border border-amber-200 bg-amber-50/40 rounded-3xl p-5 space-y-3">
        <button
          type="button"
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="flex items-center justify-between w-full text-xs font-bold text-amber-800 bg-transparent border-0 cursor-pointer outline-none"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">bug_report</span>
            Simulasi Pembayaran (Developer Mode)
          </span>
          <span className="material-symbols-outlined text-[16px]">
            {showDevPanel ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {showDevPanel && (
          <div className="space-y-3 pt-2 border-t border-amber-200/50">
            <p className="text-[10px] text-amber-700 leading-relaxed m-0">
              Gunakan opsi ini untuk mensimulasikan status sukses pembayaran tanpa menyelesaikan tagihan riil pada gerbang pembayaran.
            </p>

            {statusMsg && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                statusType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <span className="material-symbols-outlined text-[16px]">
                  {statusType === 'success' ? 'check_circle' : 'error'}
                </span>
                {statusMsg}
              </div>
            )}

            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing || order.status !== 'menunggu_pembayaran'}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer border-0"
            >
              {isProcessing ? 'Memproses...' : 'Simulasikan Sukses Instan'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

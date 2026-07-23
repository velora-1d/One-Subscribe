import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { getOrderById, simulatePaymentSuccess, cancelOrder } from '../utils/order.functions'

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
  const [isCanceling, setIsCanceling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
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

  const confirmCancelOrder = async () => {
    if (!order) return
    setIsCanceling(true)
    try {
      const res = await cancelOrder({ data: order.id })
      if (res.success) {
        toast.success('Pesanan berhasil dibatalkan.')
        setShowCancelModal(false)
        navigate({ to: '/dashboard/orders' })
      } else {
        toast.error(res.error || 'Gagal membatalkan pesanan.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat membatalkan pesanan.')
    } finally {
      setIsCanceling(false)
    }
  }

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
    <main className="page-wrap px-2 sm:px-4 py-2 max-w-4xl mx-auto space-y-2 font-sans text-left">
      {/* Top Header Bar - Ultra Compact */}
      <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 px-3 py-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Link
            to="/checkout"
            className="h-7 w-7 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition no-underline shrink-0"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
          </Link>
          <h1 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 m-0">
            Pembayaran Pesanan
            <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-1 py-0.2 font-mono">
              #{order.id.slice(-8)}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 shrink-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total:</span>
          <span className="text-xs font-extrabold text-emerald-600 mr-2">{formatIDR(order.price)}</span>
          
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={isCanceling || order.status === 'dibatalkan'}
            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
            title="Batalkan Pesanan Ini"
          >
            <span className="material-symbols-outlined text-[13px]">cancel</span>
            {isCanceling ? 'Batal...' : 'Batalkan'}
          </button>
        </div>
      </div>

      {/* Main Payment Iframe Section - Compact Height & Scaled Pakasir Viewport */}
      <div className="bg-white border border-slate-200 shadow-xs flex flex-col h-[550px] sm:h-[600px] overflow-hidden">
        {/* Frame Title Bar */}
        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700">Gerbang Pembayaran Resmi</span>
          </div>
          <a
            href={order.paymentRedirectUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 text-[10px] no-underline font-bold"
          >
            Buka Tab Baru
            <span className="material-symbols-outlined text-[11px] font-bold">open_in_new</span>
          </a>
        </div>

        {/* Embedded Iframe scaled for compact inner Pakasir layout */}
        <div className="flex-grow bg-slate-50 relative w-full h-full overflow-hidden">
          {order.paymentRedirectUrl ? (
            <iframe
              src={order.paymentRedirectUrl}
              className="absolute top-0 left-0 border-0 bg-white"
              style={{
                width: '117.65%',
                height: '117.65%',
                transform: 'scale(0.85)',
                transformOrigin: 'top left',
              }}
              title="Secure Payment Gateway Frame"
              allow="payment"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <div>
                <span className="material-symbols-outlined text-[32px] text-red-500 mb-1">error</span>
                <p className="text-xs font-bold text-slate-800 m-0">URL Pembayaran tidak valid.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper notice */}
      <div className="text-center text-[10px] text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
        Jendela pembayaran terhubung secara aman. Halaman ini akan otomatis dialihkan setelah pembayaran terkonfirmasi.
      </div>

      {/* Collapsible developer simulation panel - Sharp */}
      <div className="border border-amber-200 bg-amber-50/50 p-3 space-y-2 text-xs">
        <button
          type="button"
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="flex items-center justify-between w-full text-xs font-bold text-amber-800 bg-transparent border-0 cursor-pointer outline-none"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">bug_report</span>
            Simulasi Pembayaran (Developer Mode)
          </span>
          <span className="material-symbols-outlined text-[14px]">
            {showDevPanel ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {showDevPanel && (
          <div className="space-y-2 pt-2 border-t border-amber-200/60">
            <p className="text-[10px] text-amber-700 leading-relaxed m-0">
              Gunakan simulasi ini jika ingin menandai pesanan lunas secara langsung (untuk testing dev).
            </p>

            {statusMsg && (
              <div className={`p-2.5 border text-xs font-semibold flex items-center gap-2 ${
                statusType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {statusType === 'success' ? 'check_circle' : 'error'}
                </span>
                {statusMsg}
              </div>
            )}

            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing || order.status !== 'menunggu_pembayaran'}
              className="bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer border-0"
            >
              {isProcessing ? 'Memproses...' : 'Simulasikan Sukses Instan'}
            </button>
          </div>
        )}
      </div>

      {/* Custom Aesthetic Confirmation Modal */}
      {showCancelModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4 text-left font-sans animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 m-0">Batalkan Pesanan?</h3>
                <p className="text-[11px] text-slate-500 font-medium m-0 mt-0.5">
                  ID: <span className="font-mono text-slate-800 font-bold">{order.id}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Apakah Anda yakin ingin membatalkan checkout transaksi ini? Pesanan yang telah dibatalkan tidak dapat diaktifkan kembali.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
                className="px-4 py-2 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={confirmCancelOrder}
                disabled={isCanceling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border-0"
              >
                <span className="material-symbols-outlined text-[14px]">cancel</span>
                {isCanceling ? 'Memproses...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}

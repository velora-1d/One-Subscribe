import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
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
  loader: async ({ search }) => {
    try {
      const orderId = search?.orderId || ''
      const res = await getOrderById({ data: orderId })
      return {
        order: res.success ? res.order : null,
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { order: null, error: err?.message || 'Gagal memuat detail pesanan' }
    }
  },
  component: PaymentSimulatorPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function PaymentSimulatorPage() {
  const { order, error } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  if (error || !order) {
    return (
      <main className="page-wrap px-4 py-16 text-center">
        <div className="island-shell rounded-3xl p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-sm text-[var(--sea-ink-soft)] mb-6">{error || 'Pesanan tidak ditemukan.'}</p>
          <Link to="/" className="rounded-full bg-[var(--lagoon-deep)] px-6 py-2.5 text-xs font-bold text-white no-underline">
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    )
  }

  const handleSimulatePayment = async () => {
    setIsProcessing(true)
    setStatusMsg(null)

    try {
      const res = await simulatePaymentSuccess({ data: order.id })
      if (res.success) {
        setStatusMsg('✅ Pembayaran Berhasil! Mengalihkan ke halaman sukses...')
        setTimeout(() => {
          window.location.href = `/checkout/success?orderId=${order.id}`
        }, 1500)
      } else {
        setStatusMsg('❌ Gagal memproses simulasi pembayaran.')
      }
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err?.message || 'Terjadi kesalahan'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-[2.5rem] border border-[var(--line)] bg-[var(--header-bg)] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)] backdrop-blur-md relative overflow-hidden">
        {/* Aesthetic background gradients */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.15),transparent_70%)]" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.12),transparent_70%)]" />

        <div className="text-center mb-8 relative">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.1)] px-3.5 py-1.5 rounded-full inline-block mb-3">
            Simulasi Gateway {order.paymentMethod === 'midtrans' ? 'Midtrans Snap' : 'Pakasir Invoice'}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--sea-ink)]">
            Halaman Simulasi Pembayaran
          </h1>
          <p className="text-xs text-[var(--sea-ink-soft)] mt-1.5">
            Gunakan halaman ini untuk memverifikasi alur checkout dan status update webhook.
          </p>
        </div>

        {/* Order Details Panel */}
        <div className="bg-[var(--chip-bg)] border border-[var(--chip-line)] rounded-3xl p-6 mb-8 relative space-y-4 text-sm text-[var(--sea-ink-soft)]">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--line)]">
            <span className="font-bold text-xs uppercase tracking-wider">ID Pesanan</span>
            <span className="font-extrabold text-[var(--sea-ink)]">{order.id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Produk</span>
            <span className="font-bold text-[var(--sea-ink)]">{order.productName} ({order.productCategory})</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Durasi Paket</span>
            <span className="font-bold text-[var(--sea-ink)]">{order.remainingDuration} Bulan</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Metode Bayar</span>
            <span className="font-bold text-[var(--sea-ink)] uppercase">{order.paymentMethod}</span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[var(--line)] text-base font-black text-[var(--sea-ink)]">
            <span>Total Tagihan</span>
            <span>{formatIDR(order.price)}</span>
          </div>
        </div>

        {statusMsg && (
          <div className={`mb-6 p-4 rounded-xl border text-center text-xs font-semibold ${
            statusMsg.startsWith('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {statusMsg}
          </div>
        )}

        <div className="flex flex-col gap-3 relative">
          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing || order.status !== 'menunggu_pembayaran'}
            className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? 'Memproses Simulasi...' : order.status === 'menunggu_pembayaran' ? 'Simulasikan Pembayaran Sukses' : 'Pesanan Sudah Terbayar'}
          </button>
          
          <Link
            to="/"
            disabled={isProcessing}
            className="w-full text-center rounded-xl bg-[var(--chip-bg)] border border-[var(--chip-line)] py-3 text-xs font-bold text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] transition no-underline"
          >
            Batalkan Pembayaran
          </Link>
        </div>
      </div>
    </main>
  )
}

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { getOrderById } from '../utils/order.functions'

export const Route = createFileRoute('/checkout/success')({
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
  component: CheckoutSuccessPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function CheckoutSuccessPage() {
  const { order, error } = Route.useLoaderData()

  if (error || !order) {
    return (
      <main className="page-wrap px-4 py-16 text-center">
        <div className="island-shell rounded-3xl p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-sm text-[var(--sea-ink-soft)] mb-6">{error || 'Pesanan tidak ditemukan.'}</p>
          <Link to="/" className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-bold text-white no-underline">
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-12 bg-[#FCFBF7]">
      <div className="w-full max-w-xl rounded-[2.5rem] border border-[var(--line)] bg-white p-8 shadow-[0_30px_60px_rgba(0,0,0,0.06)] relative overflow-hidden text-center font-sans animate-in fade-in duration-300">
        {/* Confetti-like ambient colors */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.08),transparent_70%)]" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08),transparent_70%)]" />

        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-6 shadow-inner relative">
          <span className="material-symbols-outlined text-[42px] font-bold animate-pulse">check_circle</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Pembayaran Berhasil!
        </h1>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Terima kasih atas pemesanan Anda. Pembayaran Anda telah kami verifikasi dengan sukses dan pesanan sedang diproses.
        </p>

        {/* Info Box */}
        <div className="my-8 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-left space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Pesanan</span>
            <span className="font-extrabold text-slate-800 text-xs">{order.id}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Layanan Premium</span>
            <span className="font-bold text-slate-800">{order.productName}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Kategori & Durasi</span>
            <span className="font-bold text-slate-800">{order.productCategory} • {order.remainingDuration} Bulan</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Metode Pembayaran</span>
            <span className="font-bold text-slate-800 uppercase">{order.paymentMethod}</span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-black text-slate-900">
            <span>Total Bayar</span>
            <span>{formatIDR(order.price)}</span>
          </div>
        </div>

        {/* Activation Info Card */}
        <div className="mb-8 p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-left text-xs text-blue-800 leading-relaxed flex gap-3">
          <span className="material-symbols-outlined text-blue-500 shrink-0 select-none">info</span>
          <div>
            <strong className="block mb-0.5 text-blue-900">Proses Aktivasi Akun:</strong>
            Kredensial login premium (Email & Password) akan diproses oleh Admin dan dikirim langsung ke WhatsApp Anda dalam waktu **5-10 menit**. Anda juga dapat memantau status pesanan di Dashboard Anda.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/dashboard"
            className="flex-1 text-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3.5 text-xs font-bold shadow-md hover:scale-95 transition-all no-underline"
          >
            Masuk ke Dashboard
          </Link>
          <Link
            to="/"
            className="flex-1 text-center rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 text-xs font-bold hover:scale-95 transition-all no-underline"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </main>
  )
}

import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getProductById } from '../utils/product.functions'
import { createOrder } from '../utils/order.functions'
import { Route as RootRoute } from './__root'

export const Route = createFileRoute('/checkout')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' })
    }
  },
  validateSearch: (search: Record<string, unknown> | undefined) => {
    return {
      productId: (search?.productId as string) || '',
    }
  },
  loaderDeps: ({ search: { productId } }) => ({ productId }),
  loader: async ({ deps: { productId } }) => {
    try {
      const res = await getProductById({ data: productId })
      return {
        product: res.success ? res.product : null,
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { product: null, error: err?.message || 'Gagal memuat produk' }
    }
  },
  component: CheckoutPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
function CheckoutPage() {
  const { product, error } = Route.useLoaderData()
  const { user } = RootRoute.useRouteContext()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (error || !product) {
    return (
      <main className="page-wrap px-4 py-20 text-center min-h-[75vh] flex items-center justify-center">
        <div className="island-shell rounded-[2rem] border border-[var(--line)] p-10 max-w-md mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.04)] bg-white relative overflow-hidden">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-red-500/5 blur-2xl" />
          <span className="material-symbols-outlined text-[64px] text-red-500 mb-4 block">error</span>
          <h2 className="text-xl font-black text-slate-950 mb-2">Error Pemesanan</h2>
          <p className="text-xs text-[var(--sea-ink-soft)] mb-8 leading-relaxed">
            {error || 'Produk tidak ditemukan atau tidak tersedia.'}
          </p>
          <Link to="/" className="inline-flex w-full justify-center items-center rounded-2xl bg-slate-950 hover:bg-slate-800 py-3 text-xs font-bold text-white shadow-md transition-all no-underline">
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    )
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitError(null)

    try {
      const result = await createOrder({
        data: {
          productId: product.id,
        },
      })

      if (result?.success && result.redirectUrl) {
        // Redirect langsung ke payment gateway halaman eksternal
        window.location.href = result.redirectUrl
      } else {
        setSubmitError('Gagal memproses checkout. Silakan coba kembali.')
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Terjadi kesalahan saat memproses pesanan.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-24 pt-10 min-h-[85vh] bg-[#FCFBF7]/50 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.08),transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.05),transparent_70%)] blur-2xl" />

      <div className="max-w-4xl mx-auto relative">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-3">
          <Link to="/" className="hover:text-slate-900 transition no-underline">Katalog</Link>
          <span className="material-symbols-outlined text-[10px] select-none text-slate-300">chevron_right</span>
          <span className="text-slate-900">Checkout</span>
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">
          Checkout Pembayaran
        </h1>

        {submitError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex gap-3 items-center animate-shake">
            <span className="material-symbols-outlined text-red-500">warning</span>
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleCheckout} className="grid gap-8 md:grid-cols-12 items-start">
          {/* Left Panel: Checkout Form & Payment Gateway Selector */}
          <div className="md:col-span-7 space-y-6">
            {/* Customer Details Box */}
            <div className="island-shell rounded-[2rem] p-6 border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--line)]">
                <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">person</span>
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">
                    Informasi Pelanggan
                  </h2>
                  <p className="text-[10px] text-[var(--sea-ink-soft)] font-medium">Data akun terisi otomatis untuk pengiriman kredensial</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="block text-[10px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider mb-1.5">
                    Nama Akun
                  </span>
                  <div className="relative">
                    <span className="material-symbols-outlined text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none">person_outline</span>
                    <p className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-3 mb-0">
                      {user?.name}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-[10px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider mb-1.5">
                      Email Akun
                    </span>
                    <div className="relative">
                      <span className="material-symbols-outlined text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none">mail_outline</span>
                      <p className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-3 mb-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider mb-1.5">
                      No. WhatsApp
                    </span>
                    <div className="relative">
                      <span className="material-symbols-outlined text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none">chat</span>
                      <p className="text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-3 mb-0">
                        {user?.whatsapp}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="island-shell rounded-[2rem] p-6 border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--line)]">
                <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">payments</span>
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-950">
                    Metode Pembayaran
                  </h2>
                  <p className="text-[10px] text-[var(--sea-ink-soft)] font-medium">Proses pembayaran instan & otomatis yang aman</p>
                </div>
              </div>

              {/* Automatic Payment Card */}
              <div className="relative flex flex-col p-6 rounded-[1.5rem] border-2 border-slate-900 bg-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs font-bold">bolt</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">Pembayaran Otomatis</span>
                </div>
                <p className="text-[10px] text-[var(--sea-ink-soft)] leading-relaxed mb-4">
                  Sistem akan mengarahkan Anda ke gerbang pembayaran aman terbaik secara otomatis. Bayar menggunakan QRIS (GoPay, OVO, ShopeePay, LinkAja), Transfer Bank (Virtual Account), atau retail outlet resmi.
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-[8px] font-bold text-slate-700">QRIS</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-[8px] font-bold text-slate-700">E-WALLET</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-[8px] font-bold text-slate-700">VA TRANSFER</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-[8px] font-bold text-slate-700">RETAIL OUTLETS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Order Summary */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="island-shell rounded-[2rem] p-6 border border-[var(--line)] bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] flex flex-col gap-5">
              <h2 className="text-sm font-extrabold text-slate-950 pb-3 border-b border-[var(--line)]">
                Ringkasan Pesanan
              </h2>

              {/* Product Card Info */}
              <div className="flex gap-4 items-start bg-slate-50 border border-slate-100 rounded-2xl p-4">
                {product.imageUrl ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200/80 flex-shrink-0">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 text-orange-600">
                    <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                  </div>
                )}
                <div className="overflow-hidden">
                  <h3 className="text-xs font-extrabold text-slate-900 leading-snug truncate">
                    {product.name}
                  </h3>
                  <span className="text-[9px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider block mt-1">
                    Kategori: {product.category}
                  </span>
                  <span className="text-[9px] text-[var(--sea-ink-soft)] font-bold block">
                    Durasi: {product.durationMonths} Bulan
                  </span>
                </div>
              </div>

              {/* Billing breakdown */}
              <div className="space-y-3 pt-3 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Harga Berlangganan</span>
                  <span className="font-semibold text-slate-800">{formatIDR(product.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan & PPN</span>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Rp 0 (Gratis)</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-[var(--line)] text-sm font-black text-slate-950">
                  <span>Total Tagihan</span>
                  <span className="text-slate-900">{formatIDR(product.price)}</span>
                </div>
              </div>

              {/* Key Features Bullet List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm select-none">check_circle</span>
                  <span>Aktivasi Akun Cepat (5-10 Menit)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm select-none">check_circle</span>
                  <span>Notifikasi WhatsApp & Email Otomatis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-sm select-none">check_circle</span>
                  <span>Layanan Bergaransi Penuh 100%</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-95 text-white py-4 text-xs font-black shadow-md shadow-slate-900/10 hover:shadow-lg transition-all duration-300 disabled:opacity-50 cursor-pointer mt-2 border-0 select-none"
              >
                {isLoading ? 'Mengalihkan ke Gerbang Pembayaran...' : 'Bayar Sekarang'}
              </button>

              <p className="text-[9px] text-center text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto">
                Dengan mengeklik tombol di atas, Anda akan dialihkan ke halaman pembayaran eksternal resmi secara aman.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { getProductById } from '../utils/product.functions'
import { Route as RootRoute } from './__root'
import { 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Zap, 
  MessageSquareCode, 
  Headphones, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Flame 
} from 'lucide-react'

const searchSchema = z.object({
  from: z.string().optional(),
})

export const Route = createFileRoute('/products/$productId')({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async ({ params }) => {
    try {
      const res = await getProductById({ data: params.productId })
      return {
        product: res.success ? res.product : null,
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { product: null, error: err?.message || 'Gagal memuat produk' }
    }
  },
  component: ProductDetailPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function ProductDetailPage() {
  const { product, error } = Route.useLoaderData()
  const { user } = RootRoute.useRouteContext()
  const { from } = Route.useSearch()
  const navigate = useNavigate()

  if (error || !product) {
    return (
      <main className="page-wrap px-4 py-16 text-center">
        <div className="island-shell rounded-3xl p-8 max-w-md mx-auto border border-red-100 shadow-sm bg-white">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined">error</span>
          </div>
          <h2 className="text-lg font-bold text-red-600 mb-2">Terjadi Kesalahan</h2>
          <p className="text-xs text-[var(--sea-ink-soft)] mb-6">{error || 'Produk tidak ditemukan atau tidak tersedia.'}</p>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-xs font-bold text-white no-underline transition-all cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    )
  }

  const handleOrder = () => {
    if (!user) {
      navigate({ to: '/login' })
    } else {
      navigate({
        to: '/checkout',
        search: { productId: product.id },
      })
    }
  }

  return (
    <main className="page-wrap px-4 pb-20 pt-8 relative overflow-hidden">
      {/* Decorative Floating Lights */}
      <div className="pointer-events-none absolute left-1/4 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.08),transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.06),transparent_70%)] blur-3xl" />

      {/* Back button with micro-animation */}
      <div className="mb-6 relative z-10">
        <Link 
          to="/" 
          className="group inline-flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-black no-underline transition-all"
        >
          <div className="h-7 w-7 rounded-full bg-white border border-[var(--line)] flex items-center justify-center transition-transform group-hover:-translate-x-1 shadow-2xs">
            <ArrowLeft className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-900" />
          </div>
          Kembali ke Katalog
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start relative z-10">
        
        {/* LEFT COLUMN: Product Image Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="island-shell rounded-none p-3 border border-[var(--line)] bg-white shadow-2xs relative group overflow-hidden">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            {/* Image Wrapper with Scale Effect */}
            <div className="w-full h-88 rounded-none overflow-hidden bg-slate-50 border border-[var(--line)] relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                  <span className="material-symbols-outlined text-4xl text-slate-200">image</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase">No Image Available</span>
                </div>
              )}
              
              {/* Premium Tags on Image */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-white bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-none shadow-xs">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Premium Choice
                </span>
              </div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-[var(--line)] p-3 rounded-none flex flex-col items-center">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 mb-1" />
              <span className="text-[9px] font-extrabold text-slate-800">100% Garansi</span>
            </div>
            <div className="bg-slate-50 border border-[var(--line)] p-3 rounded-none flex flex-col items-center">
              <Zap className="h-4.5 w-4.5 text-indigo-500 mb-1" />
              <span className="text-[9px] font-extrabold text-slate-800">Aktivasi Cepat</span>
            </div>
            <div className="bg-slate-50 border border-[var(--line)] p-3 rounded-none flex flex-col items-center">
              <Lock className="h-4.5 w-4.5 text-slate-700 mb-1" />
              <span className="text-[9px] font-extrabold text-slate-800">Pembayaran Aman</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Details */}
        <div className="lg:col-span-7 island-shell rounded-none p-8 border border-[var(--line)] bg-white relative overflow-hidden shadow-2xs">
          
          {/* Radial Decorative Background Glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-none bg-[radial-gradient(circle,rgba(79,184,178,0.12),transparent_70%)]" />
          
          <div className="relative space-y-6">
            
            {/* Categories & Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase tracking-widest font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-none">
                {product.category}
              </span>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-none">
                Masa Aktif {product.durationMonths} Bulan
              </span>
              {product.stock <= 0 ? (
                <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-3.5 py-1.5 rounded-none flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-none bg-rose-500" />
                  Stok Habis
                </span>
              ) : product.stock < 5 ? (
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-250 px-3.5 py-1.5 rounded-none flex items-center gap-1 animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-none bg-amber-500 animate-ping" />
                  Hampir Habis (Sisa {product.stock} Slot)
                </span>
              ) : (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-none flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-none bg-emerald-500" />
                  Stok Tersedia ({product.stock} Slot)
                </span>
              )}
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {product.description}
              </p>
            </div>

            {/* Key Features Segment */}
            <div className="bg-slate-50 border border-[var(--line)] rounded-none p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-slate-800" />
                Fitur Utama Langganan
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">100% Legal & Premium</span>
                    <span className="text-[10px] text-slate-500">Akses resmi tanpa kendala.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-none bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Proses Sangat Cepat</span>
                    <span className="text-[10px] text-slate-500">Aktivasi instan maks 1x24 jam.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-none bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <MessageSquareCode className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Notifikasi Otomatis</span>
                    <span className="text-[10px] text-slate-500">Kredensial dikirim via WA & Email.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-none bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Headphones className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Support Full 24/7</span>
                    <span className="text-[10px] text-slate-500">Layanan bantuan pelanggan aktif.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Checkout Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-6 border-t border-[var(--line)]">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Total Biaya Langganan</span>
                {product.promo ? (
                  <div className="flex flex-col text-left">
                    <span className="line-through text-slate-400 text-xs font-bold leading-none mb-1">
                      {formatIDR(product.price)}
                    </span>
                    <strong className="text-3xl font-black text-rose-600 tracking-tight leading-none">
                      {formatIDR(product.promo.priceAfterPromo)}
                    </strong>
                    {product.promo.minDurationMonths > 1 && (
                      <span className="text-[9px] text-slate-400 font-bold mt-1">
                        * Khusus pembelian minimal {product.promo.minDurationMonths} bulan
                      </span>
                    )}
                  </div>
                ) : (
                  <strong className="text-3xl font-black text-slate-900 tracking-tight">
                    {formatIDR(product.price)}
                  </strong>
                )}
              </div>
              
              {user?.role === 'admin' && from === 'admin' ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="bg-slate-100 text-slate-700 border border-slate-200 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 rounded-none shadow-2xs">
                    <span className="material-symbols-outlined text-sm text-slate-500">visibility</span>
                    Mode Pratinjau Admin
                  </div>
                  <Link
                    to="/admin/products"
                    className="inline-flex items-center justify-center gap-2 rounded-none bg-slate-950 hover:bg-slate-900 text-white px-8 py-4 text-xs font-black shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer w-full sm:w-auto border border-slate-950 no-underline text-center"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali Ke Admin
                  </Link>
                </div>
              ) : (
                <button
                  disabled={product.stock <= 0}
                  onClick={handleOrder}
                  className={`group inline-flex items-center justify-center gap-2 rounded-none px-8 py-4 text-xs font-black transition-all duration-300 w-full sm:w-auto border ${
                    product.stock <= 0
                      ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed pointer-events-none'
                      : 'bg-slate-950 hover:bg-slate-900 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-slate-950'
                  }`}
                >
                  {product.stock <= 0 ? 'Stok Habis' : 'Order Sekarang'}
                  {product.stock > 0 && <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />}
                </button>
              )}
            </div>
            
          </div>
        </div>

      </div>
    </main>
  )
}

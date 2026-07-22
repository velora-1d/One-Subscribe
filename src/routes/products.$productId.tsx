import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getProductById } from '../utils/product.functions'
import { Route as RootRoute } from './__root'

export const Route = createFileRoute('/products/$productId')({
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
  const navigate = useNavigate()

  if (error || !product) {
    return (
      <main className="page-wrap px-4 py-16 text-center">
        <div className="island-shell rounded-3xl p-8 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-sm text-[var(--sea-ink-soft)] mb-6">{error || 'Produk tidak ditemukan.'}</p>
          <Link to="/" className="rounded-full bg-[var(--lagoon-deep)] px-6 py-2.5 text-xs font-bold text-white no-underline">
            Kembali ke Katalog
          </Link>
        </div>
      </main>
    )
  }

  const handleOrder = () => {
    if (!user) {
      // If not logged in, redirect to login page
      navigate({ to: '/login' })
    } else {
      // If logged in, redirect to checkout page
      navigate({
        to: '/checkout',
        search: { productId: product.id },
      })
    }
  }

  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--lagoon-deep)] hover:underline no-underline">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Katalog
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-12 items-start">
        {/* Product Image Panel */}
        <div className="md:col-span-5 island-shell rounded-[2rem] p-4 border border-[var(--line)]">
          <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-100 border border-[var(--line)]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Product Details Panel */}
        <div className="md:col-span-7 island-shell rounded-[2rem] p-8 border border-[var(--line)] relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--hero-a),transparent_66%)]" />
          
          <div className="relative">
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="text-xs uppercase tracking-wider font-extrabold text-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.1)] px-3 py-1.5 rounded-full">
                {product.category}
              </span>
              <span className="text-xs font-bold text-[var(--sea-ink-soft)] bg-[var(--chip-bg)] border border-[var(--chip-line)] px-3 py-1.5 rounded-full">
                Durasi {product.durationMonths} Bulan
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-[var(--sea-ink)] mb-4 leading-tight">
              {product.name}
            </h1>

            <p className="text-sm text-[var(--sea-ink-soft)] leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Features list (dummy details based on category for aesthetics) */}
            <div className="mb-8">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--sea-ink)] mb-3">
                Fitur Utama:
              </h3>
              <ul className="space-y-2 text-sm text-[var(--sea-ink-soft)]">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Akses premium penuh & legal
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Aktivasi cepat maksimal 1x24 jam
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Pengiriman kredensial langsung via WhatsApp & Email
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Support penuh dari tim pelayanan kami
                </li>
              </ul>
            </div>

            {/* Price Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-[var(--line)]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--sea-ink-soft)] block mb-1">Harga Langganan</span>
                <strong className="text-2xl font-black text-[var(--sea-ink)]">{formatIDR(product.price)}</strong>
              </div>
              <button
                onClick={handleOrder}
                className="rounded-full bg-[var(--lagoon-deep)] px-8 py-3.5 text-sm font-extrabold text-white shadow-md hover:opacity-95 transition cursor-pointer"
              >
                Order Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

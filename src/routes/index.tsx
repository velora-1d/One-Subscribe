import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getActiveProducts } from '../utils/product.functions'
import { MagnifyingGlass, SmileySad, Sparkle, ArrowRight, CheckCircle } from '@phosphor-icons/react'

export const Route = createFileRoute('/')({
  loader: async () => {
    try {
      const res = await getActiveProducts()
      return {
        products: res.success ? res.products : [],
      }
    } catch {
      return { products: [] }
    }
  },
  component: CatalogPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function CatalogPage() {
  const { products } = Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Extract unique categories from products list
  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))]

  // Filter products based on search query and category tab selection
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                          product.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      {/* Hero Banner Section (Asymmetric Split Screen - Compact Redesign) */}
      <section className="island-shell rise-in relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10 sm:py-10 mb-8">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,var(--hero-a),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,var(--hero-b),transparent_66%)]" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Column: Left-Aligned Text */}
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-[11px] font-bold text-blue-600 mb-3 shadow-2xs">
              <Sparkle size={13} weight="fill" />
              <span>Premium Subscription Hub</span>
            </div>
            <h1 className="display-title mb-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--sea-ink)] leading-tight">
              Akses Layanan Premium <br />
              <span className="text-blue-600">Tanpa Kartu Kredit.</span>
            </h1>
            <p className="mb-6 text-xs sm:text-sm text-[var(--sea-ink-soft)] max-w-lg leading-relaxed">
              Dapatkan akses cepat ke berbagai tools AI, akun streaming, design, server/VPS, dan lisensi premium lainnya. 
              Bayar dengan metode lokal (QRIS, Transfer), aktivasi instan via WhatsApp and Email!
            </p>
          </div>

          {/* Right Column: High-Fidelity Glass Floating Preview Cards */}
          <div className="hidden lg:flex lg:col-span-5 relative justify-center">
            <div className="relative w-full h-[200px] flex items-center justify-center">
              {/* Card 1 - AI Assistant Pro */}
              <div 
                className="absolute -top-2 left-6 w-44 rounded-2xl border border-white/80 bg-white/85 p-3.5 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.18)] backdrop-blur-xl animate-float transition-all hover:scale-105 cursor-pointer"
                style={{ '--rotation': '-5deg' } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Sparkle size={13} weight="fill" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800">AI Assistant Pro</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span>Status: Aktif</span>
                  <span className="font-bold text-emerald-600">1 Bulan</span>
                </div>
              </div>

              {/* Card 2 - Streaming 4K UHD */}
              <div 
                className="absolute bottom-1 right-6 w-48 rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.14)] backdrop-blur-xl animate-float z-10 transition-all hover:scale-105 cursor-pointer"
                style={{ '--rotation': '4deg', animationDelay: '1.8s' } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <CheckCircle size={13} weight="fill" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800">Streaming 4K UHD</span>
                  </div>
                  <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200/50">Ready</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span className="font-mono font-bold text-slate-900">Rp 35.000</span>
                  <span className="text-slate-400">Instan Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar Section */}
      <section className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-5 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-extrabold'
                  : 'bg-[var(--chip-bg)] border border-[var(--chip-line)] text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari layanan premium..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-[var(--line)] bg-[var(--header-bg)] pl-10 pr-4 py-2.5 text-xs text-[var(--sea-ink)] shadow-2xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-3 text-[var(--sea-ink-soft)]"
            weight="bold"
          />
        </div>
      </section>      {/* Product Grid List (Redesigned to be 15% larger with 4-5 columns & 1:1 square aspect ratio images) */}
      {filteredProducts.length > 0 ? (
        <section className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product, index) => (
            <Link
              key={product.id}
              to="/products/$productId"
              params={{ productId: product.id }}
              className="island-shell feature-card rise-in rounded-2xl p-4 flex flex-col justify-between border border-[var(--line)] hover:shadow-lg transition duration-300 relative overflow-hidden no-underline text-left group cursor-pointer"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                {/* Image Section with Overlays (Forced 1:1 Aspect Ratio) */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-50 border border-[var(--line)] flex items-center justify-center shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <span className="material-symbols-outlined text-3xl">inventory_2</span>
                    </div>
                  )}
                  {/* Category overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <span className="bg-white/95 text-slate-700 border border-slate-200/80 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      {product.category}
                    </span>
                    {product.promo && (
                      <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs border-0">
                        Diskon {product.promo.discountType === 'percentage' ? `${product.promo.discountValue}%` : 'Hemat'}
                      </span>
                    )}
                  </div>
                  {/* Duration overlay */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-slate-900/90 text-white border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      {product.durationMonths} Bulan
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[var(--sea-ink)] mb-1 line-clamp-1 group-hover:text-blue-600 transition" title={product.name}>
                  {product.name}
                </h3>
                <div className="flex items-center gap-1.5 mb-2">
                  {product.stock <= 0 ? (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Stok Habis
                    </span>
                  ) : product.stock < 5 ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-250 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                      Tinggal {product.stock} Slot
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-250 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Ready {product.stock} Slot
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--sea-ink-soft)] leading-relaxed mb-4 line-clamp-2 min-h-[2rem]">
                  {product.description}
                </p>
              </div>

              {/* Price and Action Button */}
              <div className="pt-2.5 border-t border-[var(--line)] flex items-center justify-between mt-auto">
                <div>
                  <span className="block text-[9px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider">Harga</span>
                  {product.promo ? (
                    <div className="flex flex-col text-left">
                      <span className="line-through text-slate-400 text-[10px] font-bold leading-none">
                        {formatIDR(product.price)}
                      </span>
                      <strong className="text-xs font-extrabold text-rose-600 leading-tight">
                        {formatIDR(product.promo.priceAfterPromo)}
                      </strong>
                    </div>
                  ) : (
                    <strong className="text-xs font-extrabold text-[var(--sea-ink)]">{formatIDR(product.price)}</strong>
                  )}
                </div>
                <div
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 group-hover:bg-blue-600 px-3 py-1.5 text-[10px] font-extrabold text-white shadow-xs transition-colors duration-200"
                >
                  <span>Detail</span>
                  <ArrowRight size={10} weight="bold" />
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="text-center py-16 island-shell rounded-3xl">
          <SmileySad
            size={48}
            className="mx-auto text-[var(--sea-ink-soft)] mb-4"
            weight="light"
          />
          <h3 className="text-lg font-bold text-[var(--sea-ink)] mb-1">Layanan Tidak Ditemukan</h3>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Kami tidak dapat menemukan layanan premium yang cocok dengan pencarian Anda.
          </p>
        </section>
      )}
    </main>
  )
}

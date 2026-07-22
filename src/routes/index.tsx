import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { getActiveProducts } from '../utils/product.functions'
import { MagnifyingGlass, SmileySad, Sparkle, ArrowRight } from '@phosphor-icons/react'

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
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-bold text-[var(--lagoon)] mb-3">
              <Sparkle size={12} weight="fill" />
              <span>Premium Subscription Hub</span>
            </div>
            <h1 className="display-title mb-4 text-2xl sm:text-4xl font-extrabold tracking-tight text-[var(--sea-ink)] leading-tight">
              Akses Layanan Premium <br />
              <span className="text-[var(--lagoon)]">Tanpa Kartu Kredit.</span>
            </h1>
            <p className="mb-6 text-xs sm:text-sm text-[var(--sea-ink-soft)] max-w-lg leading-relaxed">
              Dapatkan akses cepat ke berbagai tools AI, akun streaming, design, server/VPS, dan lisensi premium lainnya. 
              Bayar dengan metode lokal (QRIS, Transfer), aktivasi instan via WhatsApp and Email!
            </p>
          </div>

          {/* Right Column: Asymmetric Liquid Glass Floating Preview */}
          <div className="hidden lg:flex lg:col-span-5 relative justify-center">
            <div className="relative w-full h-[180px] flex items-center justify-center">
              {/* Card 1 */}
              <div 
                className="absolute top-0 left-12 w-32 rounded-xl border border-white/10 bg-white/5 p-3 shadow-[0_16px_32px_rgba(0,0,0,0.25)] backdrop-blur-md animate-float"
                style={{ '--rotation': '-6deg' } as React.CSSProperties}
              >
                <div className="h-1.5 w-8 rounded-full bg-[var(--lagoon)] mb-2" />
                <div className="h-2 w-16 rounded bg-white/20 mb-3" />
                <div className="h-4 w-full rounded bg-white/10" />
              </div>
              {/* Card 2 */}
              <div 
                className="absolute bottom-0 right-12 w-36 rounded-xl border border-white/15 bg-white/10 p-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-lg animate-float z-10"
                style={{ '--rotation': '4deg', animationDelay: '1.5s' } as React.CSSProperties}
              >
                <div className="h-1.5 w-6 rounded-full bg-[var(--palm)] mb-2" />
                <div className="h-2 w-20 rounded bg-white/25 mb-3" />
                <div className="h-4 w-10 rounded bg-white/15" />
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
                  ? 'bg-[var(--lagoon-deep)] text-white shadow-sm font-extrabold'
                  : 'bg-[var(--chip-bg)] border border-[var(--chip-line)] text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]'
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
            className="w-full rounded-full border border-[var(--line)] bg-[var(--header-bg)] pl-10 pr-4 py-2.5 text-xs text-[var(--sea-ink)] shadow-sm outline-none focus:border-[var(--lagoon)] transition"
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
            <article
              key={product.id}
              className="island-shell feature-card rise-in rounded-2xl p-4 flex flex-col justify-between border border-[var(--line)] hover:shadow-lg transition duration-300 relative overflow-hidden"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                {/* Image Section with Overlays (Forced 1:1 Aspect Ratio) */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-50 border border-[var(--line)] flex items-center justify-center shrink-0">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <span className="material-symbols-outlined text-3xl">inventory_2</span>
                    </div>
                  )}
                  {/* Category overlay */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/95 backdrop-blur-sm text-slate-700 border border-slate-200/60 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      {product.category}
                    </span>
                  </div>
                  {/* Duration overlay */}
                  <div className="absolute top-2 right-2">
                    <span className="bg-slate-900/90 backdrop-blur-sm text-white border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      {product.durationMonths} Bulan
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-[var(--sea-ink)] mb-1 line-clamp-1" title={product.name}>
                  {product.name}
                </h3>
                <p className="text-[11px] text-[var(--sea-ink-soft)] leading-relaxed mb-4 line-clamp-2 min-h-[2rem]">
                  {product.description}
                </p>
              </div>

              {/* Price and Action Button */}
              <div className="pt-2.5 border-t border-[var(--line)] flex items-center justify-between mt-auto">
                <div>
                  <span className="block text-[9px] text-[var(--sea-ink-soft)] font-bold uppercase tracking-wider">Harga</span>
                  <strong className="text-xs font-extrabold text-[var(--sea-ink)]">{formatIDR(product.price)}</strong>
                </div>
                <Link
                  to="/products/$productId"
                  params={{ productId: product.id }}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-extrabold text-white shadow-sm hover:scale-95 transition-all no-underline"
                >
                  <span>Detail</span>
                  <ArrowRight size={10} weight="bold" />
                </Link>
              </div>
            </article>
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

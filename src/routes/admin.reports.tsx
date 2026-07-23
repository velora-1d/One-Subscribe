import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminReports, getAdminCategories } from '../utils/admin.functions'
import { PageTableSkeleton } from '../components/ui/skeletons'

export const Route = createFileRoute('/admin/reports')({
  ssr: false,
  loader: async () => {
    try {
      const [reportsRes, categoriesRes] = await Promise.all([
        getAdminReports(),
        getAdminCategories()
      ])
      return {
        orders: reportsRes.success ? reportsRes.orders : [],
        categories: categoriesRes.success ? categoriesRes.categories : [],
        error: reportsRes.success ? null : reportsRes.error,
      }
    } catch (err: any) {
      return { orders: [], categories: [], error: err?.message || 'Gagal memuat data laporan' }
    }
  },
  pendingComponent: PageTableSkeleton,
  component: AdminReportsPage,
})

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AdminReportsPage() {
  const { orders, categories, error } = Route.useLoaderData()

  // Filter States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('semua')
  const [categoryFilter, setCategoryFilter] = useState<string>('semua')
  const [methodFilter, setMethodFilter] = useState<string>('semua')
  const [dateRange, setDateRange] = useState<string>('semua')
  const [yearFilter, setYearFilter] = useState<string>('semua')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-600 text-sm font-semibold">
        Error loading reports: {error}
      </div>
    )
  }

  // Get unique categories from both categories table and orders to be 100% resilient
  const categoriesList = Array.from(new Set([
    ...(categories || []).map((c: any) => c.name),
    ...(orders || []).map((o: any) => o.productCategory)
  ].filter(Boolean)))

  // Get unique years dynamically from orders
  const yearsList = Array.from(new Set((orders || []).map((o: any) => new Date(o.createdAt).getFullYear()))).sort((a, b) => b - a)

  // Apply filters
  const filteredOrders = orders.filter((order: any) => {
    // 1. Search Query
    const matchesSearch = 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName && order.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(search.toLowerCase())) ||
      (order.productName && order.productName.toLowerCase().includes(search.toLowerCase()))

    // 2. Status
    const matchesStatus = statusFilter === 'semua' || order.status === statusFilter

    // 3. Category
    const matchesCategory = categoryFilter === 'semua' || order.productCategory === categoryFilter

    // 4. Payment Method
    const matchesMethod = methodFilter === 'semua' || order.paymentMethod === methodFilter

    // 5. Date Range
    let matchesDate = true
    if (dateRange !== 'semua') {
      const orderDate = new Date(order.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - orderDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (dateRange === 'hari-ini') {
        matchesDate = orderDate.toDateString() === now.toDateString()
      } else if (dateRange === '7-hari') {
        matchesDate = diffDays <= 7
      } else if (dateRange === '30-hari') {
        matchesDate = diffDays <= 30
      }
    }

    // 6. Year Filter
    let matchesYear = true
    if (yearFilter !== 'semua') {
      const orderYear = new Date(order.createdAt).getFullYear()
      const nowYear = new Date().getFullYear()

      if (yearFilter === 'tahun-ini') {
        matchesYear = orderYear === nowYear
      } else {
        matchesYear = orderYear === parseInt(yearFilter, 10)
      }
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesMethod && matchesDate && matchesYear
  })


  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedOrders = filteredOrders.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage)

  // Calculate Aggregated Metrics on filtered data
  const totalRevenue = filteredOrders
    .filter((o: any) => ['aktif', 'expired', 'menunggu_aktivasi'].includes(o.status))
    .reduce((sum: number, o: any) => sum + o.price, 0)

  const activeSubscriptionsCount = filteredOrders.filter((o: any) => o.status === 'aktif').length
  const totalTransactionsCount = filteredOrders.length

  const avgTransactionValue = totalTransactionsCount > 0 
    ? Math.round(totalRevenue / totalTransactionsCount) 
    : 0

  // 1. Top products breakdown
  const productSalesMap: Record<string, { qty: number; revenue: number }> = {}
  filteredOrders.forEach((o: any) => {
    if (!productSalesMap[o.productName]) {
      productSalesMap[o.productName] = { qty: 0, revenue: 0 }
    }
    productSalesMap[o.productName].qty += 1
    if (['aktif', 'expired', 'menunggu_aktivasi'].includes(o.status)) {
      productSalesMap[o.productName].revenue += o.price
    }
  })
  const topProducts = Object.entries(productSalesMap)
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // 2. Category distribution
  const categorySalesMap: Record<string, number> = {}
  filteredOrders.forEach((o: any) => {
    if (['aktif', 'expired', 'menunggu_aktivasi'].includes(o.status)) {
      const cat = o.productCategory || 'Lainnya'
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + o.price
    }
  })
  const categoryChartData = Object.entries(categorySalesMap).map(([name, revenue]) => ({ name, revenue }))
  const totalCategoryRevenue = categoryChartData.reduce((sum, c) => sum + c.revenue, 0)

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Customer Whatsapp', 'Product', 'Category', 'Price', 'Status', 'Payment Method', 'Created At']
    const rows = filteredOrders.map((o: any) => [
      `"${o.id}"`,
      `"${o.customerName || ''}"`,
      `"${o.customerEmail || ''}"`,
      `"${o.customerWhatsapp || ''}"`,
      `"${o.productName}"`,
      `"${o.productCategory || ''}"`,
      o.price,
      `"${o.status}"`,
      `"${o.paymentMethod}"`,
      `"${new Date(o.createdAt).toISOString()}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `laporan_onesubscribe_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper status styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
            Unpaid
          </span>
        )
      case 'menunggu_aktivasi':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
            Pending
          </span>
        )
      case 'aktif':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            Active
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-655">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 font-sans text-left print:bg-white print:p-8">
      {/* Title Panel */}
      <header className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-lg shadow-slate-100/30 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md shrink-0 print:hidden">
            <span className="material-symbols-outlined text-[24px]">bar_chart</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">Laporan & Analisis Data</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Analisis keuangan, performa katalog produk, serta data transaksi terperinci.</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 print:hidden">
          <button
            onClick={handleExportCSV}
            className="rounded-lg border border-slate-200/80 bg-white/80 backdrop-blur-xs px-4 py-2 text-xs font-bold text-slate-700 hover:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white border border-slate-950 hover:scale-95 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
          >
            <span className="material-symbols-outlined text-[18px]">print</span> Cetak Laporan
          </button>
        </div>
      </header>

      {/* Interactive Filters Panel */}
      <section className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-lg shadow-slate-100/20 space-y-4 print:hidden">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Laporan</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-6">
          {/* Rentang Waktu */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rentang Waktu</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-900 transition font-medium cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Waktu</option>
              <option value="hari-ini">Hari Ini</option>
              <option value="7-hari">7 Hari Terakhir</option>
              <option value="30-hari">30 Hari Terakhir</option>
            </select>
          </div>

          {/* Filter Tahun */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tahun</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-900 transition font-medium cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Tahun</option>
              <option value="tahun-ini">Tahun Ini ({new Date().getFullYear()})</option>
              {yearsList.map((yr: number) => (
                <option key={yr} value={String(yr)}>Tahun {yr}</option>
              ))}
            </select>
          </div>

          {/* Status Pesanan */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status Pesanan</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-900 transition font-medium cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu_pembayaran">Menunggu Pembayaran (Unpaid)</option>
              <option value="menunggu_aktivasi">Menunggu Aktivasi (Pending)</option>
              <option value="aktif">Aktif (Active)</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Kategori Layanan */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori Produk</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-900 transition font-medium cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Kategori</option>
              {categoriesList.map((cat: any) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Metode Pembayaran */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Metode Pembayaran</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-900 transition font-medium cursor-pointer shadow-2xs"
            >
              <option value="semua">Semua Metode</option>
              <option value="midtrans">Gateway Midtrans</option>
              <option value="pakasir">Gateway Pakasir</option>
            </select>
          </div>

          {/* Pencarian Kata Kunci */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cari Kata Kunci</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Order ID / Pelanggan / Produk..."
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-900 transition shadow-2xs font-medium"
            />
          </div>
        </div>
      </section>

      {/* Highlight Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Omzet */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-slate-100/20 group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[18px] font-bold">payments</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Total Omzet</p>
            <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">{formatIDR(totalRevenue)}</h3>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-slate-100/20 group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[18px] font-bold">shopping_cart</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Total Transaksi</p>
            <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">{totalTransactionsCount} Invoice</h3>
          </div>
        </div>

        {/* Nilai Transaksi Rata-Rata */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-slate-100/20 group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-violet-500/10 text-violet-600 rounded-xl flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[18px] font-bold">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Rata-rata Transaksi</p>
            <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">{formatIDR(avgTransactionValue)}</h3>
          </div>
        </div>

        {/* Langganan Aktif */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-slate-100/20 group">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-teal-500/10 text-teal-600 rounded-xl flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[18px] font-bold">card_membership</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Langganan Aktif</p>
            <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">{activeSubscriptionsCount} Pelanggan</h3>
          </div>
        </div>
      </section>

      {/* Visual Analytics Block */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-lg shadow-slate-100/20 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Produk Terlaris (Top 5)</h3>
            {topProducts.length > 0 ? (
              <div className="space-y-4 mt-4">
                {topProducts.map((p: any, idx: number) => {
                  const maxRevenue = topProducts[0]?.revenue || 1
                  const percentage = Math.round((p.revenue / maxRevenue) * 100)
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-extrabold text-slate-800">
                        <span>{idx + 1}. {p.name} <span className="text-[10px] text-slate-400 font-bold">({p.qty}x Terjual)</span></span>
                        <span>{formatIDR(p.revenue)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-slate-900 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm italic text-slate-400 py-6 text-center">Tidak ada data produk terlaris.</p>
            )}
          </div>
        </div>

        {/* Category Contribution */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-lg shadow-slate-100/20 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Kontribusi Pendapatan Kategori</h3>
            {categoryChartData.length > 0 ? (
              <div className="space-y-4 mt-4">
                {categoryChartData.map((c: any) => {
                  const pct = totalCategoryRevenue > 0 ? Math.round((c.revenue / totalCategoryRevenue) * 100) : 0
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-extrabold text-slate-805">
                        <span>{c.name} <span className="text-[10px] text-slate-400 font-bold">({pct}%)</span></span>
                        <span>{formatIDR(c.revenue)}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm italic text-slate-400 py-6 text-center">Tidak ada data kontribusi kategori.</p>
            )}
          </div>
        </div>
      </section>

      {/* Detailed Orders Table */}
      <section className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col shadow-xl shadow-slate-100/40">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/40 print:bg-white print:border-none">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Detail Transaksi Laporan</h2>
          <span className="text-xs text-slate-500 font-bold font-sans print:text-black">
            Total {filteredOrders.length} baris data ditemukan
          </span>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/20 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 print:bg-slate-100">
                  <th className="pl-6 pr-2 py-4 w-16 text-left whitespace-nowrap">No</th>
                  <th className="px-6 py-4">ID / Tanggal</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Produk / Kategori</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Metode</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-750 divide-y divide-slate-100">
                {paginatedOrders.map((order: any, index: number) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="pl-6 pr-2 py-4 text-left font-bold text-slate-400 w-16 whitespace-nowrap">{((activePage - 1) * itemsPerPage) + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900">#{order.id}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{formatDate(order.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900">{order.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{order.customerEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800">{order.productName}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold">{order.productCategory || '-'}</span>
                            {order.parentOrderId && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-50 border border-indigo-150 text-indigo-600 uppercase tracking-wide">
                                Perpanjangan
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {formatIDR(order.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredOrders.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-500 text-[11px] font-semibold text-left print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    Menampilkan {((activePage - 1) * itemsPerPage) + 1} - {Math.min(activePage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} entri
                  </span>
                  <div className="flex items-center gap-1.5 ml-0 sm:ml-2 border-l border-slate-200 pl-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tampilkan:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="rounded-lg border border-slate-250 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 focus:border-slate-900 outline-none transition cursor-pointer font-sans"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={40}>40</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7.5 h-7.5 rounded-lg text-center cursor-pointer transition ${
                            activePage === pageNum
                              ? 'bg-slate-900 border border-slate-900 text-white font-extrabold shadow-sm'
                              : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-bold'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl p-8 max-w-sm mx-auto shadow-xs flex flex-col items-center mt-6">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">Laporan Kosong</h3>
            <p className="text-[11px] text-slate-400 font-semibold max-w-[240px] text-center leading-relaxed">
              Tidak ada data transaksi laporan yang cocok dengan parameter filter pencarian Anda.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

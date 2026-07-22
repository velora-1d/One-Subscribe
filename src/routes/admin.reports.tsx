import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { getFinanceReport } from '../utils/admin.functions'

export const Route = createFileRoute('/admin/reports')({
  loader: async () => {
    try {
      const res = await getFinanceReport()
      return {
        report: res.success ? res.report : [],
        error: res.success ? null : res.error,
      }
    } catch (err: any) {
      return { report: [], error: err?.message || 'Gagal memuat laporan keuangan' }
    }
  },
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

function AdminReportsPage() {
  const { report, error } = Route.useLoaderData()
  const [filterMonth, setFilterMonth] = useState('all')

  // Filter report entries based on selected month (simple local mock filter)
  const filteredReport = report.filter((item) => {
    if (filterMonth === 'all') return true
    const itemMonth = new Date(item.createdAt).getMonth() + 1
    return itemMonth.toString() === filterMonth
  })

  // Calculate sum of total revenue
  const totalRevenue = filteredReport.reduce((sum, item) => sum + item.price, 0)

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredReport.length === 0) return

    const headers = ['ID Pesanan', 'Pelanggan', 'Produk', 'Metode Bayar', 'Status', 'Harga (IDR)', 'Tanggal']
    const rows = filteredReport.map((item) => [
      item.id,
      item.customerName,
      item.productName,
      item.paymentMethod.toUpperCase(),
      item.status.toUpperCase(),
      item.price.toString(),
      new Date(item.createdAt).toLocaleDateString('id-ID'),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `laporan_keuangan_onesubscribe_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--sea-ink)]">
            Laporan Pendapatan & Keuangan
          </h1>
          <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
            Pantau total pendapatan dari langganan aktif, filter berdasarkan periode, dan unduh laporan CSV.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredReport.length === 0}
          className="rounded-full bg-[var(--lagoon-deep)] px-6 py-3 text-xs font-bold text-white shadow-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
        >
          Export CSV Laporan
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Filter and Overview Cards */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Monthly Filter Panel */}
        <div className="md:col-span-4 island-shell border border-[var(--line)] rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--sea-ink)]">
            Filter Laporan
          </h3>
          <div>
            <label className="block text-[10px] font-bold text-[var(--sea-ink-soft)] uppercase tracking-wider mb-2">
              Periode Bulan
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-xs text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon-deep)] transition"
            >
              <option value="all">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          <div className="pt-4 border-t border-[var(--line)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--sea-ink-soft)] block mb-1">
              Pendapatan Terfilter
            </span>
            <strong className="text-xl font-black text-emerald-600">
              {formatIDR(totalRevenue)}
            </strong>
          </div>
        </div>

        {/* Detailed Transactions List */}
        <div className="md:col-span-8 island-shell border border-[var(--line)] rounded-3xl p-0 overflow-hidden bg-[var(--header-bg)]">
          <div className="px-6 py-4 border-b border-[var(--line)]">
            <h3 className="text-sm font-extrabold text-[var(--sea-ink)]">
              Transaksi Terpilih ({filteredReport.length} Baris)
            </h3>
          </div>

          {filteredReport.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--chip-bg)] border-b border-[var(--line)] font-bold text-[var(--sea-ink)]">
                    <th className="px-6 py-3">ID & Tanggal</th>
                    <th className="px-6 py-3">Pelanggan</th>
                    <th className="px-6 py-3">Layanan</th>
                    <th className="px-6 py-3">Metode</th>
                    <th className="px-6 py-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--sea-ink-soft)]">
                  {filteredReport.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--link-bg-hover)] transition">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <strong className="block text-[var(--sea-ink)]">{item.id}</strong>
                        <span>{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-bold text-[var(--sea-ink)]">
                        {item.customerName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {item.productName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap uppercase font-bold text-[var(--sea-ink-soft)]">
                        {item.paymentMethod}
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap font-bold text-[var(--sea-ink)]">
                        {formatIDR(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-xs italic text-[var(--sea-ink-soft)]">
              Tidak ada data transaksi untuk filter bulan ini.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

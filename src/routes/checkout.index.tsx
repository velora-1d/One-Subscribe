import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getProductById } from '../utils/product.functions'
import { createOrder } from '../utils/order.functions'
import { validateVoucher } from '../utils/promo.functions'
import { Route as RootRoute } from './__root'

export const Route = createFileRoute('/checkout/')({
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

  // Duration & Voucher states
  const [chosenDuration, setChosenDuration] = useState(product.durationMonths)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(
    product.promo && product.durationMonths >= (product.promo.minDurationMonths || 1)
      ? product.promo
      : null
  )
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false)
  const [customerInput, setCustomerInput] = useState(
    product.fulfillmentType === 'email_invite' ? (user?.email || '') : ''
  )

  // Monthly base price calculated from the product
  const baseMonthlyPrice = Math.round(product.price / product.durationMonths)
  const basePrice = baseMonthlyPrice * chosenDuration

  let discountAmount = 0
  if (appliedVoucher) {
    if (appliedVoucher.discountType === 'percentage') {
      discountAmount = Math.round(basePrice * (appliedVoucher.discountValue / 100))
      if (appliedVoucher.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, appliedVoucher.maxDiscountAmount)
      }
    } else {
      discountAmount = appliedVoucher.discountValue
    }
  }

  const finalPrice = Math.max(0, basePrice - discountAmount)

  const handleDurationChange = (newVal: number) => {
    const value = Math.max(product.durationMonths, newVal)
    setChosenDuration(value)

    if (appliedVoucher) {
      if (appliedVoucher.minDurationMonths && value < appliedVoucher.minDurationMonths) {
        setAppliedVoucher(null)
        setVoucherError(`Promo/Kupon tidak berlaku karena durasi di bawah minimal (${appliedVoucher.minDurationMonths} Bulan).`)
      }
    } else if (product.promo && value >= (product.promo.minDurationMonths || 1)) {
      setAppliedVoucher(product.promo)
      setVoucherError(null)
    }
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return
    setIsValidatingVoucher(true)
    setVoucherError(null)
    try {
      const res = await validateVoucher({
        data: {
          code: voucherCode.trim().toUpperCase(),
          productId: product.id,
          durationMonths: chosenDuration,
        }
      })

      if (res.success && res.promo) {
        setAppliedVoucher(res.promo)
        setVoucherError(null)
      } else {
        setVoucherError(res.error || 'Voucher tidak valid.')
        setAppliedVoucher(null)
      }
    } catch (err: any) {
      setVoucherError(err.message || 'Terjadi kesalahan sistem.')
      setAppliedVoucher(null)
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setVoucherCode('')
    setVoucherError(null)
    if (product.promo && chosenDuration >= (product.promo.minDurationMonths || 1)) {
      setAppliedVoucher(product.promo)
    } else {
      setAppliedVoucher(null)
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitError(null)

    if ((product.fulfillmentType === 'email_invite' || product.fulfillmentType === 'topup_service') && !customerInput.trim()) {
      setSubmitError(
        product.fulfillmentType === 'email_invite'
          ? 'Mohon masukkan Email Target Undangan yang ingin di-invite.'
          : 'Mohon masukkan User ID / Target Top-Up Anda.'
      )
      setIsLoading(false)
      return
    }

    try {
      const result = await createOrder({
        data: {
          productId: product.id,
          durationMonths: chosenDuration,
          appliedPromoId: appliedVoucher?.id || undefined,
          customerInput: customerInput.trim() || undefined,
        },
      })

      if (result?.success && result.order?.id) {
        // Arahkan ke halaman pembayaran internal
        navigate({
          to: '/checkout/pay',
          search: { orderId: result.order.id },
        })
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
    <main className="page-wrap px-4 py-6 min-h-[85vh] bg-slate-50 relative">
      <div className="max-w-4xl mx-auto">
        {/* Header & Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Link to="/" className="hover:text-slate-900 transition no-underline">Katalog</Link>
            <span className="material-symbols-outlined text-[10px] select-none text-slate-300">chevron_right</span>
            <span className="text-slate-900">Checkout</span>
          </div>
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Katalog
          </Link>
        </div>

        <h1 className="text-xl font-black text-slate-900 mb-4 tracking-tight">
          Checkout Pembayaran
        </h1>

        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex gap-2 items-center">
            <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleCheckout} className="grid gap-5 md:grid-cols-12 items-start">
          {/* Left Panel: Customer Info & Payment */}
          <div className="md:col-span-7 space-y-4">
            {/* Customer Details Box */}
            <div className="bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="material-symbols-outlined text-base text-slate-700">person</span>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Informasi Pelanggan
                </h2>
              </div>

              <div className="grid gap-3 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Nama Akun
                  </span>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 font-semibold text-slate-900">
                    {user?.name}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Email Akun (Login)
                    </span>
                    <div className="p-2.5 bg-slate-100 border border-slate-200 font-semibold text-slate-900 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      No. WhatsApp
                    </span>
                    <div className="p-2.5 bg-slate-100 border border-slate-200 font-semibold text-slate-900">
                      {user?.whatsapp}
                    </div>
                  </div>
                </div>

                {/* Mandatory Target Email / User ID Field for email_invite or topup_service */}
                {(product.fulfillmentType === 'email_invite' || product.fulfillmentType === 'topup_service') && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-black text-blue-900 uppercase tracking-wider">
                        {product.fulfillmentType === 'email_invite' ? 'Email Target Undangan (Family/Team Join)' : 'User ID / Data Target Topup'}
                      </label>
                      <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 uppercase">Wajib Diisi</span>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">
                        {product.fulfillmentType === 'email_invite' ? 'alternate_email' : 'badge'}
                      </span>
                      <input
                        type="text"
                        required
                        value={customerInput}
                        onChange={(e) => setCustomerInput(e.target.value)}
                        placeholder={
                          product.fulfillmentType === 'email_invite'
                            ? 'Masukkan email target yang ingin di-invite'
                            : 'Masukkan User ID / Server ID target'
                        }
                        className="w-full border-2 border-blue-600 bg-blue-50/50 p-2.5 pl-9 text-xs font-bold text-slate-900 outline-none focus:border-blue-700 focus:bg-white transition"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {product.fulfillmentType === 'email_invite'
                        ? 'Email ini yang akan di-invite oleh admin ke akun/family plan premium.'
                        : 'Admin akan mengisikan kredit/topup ke ID target di atas.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="material-symbols-outlined text-base text-slate-700">payments</span>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Metode Pembayaran
                </h2>
              </div>

              {/* Automatic Payment Card */}
              <div className="p-3 border border-slate-900 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm font-bold text-emerald-600">bolt</span>
                  <span className="text-xs font-black text-slate-900">Pembayaran Otomatis (QRIS, VA, E-Wallet)</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-normal">
                  Sistem akan mengarahkan Anda ke gerbang pembayaran aman resmi secara otomatis. Bayar via QRIS (GoPay, OVO, ShopeePay), VA Bank, atau Retail Outlet.
                </p>
                <div className="flex gap-1 flex-wrap pt-1">
                  <span className="px-1.5 py-0.5 bg-slate-200 text-[8px] font-bold text-slate-700">QRIS</span>
                  <span className="px-1.5 py-0.5 bg-slate-200 text-[8px] font-bold text-slate-700">E-WALLET</span>
                  <span className="px-1.5 py-0.5 bg-slate-200 text-[8px] font-bold text-slate-700">VA TRANSFER</span>
                  <span className="px-1.5 py-0.5 bg-slate-200 text-[8px] font-bold text-slate-700">RETAIL OUTLETS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Order Summary */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100">
                Ringkasan Pesanan
              </h2>

              {/* Product Card Info */}
              <div className="flex gap-3 items-center bg-slate-50 border border-slate-200 p-2.5">
                {product.imageUrl ? (
                  <div className="w-10 h-10 overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-0.5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 text-orange-600">
                    <span className="material-symbols-outlined text-lg">workspace_premium</span>
                  </div>
                )}
                <div className="overflow-hidden text-xs">
                  <h3 className="font-extrabold text-slate-900 truncate">
                    {product.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Kategori: {product.category}
                  </span>
                </div>
              </div>

              {/* Duration Selector */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">
                    Durasi Langganan
                  </span>
                  <span className="font-black text-slate-900">
                    {chosenDuration} Bulan <span className="text-[9px] font-normal text-slate-400">(Min: {product.durationMonths} Bulan)</span>
                  </span>
                </div>
                <div className="flex items-center border border-slate-300 bg-white">
                  <button
                    type="button"
                    disabled={chosenDuration <= product.durationMonths}
                    onClick={() => handleDurationChange(chosenDuration - 1)}
                    className="h-7 w-7 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer border-r border-slate-300 select-none"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-slate-900 w-7 text-center select-none">
                    {chosenDuration}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDurationChange(chosenDuration + 1)}
                    className="h-7 w-7 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer border-l border-slate-300 select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Promo / Voucher Form */}
              <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">
                  Kode Voucer / Promo
                </span>
                
                {/* Active Voucher or Auto Catalog Promo Banner */}
                {appliedVoucher && appliedVoucher.code ? (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-indigo-600 text-sm">local_offer</span>
                      <div>
                        <span className="text-[9px] text-indigo-500 font-bold block">Voucer Terpasang:</span>
                        <code className="font-black text-indigo-700 text-xs uppercase">{appliedVoucher.code}</code>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-[10px] font-bold text-red-600 hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : appliedVoucher ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-sm">bolt</span>
                      <div>
                        <span className="font-bold text-xs text-blue-900 block">Diskon Otomatis Katalog</span>
                        <span className="text-[9px] text-blue-600 font-medium block">Hemat {formatIDR(discountAmount)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Voucher Input Field */}
                {(!appliedVoucher || !appliedVoucher.code) && (
                  <div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder={appliedVoucher ? "PUNYA KODE VOUCER LAIN?" : "MASUKKAN KODE VOUCER"}
                        className="flex-1 border border-slate-300 bg-white p-2 text-xs font-bold uppercase outline-none focus:border-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={isValidatingVoucher || !voucherCode.trim()}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3 text-xs font-bold border-0 cursor-pointer disabled:opacity-50"
                      >
                        {isValidatingVoucher ? '...' : 'Gunakan'}
                      </button>
                    </div>
                    {voucherError && (
                      <p className="text-[10px] text-red-600 font-semibold mt-1">
                        ⚠️ {voucherError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Billing breakdown */}
              <div className="space-y-1.5 pt-2 text-xs text-slate-600 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Harga ({chosenDuration} Bulan)</span>
                  <span className="font-semibold text-slate-900">{formatIDR(basePrice)}</span>
                </div>

                {appliedVoucher && (
                  <div className="flex justify-between text-indigo-700 font-bold bg-indigo-50 p-1.5 border border-indigo-100">
                    <span className="flex items-center gap-1 text-[10px]">
                      <span className="material-symbols-outlined text-xs">local_offer</span>
                      {appliedVoucher.code ? `Voucher (${appliedVoucher.code})` : 'Diskon Katalog'}
                    </span>
                    <span>-{formatIDR(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Biaya Layanan</span>
                  <span className="text-emerald-600 font-bold text-[10px] uppercase">Rp 0 (Gratis)</span>
                </div>
                
                <div className="flex justify-between pt-2 border-t border-slate-900 text-sm font-black text-slate-950">
                  <span>Total Tagihan</span>
                  <span className="text-slate-900 text-base">{formatIDR(finalPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white py-3 text-xs font-black tracking-wide uppercase transition border-0 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Memproses Pesanan...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db';
import { orders, products, users, credentials, systemSettings, promos } from '../../db/schema';
import { getSessionUser } from './auth.server';
import { decrypt } from './crypto.server';
import { triggerPaymentSuccessNotification } from './notifications.server';

const createOrderSchema = z.object({
  productId: z.string(),
  parentOrderId: z.string().optional(),
  durationMonths: z.number().optional(),
  appliedPromoId: z.string().optional(),
});

/**
 * Server function to create a new subscription order.
 */
export const createOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const user = getSessionUser();
    if (!user) {
      throw new Error('Anda harus masuk terlebih dahulu untuk melakukan pemesanan.');
    }

    const { productId, parentOrderId, durationMonths, appliedPromoId } = data;

    // Fetch all configurations from database settings
    const settingsList = await db.select().from(systemSettings);
    const settingsRecord: Record<string, string> = {};
    settingsList.forEach(setting => {
      settingsRecord[setting.key] = setting.value;
    });

    const paymentMethod = (settingsRecord['active_payment_gateway'] || 'midtrans') as 'midtrans' | 'pakasir';

    // Fetch product details
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product || !product.isActive) {
      throw new Error('Produk tidak ditemukan atau sudah tidak aktif.');
    }

    // Determine final duration and price
    const finalDuration = durationMonths || product.durationMonths;
    const baseMonthlyPrice = Math.round(product.price / product.durationMonths);
    let finalPrice = baseMonthlyPrice * finalDuration;

    // Apply bulk renewal discounts if it is a renewal
    if (parentOrderId) {
      if (finalDuration === 3) {
        finalPrice = Math.round(finalPrice * 0.95); // 5% discount
      } else if (finalDuration === 6) {
        finalPrice = Math.round(finalPrice * 0.90); // 10% discount
      } else if (finalDuration === 12) {
        finalPrice = Math.round(finalPrice * 0.85); // 15% discount
      }
    }

    // Apply promo/voucher discount
    let discountAmount = 0;
    let promoToUpdate = null;

    if (appliedPromoId) {
      const [promo] = await db
        .select()
        .from(promos)
        .where(eq(promos.id, appliedPromoId))
        .limit(1);

      if (promo && promo.isActive) {
        if (finalDuration >= promo.minDurationMonths) {
          if (!promo.maxUses || promo.usedCount < promo.maxUses) {
            const now = new Date();
            const startOk = !promo.validFrom || now >= new Date(promo.validFrom);
            const endOk = !promo.validUntil || now <= new Date(promo.validUntil);
            const prodOk = !promo.productId || promo.productId === productId;

            if (startOk && endOk && prodOk) {
              if (promo.discountType === 'percentage') {
                discountAmount = Math.round(finalPrice * (promo.discountValue / 100));
                if (promo.maxDiscountAmount) {
                  discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
                }
              } else if (promo.discountType === 'fixed') {
                discountAmount = promo.discountValue;
              }
              finalPrice = Math.max(0, finalPrice - discountAmount);
              promoToUpdate = promo;
            }
          }
        }
      }
    }

    // Generate custom Order ID: ORD-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const orderId = `ORD-${dateStr}-${randomSuffix}`;

    // Initialize mock payment values as fallback
    let paymentRedirectUrl = `/checkout/pay?orderId=${orderId}`; 
    let paymentTransactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Get absolute origin for callback redirects
    let origin = 'http://localhost:3000';
    try {
      const { getRequest } = await import('@tanstack/react-start/server');
      const req = getRequest();
      if (req) {
        origin = new URL(req.url).origin;
      }
    } catch (e) {
      console.warn('Failed to resolve request origin, falling back to localhost', e);
    }

    if (paymentMethod === 'midtrans') {
      try {
        const midtransEnv = settingsRecord['midtrans_env'] || 'sandbox';
        const isProduction = midtransEnv.toLowerCase() === 'production';
        const serverKey = isProduction
          ? (settingsRecord['midtrans_server_key_production'] || process.env.MIDTRANS_PRODUCTION_SERVER_KEY)
          : (settingsRecord['midtrans_server_key_sandbox'] || process.env.MIDTRANS_SANDBOX_SERVER_KEY);
        const endpoint = isProduction
          ? 'https://app.midtrans.com/snap/v1/transactions'
          : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        if (!serverKey) {
          throw new Error('Midtrans Server Key belum dikonfigurasi di .env');
        }

        const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: orderId,
              gross_amount: finalPrice,
            },
            credit_card: {
              secure: true,
            },
            customer_details: {
              first_name: user.name,
              email: user.email,
              phone: user.whatsapp,
            },
          }),
        });

        const resData = await response.json() as any;
        if (response.ok && resData.redirect_url) {
          paymentRedirectUrl = resData.redirect_url;
          if (resData.token) {
            paymentTransactionId = resData.token;
          }
        } else {
          console.error('[Midtrans Snap API Error]', resData);
          throw new Error(resData.error_messages?.[0] || 'Gagal membuat transaksi Midtrans.');
        }
      } catch (err: any) {
        console.error('[Midtrans integration failed]', err);
        throw new Error(`Integrasi Midtrans Gagal: ${err.message}`);
      }
    } else if (paymentMethod === 'pakasir') {
      try {
        const pakasirEnv = settingsRecord['pakasir_env'] || 'sandbox';
        const isProduction = pakasirEnv.toLowerCase() === 'production';
        const slug = isProduction
          ? (settingsRecord['pakasir_slug_production'] || process.env.PAKASIR_SLUG || 'jbr-minpo')
          : (settingsRecord['pakasir_slug_sandbox'] || process.env.PAKASIR_SLUG || 'jbr-minpo');
        const redirectTarget = `${origin}/checkout/success?orderId=${orderId}`;
        
        // Construct the Pakasir direct payment URL
        paymentRedirectUrl = `https://app.pakasir.com/pay/${slug}/${finalPrice}?order_id=${orderId}&redirect=${encodeURIComponent(redirectTarget)}`;
      } catch (err: any) {
        console.error('[Pakasir integration failed]', err);
        throw new Error(`Integrasi Pakasir Gagal: ${err.message}`);
      }
    }

    // Insert order into DB
    const [newOrder] = await db
      .insert(orders)
      .values({
        id: orderId,
        userId: user.userId,
        productId: product.id,
        status: 'menunggu_pembayaran',
        price: finalPrice,
        paymentMethod,
        paymentRedirectUrl,
        paymentTransactionId,
        remainingDuration: finalDuration, // Start with selected duration
        parentOrderId: parentOrderId || null,
        appliedPromoId: appliedPromoId || null,
        discountAmount,
      })
      .returning();

    if (!newOrder) {
      throw new Error('Gagal membuat pesanan baru.');
    }

    if (promoToUpdate) {
      await db
        .update(promos)
        .set({ usedCount: promoToUpdate.usedCount + 1 })
        .where(eq(promos.id, promoToUpdate.id));
    }

    return {
      success: true,
      order: newOrder,
      redirectUrl: paymentRedirectUrl,
    };
  });

/**
 * Server function to fetch order history for the logged-in user.
 */
export const getMyOrders = createServerFn({ method: 'GET' }).handler(async () => {
  const user = getSessionUser();
  if (!user) {
    throw new Error('Anda harus masuk terlebih dahulu.');
  }

  try {
    const userOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        price: orders.price,
        paymentMethod: orders.paymentMethod,
        paymentRedirectUrl: orders.paymentRedirectUrl,
        remainingDuration: orders.remainingDuration,
        createdAt: orders.createdAt,
        productName: products.name,
        productCategory: products.category,
        productImageUrl: products.imageUrl,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.userId, user.userId))
      .orderBy(desc(orders.createdAt));

    return { success: true, orders: userOrders };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil riwayat pesanan.' };
  }
});

/**
 * Server function to fetch detailed info of a single order.
 */
export const getOrderById = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    const val = z.string().parse(data);
    console.log('GET_ORDER_BY_ID_VALIDATOR_OUT:', val);
    return val;
  })
  .handler(async ({ data: id }) => {
    console.log('GET_ORDER_BY_ID_HANDLER_INPUT_ID:', id);
    const user = getSessionUser();
    console.log('GET_ORDER_BY_ID_SESSION_USER:', user);
    if (!user) {
      throw new Error('Unauthorized');
    }

    try {
      const [order] = await db
        .select({
          id: orders.id,
          status: orders.status,
          price: orders.price,
          paymentMethod: orders.paymentMethod,
          paymentRedirectUrl: orders.paymentRedirectUrl,
          remainingDuration: orders.remainingDuration,
          createdAt: orders.createdAt,
          userId: orders.userId,
          productName: products.name,
          productCategory: products.category,
          productImageUrl: products.imageUrl,
        })
        .from(orders)
        .innerJoin(products, eq(orders.productId, products.id))
        .where(eq(orders.id, id))
        .limit(1);

      if (!order) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      // Safeguard: Only the order owner or an admin can access details
      if (order.userId !== user.userId && user.role !== 'admin') {
        throw new Error('Akses ditolak.');
      }

      return { success: true, order };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengambil detail pesanan.' };
    }
  });

/**
 * Server function to simulate a payment trigger for development.
 * Changes order status to 'menunggu_aktivasi'.
 */
export const simulatePaymentSuccess = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      // Update status to 'menunggu_aktivasi' (Paid)
      await db
        .update(orders)
        .set({ status: 'menunggu_aktivasi', updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // Send WhatsApp notification
      await triggerPaymentSuccessNotification(orderId);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch all active subscriptions for the logged-in user with credentials decrypted.
 */
export const getActiveSubscriptions = createServerFn({ method: 'GET' })
  .handler(async () => {
    const user = getSessionUser();
    if (!user) {
      throw new Error('Akses tidak diijinkan. Silakan login kembali.');
    }

    try {
      const activeSubs = await db
        .select({
          id: orders.id,
          status: orders.status,
          remainingDuration: orders.remainingDuration,
          createdAt: orders.createdAt,
          productId: products.id,
          productName: products.name,
          productCategory: products.category,
          productImageUrl: products.imageUrl,
          productPrice: products.price,
          productDurationMonths: products.durationMonths,
          encryptedAccountEmail: credentials.encryptedAccountEmail,
          encryptedAccountPassword: credentials.encryptedAccountPassword,
          remarks: credentials.remarks,
        })
        .from(orders)
        .innerJoin(products, eq(orders.productId, products.id))
        .leftJoin(credentials, eq(orders.id, credentials.orderId))
        .where(
          and(
            eq(orders.userId, user.userId),
            eq(orders.status, 'aktif')
          )
        )
        .orderBy(desc(orders.createdAt));

      // Decrypt credentials for customer presentation
      const formattedSubs = activeSubs.map((sub) => {
        let accountEmail = '';
        let accountPassword = '';

        if (sub.encryptedAccountEmail && sub.encryptedAccountPassword) {
          try {
            accountEmail = decrypt(sub.encryptedAccountEmail);
            accountPassword = decrypt(sub.encryptedAccountPassword);
          } catch (e) {
            console.error('Failed to decrypt credentials for order:', sub.id, e);
          }
        }

        return {
          id: sub.id,
          productId: sub.productId,
          productPrice: sub.productPrice,
          productDurationMonths: sub.productDurationMonths,
          productName: sub.productName,
          productCategory: sub.productCategory,
          productImageUrl: sub.productImageUrl,
          remainingDuration: sub.remainingDuration,
          createdAt: sub.createdAt,
          accountEmail,
          accountPassword,
          remarks: sub.remarks,
        };
      });

      return { success: true, subscriptions: formattedSubs };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengambil data langganan aktif.' };
    }
  });

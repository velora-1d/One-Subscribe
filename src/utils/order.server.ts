import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db';
import { orders, products, users, credentials, systemSettings, promos } from '../../db/schema';
import { decrypt } from './crypto.server';
import { triggerPaymentSuccessNotification } from './notifications.server';

export async function deductProductStock(orderId: string) {
  try {
    const [orderRecord] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderRecord && !orderRecord.parentOrderId) {
      const [productRecord] = await db
        .select()
        .from(products)
        .where(eq(products.id, orderRecord.productId))
        .limit(1);

      if (productRecord) {
        await db
          .update(products)
          .set({ 
            stock: Math.max(0, productRecord.stock - 1),
            updatedAt: new Date(),
          })
          .where(eq(products.id, orderRecord.productId));
        console.log(`[Stock Deduction] Deducted 1 stock for product ${productRecord.name}. New stock: ${Math.max(0, productRecord.stock - 1)}`);
      }
    }
  } catch (err) {
    console.error('Failed to deduct product stock for order:', orderId, err);
  }
}

export async function createOrderServer(data: any, user: any, origin: string) {
  const { productId, parentOrderId, durationMonths, appliedPromoId } = data;

  const settingsList = await db.select().from(systemSettings);
  const settingsRecord: Record<string, string> = {};
  settingsList.forEach(setting => {
    settingsRecord[setting.key] = setting.value;
  });

  const paymentMethod = (settingsRecord['active_payment_gateway'] || 'midtrans') as 'midtrans' | 'pakasir';

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product || !product.isActive) {
    throw new Error('Produk tidak ditemukan atau sudah tidak aktif.');
  }

  if (!parentOrderId && product.stock <= 0) {
    throw new Error('Stok produk ini sedang habis. Silakan hubungi admin atau pilih produk lain.');
  }

  const finalDuration = durationMonths || product.durationMonths;
  const baseMonthlyPrice = Math.round(product.price / product.durationMonths);
  let finalPrice = baseMonthlyPrice * finalDuration;

  if (parentOrderId) {
    if (finalDuration === 3) {
      finalPrice = Math.round(finalPrice * 0.95);
    } else if (finalDuration === 6) {
      finalPrice = Math.round(finalPrice * 0.90);
    } else if (finalDuration === 12) {
      finalPrice = Math.round(finalPrice * 0.85);
    }
  }

  let discountAmount = 0;
  let promoToUpdate = null;

  if (appliedPromoId) {
    const [promo] = await db
      .select()
      .from(promos)
      .where(eq(promos.id, appliedPromoId))
      .limit(1);

    if (!promo || !promo.isActive) {
      throw new Error('Kupon tidak aktif atau tidak ditemukan.');
    }
    if (finalDuration < promo.minDurationMonths) {
      throw new Error(`Minimal durasi berlangganan untuk kupon ini adalah ${promo.minDurationMonths} bulan.`);
    }
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new Error('Kuota penggunaan kupon ini sudah habis.');
    }
    const now = new Date();
    if (promo.validFrom && now < new Date(promo.validFrom)) {
      throw new Error('Kupon ini belum bisa digunakan.');
    }
    if (promo.validUntil && now > new Date(promo.validUntil)) {
      throw new Error('Kupon ini sudah kadaluarsa.');
    }
    if (promo.productId && promo.productId !== productId) {
      throw new Error('Kupon ini tidak berlaku untuk produk yang Anda pilih.');
    }

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

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ORD-${dateStr}-${randomSuffix}`;

  let paymentRedirectUrl = `/checkout/pay?orderId=${orderId}`; 
  let paymentTransactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  if (paymentMethod === 'midtrans') {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const serverKey = settingsRecord['midtrans_server_key'] || process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-DUMMY_KEY';
      const endpoint = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

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
          credit_card: { secure: true },
          customer_details: {
            first_name: user.name,
            email: user.email,
          },
        }),
      });

      const resData = await response.json() as any;
      if (response.ok && resData.redirect_url) {
        paymentRedirectUrl = resData.redirect_url;
        paymentTransactionId = resData.token;
      } else {
        throw new Error(resData.error_messages?.[0] || 'Gagal membuat transaksi Midtrans.');
      }
    } catch (err: any) {
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
      
      paymentRedirectUrl = `https://app.pakasir.com/pay/${slug}/${finalPrice}?order_id=${orderId}&redirect=${encodeURIComponent(redirectTarget)}`;
    } catch (err: any) {
      console.error('[Pakasir integration failed]', err);
      throw new Error(`Integrasi Pakasir Gagal: ${err.message}`);
    }
  }

  const newOrder = await db.transaction(async (tx) => {
    const [insertedOrder] = await tx
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
        remainingDuration: finalDuration,
        parentOrderId: parentOrderId || null,
        appliedPromoId: appliedPromoId || null,
        discountAmount,
        customerInput: customerInput || null,
      })
      .returning();

    if (!insertedOrder) {
      throw new Error('Gagal membuat pesanan baru.');
    }

    if (promoToUpdate) {
      await tx
        .update(promos)
        .set({ usedCount: promoToUpdate.usedCount + 1 })
        .where(eq(promos.id, promoToUpdate.id));
    }

    return insertedOrder;
  });

  return {
    success: true,
    error: null,
    order: newOrder,
    redirectUrl: paymentRedirectUrl,
  };
}

export async function getMyOrdersServer(userId: string) {
  const userOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      price: orders.price,
      paymentMethod: orders.paymentMethod,
      paymentRedirectUrl: orders.paymentRedirectUrl,
      remainingDuration: orders.remainingDuration,
      createdAt: orders.createdAt,
      customerInput: orders.customerInput,
      productName: products.name,
      productCategory: products.category,
      productImageUrl: products.imageUrl,
      productFulfillmentType: products.fulfillmentType,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return { success: true, error: null, orders: userOrders };
}

export async function getOrderByIdServer(id: string) {
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
      customerInput: orders.customerInput,
      productName: products.name,
      productCategory: products.category,
      productImageUrl: products.imageUrl,
      productFulfillmentType: products.fulfillmentType,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  return order;
}

export async function simulatePaymentSuccessServer(orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  await db
    .update(orders)
    .set({ status: 'menunggu_aktivasi', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await deductProductStock(orderId);
  await triggerPaymentSuccessNotification(orderId);

  return { success: true, error: null };
}

export async function getActiveSubscriptionsServer(userId: string) {
  const activeSubs = await db
    .select({
      id: orders.id,
      status: orders.status,
      remainingDuration: orders.remainingDuration,
      createdAt: orders.createdAt,
      customerInput: orders.customerInput,
      productId: products.id,
      productName: products.name,
      productCategory: products.category,
      productImageUrl: products.imageUrl,
      productPrice: products.price,
      productDurationMonths: products.durationMonths,
      productFulfillmentType: products.fulfillmentType,
      productDownloadUrl: products.downloadUrl,
      productFulfillmentInstructions: products.fulfillmentInstructions,
      fulfillmentType: credentials.fulfillmentType,
      fulfillmentData: credentials.fulfillmentData,
      encryptedAccountEmail: credentials.encryptedAccountEmail,
      encryptedAccountPassword: credentials.encryptedAccountPassword,
      remarks: credentials.remarks,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .leftJoin(credentials, eq(orders.id, credentials.orderId))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, 'aktif')
      )
    )
    .orderBy(desc(orders.createdAt));

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

    let parsedFulfillmentData: any = {};
    if (sub.fulfillmentData) {
      try {
        parsedFulfillmentData = JSON.parse(sub.fulfillmentData);
      } catch (e) {}
    }

    const effectiveFulfillmentType = sub.fulfillmentType || sub.productFulfillmentType || 'credentials';

    return {
      id: sub.id,
      productId: sub.productId,
      productPrice: sub.productPrice,
      productDurationMonths: sub.productDurationMonths,
      productName: sub.productName,
      productCategory: sub.productCategory,
      productImageUrl: sub.productImageUrl,
      productFulfillmentType: sub.productFulfillmentType || 'credentials',
      productDownloadUrl: sub.productDownloadUrl,
      productFulfillmentInstructions: sub.productFulfillmentInstructions,
      fulfillmentType: effectiveFulfillmentType,
      downloadUrl: parsedFulfillmentData.downloadUrl || sub.productDownloadUrl,
      licenseKey: parsedFulfillmentData.licenseKey,
      fulfillmentInstructions: parsedFulfillmentData.fulfillmentInstructions || sub.productFulfillmentInstructions,
      customerInput: sub.customerInput,
      remainingDuration: sub.remainingDuration,
      createdAt: sub.createdAt,
      accountEmail,
      accountPassword,
      remarks: sub.remarks,
    };
  });

  return { success: true, error: null, subscriptions: formattedSubs };
}

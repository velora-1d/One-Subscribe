import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const createOrderSchema = z.object({
  productId: z.string(),
  parentOrderId: z.string().optional(),
  durationMonths: z.number().optional(),
  appliedPromoId: z.string().optional(),
  customerInput: z.string().optional(),
});

/**
 * Server function to create a new subscription order.
 */
export const createOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user) {
      throw new Error('Anda harus masuk terlebih dahulu untuk melakukan pemesanan.');
    }

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

    const { createOrderServer } = await import('./order.server');
    return await createOrderServer(data, user, origin);
  });

/**
 * Server function to fetch order history for the logged-in user.
 */
export const getMyOrders = createServerFn({ method: 'GET' }).handler(async () => {
  const { getSessionUser } = await import('./auth.server');
  const user = getSessionUser();
  if (!user) {
    throw new Error('Anda harus masuk terlebih dahulu.');
  }

  try {
    const { getMyOrdersServer } = await import('./order.server');
    return await getMyOrdersServer(user.userId);
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil riwayat pesanan.' };
  }
});

/**
 * Server function to fetch detailed info of a single order.
 */
export const getOrderById = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: id }) => {
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    try {
      const { getOrderByIdServer } = await import('./order.server');
      const order = await getOrderByIdServer(id);

      if (order.userId !== user.userId && user.role !== 'admin') {
        throw new Error('Akses ditolak.');
      }

      return { success: true, error: null, order };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengambil detail pesanan.' };
    }
  });

/**
 * Server function to simulate a payment trigger for development.
 */
export const simulatePaymentSuccess = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    try {
      const { simulatePaymentSuccessServer } = await import('./order.server');
      return await simulatePaymentSuccessServer(orderId);
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch all active subscriptions for the logged-in user with credentials decrypted.
 */
export const getActiveSubscriptions = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user) {
      throw new Error('Akses tidak diijinkan. Silakan login kembali.');
    }

    try {
      const { getActiveSubscriptionsServer } = await import('./order.server');
      return await getActiveSubscriptionsServer(user.userId);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengambil data langganan aktif.' };
    }
  });

/**
 * Isomorphic/bridge export for background scripts to call stock deduction logic.
 */
export async function deductProductStock(orderId: string) {
  const { deductProductStock: deduct } = await import('./order.server');
  return deduct(orderId);
}

/**
 * Server function to cancel a pending order.
 */
export const cancelOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user) {
      throw new Error('Akses ditolak. Silakan login kembali.');
    }

    try {
      const { cancelOrderServer } = await import('./order.server');
      return await cancelOrderServer(orderId, user.userId, user.role);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal membatalkan pesanan.' };
    }
  });

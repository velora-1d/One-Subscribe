import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const testConnectionSchema = z.object({
  service: z.enum(['midtrans', 'pakasir', 'fonnte', 'evolution', 'rustfs', 'midtrans_callback', 'pakasir_callback', 'email']),
});

/**
 * Server function to fetch all system settings values (toggles only).
 */
export const getAllSystemSettings = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getAllSystemSettingsServer } = await import('./settings.server');
    return await getAllSystemSettingsServer();
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil konfigurasi sistem.' };
  }
});

/**
 * Server function to update system settings (toggles only).
 */
export const updateSystemSettings = createServerFn({ method: 'POST' })
  .validator((data: Record<string, string>) => data)
  .handler(async ({ data }) => {
    try {
      const { updateSystemSettingsServer } = await import('./settings.server');
      return await updateSystemSettingsServer(data);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal menyimpan pengaturan.' };
    }
  });

/**
 * Server function to fetch the active payment gateway setting.
 */
export const getActivePaymentGateway = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getActivePaymentGatewayServer } = await import('./settings.server');
    return await getActivePaymentGatewayServer();
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil status gateway aktif.' };
  }
});

/**
 * Server function to update active payment gateway.
 */
export const updateActivePaymentGateway = createServerFn({ method: 'POST' })
  .validator((gateway: 'midtrans' | 'pakasir') => gateway)
  .handler(async ({ data: gateway }) => {
    try {
      const { updateActivePaymentGatewayServer } = await import('./settings.server');
      return await updateActivePaymentGatewayServer(gateway);
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

/**
 * Server function to perform connectivity tests using env variables.
 */
export const testConnection = createServerFn({ method: 'POST' })
  .validator((data: unknown) => testConnectionSchema.parse(data))
  .handler(async ({ data }) => {
    let origin = 'http://localhost:3000';
    try {
      const { getRequest } = await import('@tanstack/react-start/server');
      const req = getRequest();
      if (req) {
        origin = new URL(req.url).origin;
      }
    } catch (e) {
      // fallback
    }

    try {
      const { testConnectionFromServer } = await import('./settings.server');
      return await testConnectionFromServer(data, origin);
    } catch (err: any) {
      return { success: false, message: `Koneksi Gagal: ${err.message}` };
    }
  });

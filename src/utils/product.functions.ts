import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

/**
 * Server function to fetch all active products.
 */
export const getActiveProducts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getActiveProductsServer } = await import('./product.server');
    return await getActiveProductsServer();
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil data produk.' };
  }
});

/**
 * Server function to fetch a single product by ID.
 */
export const getProductById = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: id }) => {
    try {
      // Validate UUID format to prevent database crash on invalid UUID syntax query
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        return { success: false, error: 'Produk tidak ditemukan.' };
      }

      const { getProductByIdServer } = await import('./product.server');
      return await getProductByIdServer(id);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengambil detail produk.' };
    }
  });

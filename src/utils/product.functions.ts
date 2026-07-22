import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { products } from '../../db/schema';

/**
 * Server function to fetch all active products.
 */
export const getActiveProducts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const activeProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true));
    return { success: true, products: activeProducts };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil data produk.' };
  }
});

/**
 * Server function to fetch a single product by ID.
 */
export const getProductById = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    try {
      // Validate UUID format to prevent database crash on invalid UUID syntax query
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        return { success: false, error: 'Produk tidak ditemukan.' };
      }

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!product) {
        throw new Error('Produk tidak ditemukan.');
      }

      return { success: true, product };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengambil detail produk.' };
    }
  });

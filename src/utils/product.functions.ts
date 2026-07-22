import { createServerFn } from '@tanstack/react-start';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db';
import { products, promos } from '../../db/schema';

async function attachPromosToProducts(productList: any[]) {
  if (productList.length === 0) return productList;

  const now = new Date();
  try {
    // Fetch all active catalog slashed promos
    const activePromos = await db
      .select()
      .from(promos)
      .where(
        and(
          eq(promos.isActive, true),
          eq(promos.isCatalogSlashed, true)
        )
      );

    return productList.map(product => {
      // Find promos that match this product or are global
      const matchingPromos = activePromos.filter(promo => {
        // Check date range
        const startOk = !promo.validFrom || now >= new Date(promo.validFrom);
        const endOk = !promo.validUntil || now <= new Date(promo.validUntil);
        // Check target product
        const prodOk = !promo.productId || promo.productId === product.id;
        // Check kuota
        const limitOk = !promo.maxUses || promo.usedCount < promo.maxUses;

        return startOk && endOk && prodOk && limitOk;
      });

      if (matchingPromos.length > 0) {
        // Sort to find the best discount (we just pick the first one matching)
        const promo = matchingPromos[0];
        let discountAmount = 0;
        if (promo.discountType === 'percentage') {
          discountAmount = Math.round(product.price * (promo.discountValue / 100));
          if (promo.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
          }
        } else if (promo.discountType === 'fixed') {
          discountAmount = promo.discountValue;
        }

        const priceAfterPromo = Math.max(0, product.price - discountAmount);
        return {
          ...product,
          promo: {
            id: promo.id,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minDurationMonths: promo.minDurationMonths,
            discountAmount,
            priceAfterPromo,
          }
        };
      }

      return product;
    });
  } catch (err) {
    console.error('[Error attaching promos]', err);
    return productList;
  }
}

/**
 * Server function to fetch all active products.
 */
export const getActiveProducts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const activeProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true));

    const productsWithPromos = await attachPromosToProducts(activeProducts);
    return { success: true, products: productsWithPromos };
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

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!product) {
        throw new Error('Produk tidak ditemukan.');
      }

      const [productWithPromo] = await attachPromosToProducts([product]);
      return { success: true, product: productWithPromo };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengambil detail produk.' };
    }
  });

import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { products, promos } from '../../db/schema';

export async function attachPromosToProducts(productList: any[]) {
  if (productList.length === 0) return productList;

  const now = new Date();
  try {
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
      const matchingPromos = activePromos.filter(promo => {
        const startOk = !promo.validFrom || now >= new Date(promo.validFrom);
        const endOk = !promo.validUntil || now <= new Date(promo.validUntil);
        const prodOk = !promo.productId || promo.productId === product.id;
        const limitOk = !promo.maxUses || promo.usedCount < promo.maxUses;

        return startOk && endOk && prodOk && limitOk;
      });

      if (matchingPromos.length > 0) {
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

export async function getActiveProductsServer() {
  const activeProducts = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true));

  const productsWithPromos = await attachPromosToProducts(activeProducts);
  return { success: true, error: null, products: productsWithPromos };
}

export async function getProductByIdServer(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    throw new Error('Produk tidak ditemukan.');
  }

  const [productWithPromo] = await attachPromosToProducts([product]);
  return { success: true, error: null, product: productWithPromo };
}

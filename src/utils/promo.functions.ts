import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import { promos, products, auditLogs } from '../../db/schema';
import { getSessionUser } from './auth.server';

function verifyAdminSession() {
  const user = getSessionUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Akses ditolak. Anda bukan Administrator.');
  }
  return user;
}

/**
 * Server function to fetch all promos.
 */
export const getPromos = createServerFn({ method: 'GET' }).handler(async () => {
  verifyAdminSession();
  try {
    const list = await db
      .select({
        id: promos.id,
        code: promos.code,
        discountType: promos.discountType,
        discountValue: promos.discountValue,
        maxDiscountAmount: promos.maxDiscountAmount,
        minDurationMonths: promos.minDurationMonths,
        isCatalogSlashed: promos.isCatalogSlashed,
        productId: promos.productId,
        productName: products.name,
        maxUses: promos.maxUses,
        usedCount: promos.usedCount,
        validFrom: promos.validFrom,
        validUntil: promos.validUntil,
        isActive: promos.isActive,
        createdAt: promos.createdAt,
      })
      .from(promos)
      .leftJoin(products, eq(promos.productId, products.id))
      .orderBy(desc(promos.createdAt));

    return { success: true, promos: list };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat data promo.' };
  }
});

const createPromoSchema = z.object({
  code: z.string().nullable().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1, 'Nilai diskon harus lebih dari 0'),
  maxDiscountAmount: z.number().nullable().optional(),
  minDurationMonths: z.number().default(1),
  isCatalogSlashed: z.boolean().default(false),
  productId: z.string().nullable().optional(),
  maxUses: z.number().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

/**
 * Server function to create a new promo or voucher.
 */
export const createPromo = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createPromoSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = verifyAdminSession();
    try {
      const {
        code,
        discountType,
        discountValue,
        maxDiscountAmount,
        minDurationMonths,
        isCatalogSlashed,
        productId,
        maxUses,
        validFrom,
        validUntil,
      } = data;

      // Validate unique code if provided
      if (code) {
        const [existing] = await db
          .select()
          .from(promos)
          .where(eq(promos.code, code))
          .limit(1);
        if (existing) {
          throw new Error(`Kode voucher "${code}" sudah digunakan. Gunakan kode lain.`);
        }
      }

      const [newPromo] = await db
        .insert(promos)
        .values({
          code: code || null,
          discountType,
          discountValue,
          maxDiscountAmount: maxDiscountAmount || null,
          minDurationMonths,
          isCatalogSlashed,
          productId: productId || null,
          maxUses: maxUses || null,
          validFrom: validFrom ? new Date(validFrom) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          usedCount: 0,
          isActive: true,
        })
        .returning();

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'CREATE_PROMO',
        details: `Membuat promo baru dengan ID ${newPromo.id} (${code || 'Promo Katalog'})`,
      });

      return { success: true, promo: newPromo };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal membuat promo baru.' };
    }
  });

const updatePromoSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(1, 'Nilai diskon harus lebih dari 0'),
  maxDiscountAmount: z.number().nullable().optional(),
  minDurationMonths: z.number().default(1),
  isCatalogSlashed: z.boolean().default(false),
  productId: z.string().nullable().optional(),
  maxUses: z.number().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

/**
 * Server function to update an existing promo.
 */
export const updatePromo = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updatePromoSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = verifyAdminSession();
    try {
      const {
        id,
        code,
        discountType,
        discountValue,
        maxDiscountAmount,
        minDurationMonths,
        isCatalogSlashed,
        productId,
        maxUses,
        validFrom,
        validUntil,
      } = data;

      // Validate unique code if changed
      if (code) {
        const [existing] = await db
          .select()
          .from(promos)
          .where(eq(promos.code, code))
          .limit(1);
        if (existing && existing.id !== id) {
          throw new Error(`Kode voucher "${code}" sudah digunakan oleh promo lain.`);
        }
      }

      await db
        .update(promos)
        .set({
          code: code || null,
          discountType,
          discountValue,
          maxDiscountAmount: maxDiscountAmount || null,
          minDurationMonths,
          isCatalogSlashed,
          productId: productId || null,
          maxUses: maxUses || null,
          validFrom: validFrom ? new Date(validFrom) : null,
          validUntil: validUntil ? new Date(validUntil) : null,
          updatedAt: new Date(),
        })
        .where(eq(promos.id, id));

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'UPDATE_PROMO',
        details: `Memperbarui promo ${id} (${code || 'Promo Katalog'})`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal memperbarui promo.' };
    }
  });

const togglePromoSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
});

/**
 * Server function to activate or deactivate a promo.
 */
export const togglePromoActive = createServerFn({ method: 'POST' })
  .validator((data: unknown) => togglePromoSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = verifyAdminSession();
    try {
      await db
        .update(promos)
        .set({ isActive: data.isActive, updatedAt: new Date() })
        .where(eq(promos.id, data.id));

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: data.isActive ? 'ACTIVATE_PROMO' : 'DEACTIVATE_PROMO',
        details: `Mengubah status promo ${data.id} menjadi ${data.isActive ? 'Aktif' : 'Nonaktif'}`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengubah status promo.' };
    }
  });

/**
 * Server function to delete a promo.
 */
export const deletePromo = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: id }) => {
    const admin = verifyAdminSession();
    try {
      await db.delete(promos).where(eq(promos.id, id));

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'DELETE_PROMO',
        details: `Menghapus promo ${id}`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal menghapus promo.' };
    }
  });

const validateVoucherSchema = z.object({
  code: z.string(),
  productId: z.string(),
  durationMonths: z.number(),
});

/**
 * Server function to validate voucher at checkout.
 */
export const validateVoucher = createServerFn({ method: 'POST' })
  .validator((data: unknown) => validateVoucherSchema.parse(data))
  .handler(async ({ data }) => {
    const user = getSessionUser();
    if (!user) {
      throw new Error('Anda harus login terlebih dahulu.');
    }

    try {
      const { code, productId, durationMonths } = data;

      // Find promo
      const [promo] = await db
        .select()
        .from(promos)
        .where(eq(promos.code, code))
        .limit(1);

      if (!promo) {
        throw new Error('Kode voucher tidak valid atau tidak ditemukan.');
      }

      if (!promo.isActive) {
        throw new Error('Kupon ini sudah tidak aktif.');
      }

      // Check dates
      const now = new Date();
      if (promo.validFrom && now < new Date(promo.validFrom)) {
        throw new Error('Kupon ini belum bisa digunakan.');
      }
      if (promo.validUntil && now > new Date(promo.validUntil)) {
        throw new Error('Kupon ini sudah kadaluarsa.');
      }

      // Check limits
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        throw new Error('Kuota penggunaan kupon ini sudah habis.');
      }

      // Check target product
      if (promo.productId && promo.productId !== productId) {
        throw new Error('Kupon ini tidak berlaku untuk produk yang Anda pilih.');
      }

      // Check duration months constraint
      if (durationMonths < promo.minDurationMonths) {
        throw new Error(`Minimal pembelian untuk menggunakan voucher ini adalah ${promo.minDurationMonths} bulan.`);
      }

      // If valid, return promo details
      return {
        success: true,
        promo: {
          id: promo.id,
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          maxDiscountAmount: promo.maxDiscountAmount,
        }
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Voucher tidak valid.' };
    }
  });

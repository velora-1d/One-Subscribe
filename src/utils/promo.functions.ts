import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

async function verifyAdminSession() {
  const { getSessionUser } = await import('./auth.server');
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
  await verifyAdminSession();
  try {
    const { getPromosServer } = await import('./promo.server');
    return await getPromosServer();
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
    const admin = await verifyAdminSession();
    try {
      const { createPromoServer } = await import('./promo.server');
      return await createPromoServer(data, admin.userId);
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
    const admin = await verifyAdminSession();
    try {
      const { updatePromoServer } = await import('./promo.server');
      return await updatePromoServer(data, admin.userId);
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
    const admin = await verifyAdminSession();
    try {
      const { togglePromoActiveServer } = await import('./promo.server');
      return await togglePromoActiveServer(data, admin.userId);
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
    const admin = await verifyAdminSession();
    try {
      const { deletePromoServer } = await import('./promo.server');
      return await deletePromoServer(id, admin.userId);
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
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user) {
      throw new Error('Anda harus login terlebih dahulu.');
    }

    try {
      const { validateVoucherServer } = await import('./promo.server');
      return await validateVoucherServer(data);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Voucher tidak valid.' };
    }
  });

import { eq, desc } from 'drizzle-orm';
import { db } from '../../db';
import { promos, products, auditLogs } from '../../db/schema';

export async function getPromosServer() {
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

  return { success: true, error: null, promos: list };
}

export async function createPromoServer(data: any, adminUserId: string) {
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
    userId: adminUserId,
    action: 'CREATE_PROMO',
    details: `Membuat promo baru dengan ID ${newPromo.id} (${code || 'Promo Katalog'})`,
  });

  return { success: true, error: null, promo: newPromo };
}

export async function updatePromoServer(data: any, adminUserId: string) {
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
    userId: adminUserId,
    action: 'UPDATE_PROMO',
    details: `Memperbarui promo ${id} (${code || 'Promo Katalog'})`,
  });

  return { success: true, error: null };
}

export async function togglePromoActiveServer(data: any, adminUserId: string) {
  await db
    .update(promos)
    .set({ isActive: data.isActive, updatedAt: new Date() })
    .where(eq(promos.id, data.id));

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: data.isActive ? 'ACTIVATE_PROMO' : 'DEACTIVATE_PROMO',
    details: `Mengubah status promo ${data.id} menjadi ${data.isActive ? 'Aktif' : 'Nonaktif'}`,
  });

  return { success: true, error: null };
}

export async function deletePromoServer(id: string, adminUserId: string) {
  await db.delete(promos).where(eq(promos.id, id));

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'DELETE_PROMO',
    details: `Menghapus promo ${id}`,
  });

  return { success: true, error: null };
}

export async function validateVoucherServer(data: any) {
  const { code, productId, durationMonths } = data;

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

  const now = new Date();
  if (promo.validFrom && now < new Date(promo.validFrom)) {
    throw new Error('Kupon ini belum bisa digunakan.');
  }
  if (promo.validUntil && now > new Date(promo.validUntil)) {
    throw new Error('Kupon ini sudah kadaluarsa.');
  }

  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    throw new Error('Kuota penggunaan kupon ini sudah habis.');
  }

  if (promo.productId && promo.productId !== productId) {
    throw new Error('Kupon ini tidak berlaku untuk produk yang Anda pilih.');
  }

  if (durationMonths < promo.minDurationMonths) {
    throw new Error(`Minimal pembelian untuk menggunakan voucher ini adalah ${promo.minDurationMonths} bulan.`);
  }

  return {
    success: true,
    error: null,
    promo: {
      id: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount,
      minDurationMonths: promo.minDurationMonths,
    }
  };
}

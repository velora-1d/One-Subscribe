import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

// Middlewares check for safety
async function verifyAdminSession() {
  const { getSessionUser } = await import('./auth.server');
  const user = getSessionUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Akses ditolak. Anda bukan Administrator.');
  }
  return user;
}

/**
 * Server function to fetch dashboard analytics statistics for the admin panel.
 */
export const getAdminStats = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getAdminStatsServer } = await import('./admin.server');
    return await getAdminStatsServer();
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat statistik.' };
  }
});

// Product Input Schema
const productInputSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  price: z.number().int().positive('Harga harus bernilai positif'),
  durationMonths: z.number().int().positive('Durasi harus bernilai positif'),
  category: z.string().min(1, 'Kategori harus diisi'),
  imageUrl: z.string().optional().nullable(),
  stock: z.number().int().nonnegative('Stok harus bernilai non-negatif').default(0),
});

/**
 * Server function to fetch all products for admin CRUD.
 */
export const getAdminProducts = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getAdminProductsServer } = await import('./admin.server');
    return await getAdminProductsServer();
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
});

/**
 * Server function to create a product.
 */
export const createAdminProduct = createServerFn({ method: 'POST' })
  .validator((data: unknown) => productInputSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { createAdminProductServer } = await import('./admin.server');
      return await createAdminProductServer(data, admin.userId);
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to update a product.
 */
export const updateAdminProduct = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string(), product: productInputSchema }).parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { updateAdminProductServer } = await import('./admin.server');
      return await updateAdminProductServer(data, admin.userId);
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to toggle a product's active status.
 */
export const toggleProductStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string(), isActive: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    await verifyAdminSession();
    try {
      const { toggleProductStatusServer } = await import('./admin.server');
      return await toggleProductStatusServer(data);
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to delete a product.
 */
export const deleteAdminProduct = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const admin = await verifyAdminSession();
    try {
      const { deleteAdminProductServer } = await import('./admin.server');
      return await deleteAdminProductServer(id, admin.userId);
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch all orders for admin management.
 */
export const getAdminOrders = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getAdminOrdersServer } = await import('./admin.server');
    return await getAdminOrdersServer();
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
});

// Fulfill Order inputs
const fulfillOrderSchema = z.object({
  orderId: z.string(),
  email: z.string().min(1, 'Email akun harus diisi'),
  password: z.string().min(1, 'Password akun harus diisi'),
  remarks: z.string().optional(),
});

/**
 * Server function to fulfill/activate a customer order.
 */
export const fulfillOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => fulfillOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { fulfillOrderServer } = await import('./admin.server');
      return await fulfillOrderServer(data, admin.userId);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal memproses aktivasi.' };
    }
  });

/**
 * Server function to fetch all registered users for admin management.
 */
export const getAdminUsers = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getAdminUsersServer } = await import('./admin.server');
    return await getAdminUsersServer();
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
});

// CRUD User schemas
const createAdminUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  whatsapp: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
  role: z.enum(['customer', 'admin']),
});

const updateAdminUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  whatsapp: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
  role: z.enum(['customer', 'admin']),
  password: z.string().optional(),
});

/**
 * Server function to manually create a user.
 */
export const createAdminUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => createAdminUserSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { createAdminUserServer } = await import('./admin.server');
      return await createAdminUserServer(data, admin.userId);
    } catch (error: any) {
      console.error("createAdminUser error:", error);
      return { success: false, error: error?.message || 'Gagal membuat user manual.' };
    }
  });

/**
 * Server function to manually update a user.
 */
export const updateAdminUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => updateAdminUserSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { updateAdminUserServer } = await import('./admin.server');
      return await updateAdminUserServer(data, admin.userId);
    } catch (error: any) {
      console.error("updateAdminUser error:", error);
      return { success: false, error: error?.message || 'Gagal memperbarui data user.' };
    }
  });

/**
 * Server function to manually delete a user.
 */
export const deleteAdminUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: userId }) => {
    const admin = await verifyAdminSession();
    if (admin.userId === userId) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri.');
    }
    try {
      const { deleteAdminUserServer } = await import('./admin.server');
      return await deleteAdminUserServer(userId, admin.userId);
    } catch (error: any) {
      console.error("deleteAdminUser error:", error);
      return { success: false, error: error?.message || 'Gagal menghapus user.' };
    }
  });

/**
 * Server function to toggle user block status.
 */
export const toggleUserStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string(), isActive: z.boolean() }).parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { toggleUserStatusServer } = await import('./admin.server');
      return await toggleUserStatusServer(data, admin.userId);
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch finance report data.
 */
export const getFinanceReport = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getFinanceReportServer } = await import('./admin.server');
    return await getFinanceReportServer();
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
});

// Category Schemas
const categoryInputSchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  description: z.string().optional().nullable(),
});

/**
 * Server function to fetch all categories.
 */
export const getAdminCategories = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getAdminCategoriesServer } = await import('./admin.server');
    return await getAdminCategoriesServer();
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
});

/**
 * Server function to create a category.
 */
export const createAdminCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => categoryInputSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { createAdminCategoryServer } = await import('./admin.server');
      return await createAdminCategoryServer(data, admin.userId);
    } catch (error: any) {
      if (error?.message?.includes('unique') || error?.code === '23505') {
        return { success: false, error: 'Kategori dengan nama tersebut sudah ada.' };
      }
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to update a category.
 */
export const updateAdminCategory = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string(), category: categoryInputSchema }).parse(data))
  .handler(async ({ data }) => {
    const admin = await verifyAdminSession();
    try {
      const { updateAdminCategoryServer } = await import('./admin.server');
      return await updateAdminCategoryServer(data, admin.userId);
    } catch (error: any) {
      if (error?.message?.includes('unique') || error?.code === '23505') {
        return { success: false, error: 'Kategori dengan nama tersebut sudah ada.' };
      }
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to delete a category.
 */
export const deleteAdminCategory = createServerFn({ method: 'POST' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const admin = await verifyAdminSession();
    try {
      const { deleteAdminCategoryServer } = await import('./admin.server');
      return await deleteAdminCategoryServer(id, admin.userId);
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to cancel an order.
 */
export const cancelAdminOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    const admin = await verifyAdminSession();
    try {
      const { cancelAdminOrderServer } = await import('./admin.server');
      return await cancelAdminOrderServer(orderId, admin.userId);
    } catch (error: any) {
      console.error("CANCEL_ADMIN_ORDER error:", error);
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to delete an order.
 */
export const deleteAdminOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    const admin = await verifyAdminSession();
    try {
      const { deleteAdminOrderServer } = await import('./admin.server');
      return await deleteAdminOrderServer(orderId, admin.userId);
    } catch (error: any) {
      console.error("DELETE_ADMIN_ORDER error:", error);
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch all orders with full customer and product info for reports.
 */
export const getAdminReports = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getAdminReportsServer } = await import('./admin.server');
    return await getAdminReportsServer();
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat data laporan.' };
  }
});

/**
 * Server function to confirm/activate a renewal order.
 */
export const confirmRenewal = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    const admin = await verifyAdminSession();
    try {
      const { confirmRenewalServer } = await import('./admin.server');
      return await confirmRenewalServer(orderId, admin.userId);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal mengonfirmasi perpanjangan.' };
    }
  });

const sendCustomWhatsappSchema = z.object({
  whatsapp: z.string(),
  message: z.string(),
});

export const sendCustomWhatsapp = createServerFn({ method: 'POST' })
  .validator((data: unknown) => sendCustomWhatsappSchema.parse(data))
  .handler(async ({ data }) => {
    await verifyAdminSession();
    try {
      const { sendCustomWhatsappServer } = await import('./admin.server');
      return await sendCustomWhatsappServer(data);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

/**
 * Server functions to manage message templates
 */
export const getAdminMessageTemplates = createServerFn({ method: 'GET' }).handler(async () => {
  await verifyAdminSession();
  try {
    const { getAdminMessageTemplatesServer } = await import('./admin.server');
    return await getAdminMessageTemplatesServer();
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat template pesan.' };
  }
});

const saveTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nama template wajib diisi'),
  code: z.string().min(1, 'Kode template wajib diisi'),
  content: z.string().min(1, 'Konten template wajib diisi'),
});

export const saveAdminMessageTemplate = createServerFn({ method: 'POST' })
  .validator((data: unknown) => saveTemplateSchema.parse(data))
  .handler(async ({ data }) => {
    await verifyAdminSession();
    try {
      const { saveAdminMessageTemplateServer } = await import('./admin.server');
      return await saveAdminMessageTemplateServer(data);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal menyimpan template.' };
    }
  });

export const deleteAdminMessageTemplate = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: id }) => {
    await verifyAdminSession();
    try {
      const { deleteAdminMessageTemplateServer } = await import('./admin.server');
      return await deleteAdminMessageTemplateServer(id);
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal menghapus template.' };
    }
  });

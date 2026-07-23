import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { eq, desc, sql, and } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { orders, products, users, credentials, auditLogs, categories, messageTemplates } from '../../db/schema';
import { getSessionUser } from './auth.server';
import { encrypt } from './crypto.server';
import { sendFulfillmentNotification, sendWhatsappNotification } from './notifications.server';

// Middlewares check for safety
function verifyAdminSession() {
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
  verifyAdminSession();

  try {
    // Query all stats and list concurrently in a single round-trip
    const [
      revenueRes,
      usersRes,
      pendingRes,
      totalOrdersRes,
      activeOrdersRes,
      unpaidOrdersRes,
      expiredOrdersRes,
      totalProductsRes,
      totalCategoriesRes,
      aovRes,
      recentOrders
    ] = await Promise.all([
      db
        .select({ total: sql<number>`COALESCE(SUM(${orders.price}), 0)` })
        .from(orders)
        .where(sql`${orders.status} IN ('aktif', 'expired', 'menunggu_aktivasi')`),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(eq(users.role, 'customer')),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(eq(orders.status, 'menunggu_aktivasi')),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(eq(orders.status, 'aktif')),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(eq(orders.status, 'menunggu_pembayaran')),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(eq(orders.status, 'expired')),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(categories),
      db
        .select({ avg: sql<number>`COALESCE(AVG(${orders.price}), 0)` })
        .from(orders)
        .where(sql`${orders.status} IN ('aktif', 'expired', 'menunggu_aktivasi')`),
      db
        .select({
          id: orders.id,
          status: orders.status,
          price: orders.price,
          parentOrderId: orders.parentOrderId,
          createdAt: orders.createdAt,
          productName: products.name,
          customerName: users.name,
          customerEmail: users.email,
        })
        .from(orders)
        .innerJoin(products, eq(orders.productId, products.id))
        .innerJoin(users, eq(orders.userId, users.id))
        .orderBy(desc(orders.createdAt))
        .limit(5)
    ]);

    return {
      success: true,
      stats: {
        totalRevenue: revenueRes[0]?.total || 0,
        totalCustomers: usersRes[0]?.count || 0,
        pendingActivations: pendingRes[0]?.count || 0,
        totalOrders: totalOrdersRes[0]?.count || 0,
        activeOrders: activeOrdersRes[0]?.count || 0,
        unpaidOrders: unpaidOrdersRes[0]?.count || 0,
        expiredOrders: expiredOrdersRes[0]?.count || 0,
        totalProducts: totalProductsRes[0]?.count || 0,
        totalCategories: totalCategoriesRes[0]?.count || 0,
        averageOrderValue: Math.round(aovRes[0]?.avg || 0),
        recentOrders,
      },
      recentOrders,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat statistik.' };
  }
});

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
  verifyAdminSession();

  try {
    const list = await db.select().from(products).orderBy(desc(products.createdAt));
    return { success: true, products: list };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
});

/**
 * Helper to upload Base64 image to RustFS (S3-compatible) storage.
 */
async function uploadBase64Image(base64Str: string): Promise<string> {
  const match = base64Str.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Format gambar base64 tidak valid.');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  const fileExt = mimeType.split('/')[1] || 'png';
  const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;

  const endpoint = process.env.RUSTFS_ENDPOINT;
  const accessKey = process.env.RUSTFS_ACCESS_KEY;
  const secretKey = process.env.RUSTFS_SECRET_KEY;
  const bucket = process.env.RUSTFS_BUCKET;

  if (!endpoint || !accessKey || !secretKey || !bucket) {
    throw new Error('Kredensial RustFS tidak lengkap di file konfigurasi .env.');
  }

  const s3Client = new S3Client({
    endpoint,
    region: 'ap-southeast-1',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${endpoint}/${bucket}/${fileName}`;
}

/**
 * Server function to create a product.
 */
export const createAdminProduct = createServerFn({ method: 'POST' })
  .validator((data: unknown) => productInputSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = verifyAdminSession();

    try {
      let finalImageUrl = data.imageUrl;
      if (data.imageUrl && data.imageUrl.startsWith('data:image/')) {
        finalImageUrl = await uploadBase64Image(data.imageUrl);
      }

      const [newProduct] = await db
        .insert(products)
        .values({
          ...data,
          imageUrl: finalImageUrl,
          isActive: true,
        })
        .returning();

      // Log action
      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'CREATE_PRODUCT',
        details: `Membuat produk ${data.name}`,
      });

      return { success: true, product: newProduct };
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
    const admin = verifyAdminSession();

    try {
      let finalImageUrl = data.product.imageUrl;
      if (data.product.imageUrl && data.product.imageUrl.startsWith('data:image/')) {
        finalImageUrl = await uploadBase64Image(data.product.imageUrl);
      }

      const [updated] = await db
        .update(products)
        .set({
          ...data.product,
          imageUrl: finalImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(products.id, data.id))
        .returning();

      // Log action
      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'UPDATE_PRODUCT',
        details: `Memperbarui produk ${data.product.name}`,
      });

      return { success: true, product: updated };
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
    const admin = verifyAdminSession();

    try {
      await db
        .update(products)
        .set({ isActive: data.isActive, updatedAt: new Date() })
        .where(eq(products.id, data.id));

      return { success: true };
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
    const admin = verifyAdminSession();

    try {
      await db.delete(products).where(eq(products.id, id));

      // Log action
      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'DELETE_PRODUCT',
        details: `Menghapus produk ID: ${id}`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch all orders for admin management.
 */
export const getAdminOrders = createServerFn({ method: 'GET' }).handler(async () => {
  verifyAdminSession();

  try {
    const list = await db
      .select({
        id: orders.id,
        status: orders.status,
        price: orders.price,
        paymentMethod: orders.paymentMethod,
        remainingDuration: orders.remainingDuration,
        parentOrderId: orders.parentOrderId,
        createdAt: orders.createdAt,
        productName: products.name,
        customerName: users.name,
        customerEmail: users.email,
        customerWhatsapp: users.whatsapp,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    return { success: true, orders: list };
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
 * Saves encrypted credentials and flips status to 'aktif'.
 */
export const fulfillOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => fulfillOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const admin = verifyAdminSession();
    const { orderId, email, password, remarks } = data;

    try {
      // 1. Verify order exists with user/product info for notification dispatch
      const [order] = await db
        .select({
          id: orders.id,
          customerName: users.name,
          customerEmail: users.email,
          customerWhatsapp: users.whatsapp,
          productName: products.name,
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id))
        .innerJoin(products, eq(orders.productId, products.id))
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      // 2. Encrypt credentials
      const encryptedEmail = encrypt(email);
      const encryptedPassword = encrypt(password);

      // 3. Perform database operations atomically in a transaction
      await db.transaction(async (tx) => {
        // Insert or update credentials
        await tx
          .insert(credentials)
          .values({
            orderId,
            encryptedAccountEmail: encryptedEmail,
            encryptedAccountPassword: encryptedPassword,
            remarks,
            sentAt: new Date(),
          })
          .onConflictDoUpdate({
            target: credentials.orderId,
            set: {
              encryptedAccountEmail: encryptedEmail,
              encryptedAccountPassword: encryptedPassword,
              remarks,
              sentAt: new Date(),
              updatedAt: new Date(),
            },
          });

        // Update order status to 'aktif'
        await tx
          .update(orders)
          .set({ status: 'aktif', updatedAt: new Date() })
          .where(eq(orders.id, orderId));

        // Log audit action
        await tx.insert(auditLogs).values({
          userId: admin.userId,
          action: 'FULFILL_ORDER',
          details: `Mengaktifkan layanan untuk pesanan ${orderId}`,
        });
      });

      // 6. Dispatch real/simulated notifications - isolated to prevent external provider issues from rollback
      try {
        await sendFulfillmentNotification({
          toEmail: order.customerEmail,
          toWhatsapp: order.customerWhatsapp,
          customerName: order.customerName,
          productName: order.productName,
          accountEmail: email,
          accountPassword: password,
          remarks,
          orderId: order.id,
        });
      } catch (notifError: any) {
        console.error('[Notification Dispatch Failure]', notifError);
        // Returns success as database commits completed, with warning about notification failure
        return { success: true, notificationWarning: 'Aktivasi berhasil, namun gagal mengirimkan notifikasi WA/Email.' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal memproses aktivasi.' };
    }
  });

/**
 * Server function to fetch all registered users for admin management.
 */
export const getAdminUsers = createServerFn({ method: 'GET' }).handler(async () => {
  verifyAdminSession();

  try {
    const list = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        whatsapp: users.whatsapp,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return { success: true, users: list };
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
    const admin = verifyAdminSession();
    const { name, email, password, whatsapp, role } = data;

    try {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        throw new Error('Email sudah terdaftar di sistem.');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [inserted] = await db
        .insert(users)
        .values({
          name,
          email,
          whatsapp,
          role,
          passwordHash,
        })
        .returning({ id: users.id });

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'CREATE_USER_MANUAL',
        details: `Membuat user manual: ${name} (${email}) dengan role ${role}`,
      });

      return { success: true, userId: inserted?.id };
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
    const admin = verifyAdminSession();
    const { id, name, email, whatsapp, role, password } = data;

    try {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), sql`${users.id} != ${id}`))
        .limit(1);

      if (existingUser) {
        throw new Error('Email sudah digunakan oleh user lain.');
      }

      const updateData: Record<string, any> = {
        name,
        email,
        whatsapp,
        role,
        updatedAt: new Date(),
      };

      if (password && password.trim().length >= 6) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id));

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'UPDATE_USER_MANUAL',
        details: `Mengedit user manual: ${name} (${email})`,
      });

      return { success: true };
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
    const admin = verifyAdminSession();

    if (admin.userId === userId) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri.');
    }

    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User tidak ditemukan.');
      }

      await db.delete(users).where(eq(users.id, userId));

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'DELETE_USER_MANUAL',
        details: `Menghapus user: ${user.name} (${user.email})`,
      });

      return { success: true };
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
    const admin = verifyAdminSession();

    try {
      await db
        .update(users)
        .set({ isActive: data.isActive, updatedAt: new Date() })
        .where(eq(users.id, data.id));

      // Log action
      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: data.isActive ? 'ACTIVATE_USER' : 'BLOCK_USER',
        details: `Mengubah status aktif user ID: ${data.id} menjadi ${data.isActive}`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch finance report data.
 */
export const getFinanceReport = createServerFn({ method: 'GET' }).handler(async () => {
  verifyAdminSession();

  try {
    const list = await db
      .select({
        id: orders.id,
        price: orders.price,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
        productName: products.name,
        customerName: users.name,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .where(sql`${orders.status} IN ('aktif', 'expired', 'menunggu_aktivasi')`)
      .orderBy(desc(orders.createdAt));

    return { success: true, report: list };
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
  verifyAdminSession();
  try {
    let list = await db.select().from(categories).orderBy(desc(categories.createdAt));
    if (list.length === 0) {
      const defaults = [
        { name: 'AI Tools', description: 'Kategori layanan kecerdasan buatan dan produktivitas' },
        { name: 'Design', description: 'Kategori layanan desain grafis dan aset visual' },
        { name: 'Streaming', description: 'Kategori layanan menonton film, video, dan musik online' },
        { name: 'Server/VPS', description: 'Kategori penyewaan server private virtual dan hosting' },
        { name: 'SaaS Subscriptions', description: 'Kategori langganan aplikasi web berbasis awan' },
      ];
      await db.insert(categories).values(defaults);
      list = await db.select().from(categories).orderBy(desc(categories.createdAt));
    }
    return { success: true, categories: list };
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
    const admin = verifyAdminSession();
    try {
      const [newCategory] = await db
        .insert(categories)
        .values({
          name: data.name.trim(),
          description: data.description?.trim() || null,
        })
        .returning();

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'CREATE_CATEGORY',
        details: `Membuat kategori ${data.name}`,
      });

      return { success: true, category: newCategory };
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
    const admin = verifyAdminSession();
    try {
      const [updated] = await db
        .update(categories)
        .set({
          name: data.category.name.trim(),
          description: data.category.description?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, data.id))
        .returning();

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'UPDATE_CATEGORY',
        details: `Memperbarui kategori ${data.category.name}`,
      });

      return { success: true, category: updated };
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
    const admin = verifyAdminSession();
    try {
      // 1. Get the category details
      const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
      if (!category) {
        throw new Error('Kategori tidak ditemukan.');
      }

      // 2. Check if there are products using this category name
      const productsUsingCategory = await db
        .select()
        .from(products)
        .where(eq(products.category, category.name))
        .limit(1);

      if (productsUsingCategory.length > 0) {
        throw new Error(`Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh produk.`);
      }

      // 3. Delete the category
      await db.delete(categories).where(eq(categories.id, id));

      // Log action
      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'DELETE_CATEGORY',
        details: `Menghapus kategori ${category.name}`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to cancel an order.
 * Updates order status to 'expired' and logs the action.
 */
export const cancelAdminOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    const admin = verifyAdminSession();
    console.log("CANCEL_ADMIN_ORDER - raw orderId:", orderId, "type:", typeof orderId);
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) {
        console.log("CANCEL_ADMIN_ORDER - Order not found for ID:", orderId);
        throw new Error('Pesanan tidak ditemukan.');
      }

      await db
        .update(orders)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'CANCEL_ORDER',
        details: `Membatalkan pesanan ${orderId}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error("CANCEL_ADMIN_ORDER error:", error);
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to delete an order.
 * Deletes from orders table (cascades credentials automatically) and logs the action.
 */
export const deleteAdminOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    const admin = verifyAdminSession();
    console.log("DELETE_ADMIN_ORDER - raw orderId:", orderId, "type:", typeof orderId);
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) {
        console.log("DELETE_ADMIN_ORDER - Order not found for ID:", orderId);
        throw new Error('Pesanan tidak ditemukan.');
      }

      await db.delete(orders).where(eq(orders.id, orderId));

      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'DELETE_ORDER',
        details: `Menghapus pesanan ${orderId}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error("DELETE_ADMIN_ORDER error:", error);
      return { success: false, error: error?.message };
    }
  });

/**
 * Server function to fetch all orders with full customer and product info for reports.
 */
export const getAdminReports = createServerFn({ method: 'GET' }).handler(async () => {
  verifyAdminSession();

  try {
    const list = await db
      .select({
        id: orders.id,
        status: orders.status,
        price: orders.price,
        paymentMethod: orders.paymentMethod,
        remainingDuration: orders.remainingDuration,
        parentOrderId: orders.parentOrderId,
        createdAt: orders.createdAt,
        productName: products.name,
        productCategory: products.category,
        customerName: users.name,
        customerEmail: users.email,
        customerWhatsapp: users.whatsapp,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    return { success: true, orders: list };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat data laporan.' };
  }
});

/**
 * Server function to confirm/activate a renewal order.
 * Updates parent order remaining duration and status, and sets the renewal order status to active.
 */
export const confirmRenewal = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: orderId }) => {
    const admin = verifyAdminSession();
    try {
      // 1. Fetch renewal order
      const [renewalOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!renewalOrder) {
        throw new Error('Pesanan tidak ditemukan.');
      }

      if (!renewalOrder.parentOrderId) {
        throw new Error('Pesanan ini bukan bertipe perpanjangan.');
      }

      // 2. Fetch parent order
      const [parentOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, renewalOrder.parentOrderId))
        .limit(1);

      if (!parentOrder) {
        throw new Error('Pesanan utama tidak ditemukan.');
      }

      // 3. Update both orders and audit logs atomically in a transaction
      await db.transaction(async (tx) => {
        const newDuration = parentOrder.remainingDuration + renewalOrder.remainingDuration;

        // Update parent order: add duration and set status to active
        await tx
          .update(orders)
          .set({
            remainingDuration: newDuration,
            status: 'aktif',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, parentOrder.id));

        // Update renewal order: status to active
        await tx
          .update(orders)
          .set({
            status: 'aktif',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, renewalOrder.id));

        // Add audit log
        await tx.insert(auditLogs).values({
          userId: admin.userId,
          action: 'CONFIRM_RENEWAL',
          details: `Mengonfirmasi perpanjangan masa aktif +${renewalOrder.remainingDuration} bulan untuk pesanan utama ${parentOrder.id}`,
        });
      });

      return { success: true };
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
    verifyAdminSession();
    try {
      await sendWhatsappNotification(data.whatsapp, data.message);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

/**
 * Server functions to manage message templates
 */
export const getAdminMessageTemplates = createServerFn({ method: 'GET' }).handler(async () => {
  verifyAdminSession();
  try {
    let list = await db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));

    // Seed default templates if database is empty
    if (list.length === 0) {
      const defaults = [
        {
          name: 'Notifikasi Pembayaran Sukses',
          code: 'payment_success',
          content: 'Halo {customerName},\n\nPembayaran untuk pesanan {orderId} ({productName}) telah berhasil kami terima.\n\nPesanan Anda sedang diproses oleh admin. Silakan tunggu notifikasi aktivasi berikutnya.\n\nTerima kasih!',
        },
        {
          name: 'Notifikasi Aktivasi / Fulfillment Sukses',
          code: 'fulfillment_success',
          content: 'Halo {customerName},\n\nKabar gembira! Pesanan Anda dengan ID {orderId} ({productName}) telah aktif.\n\nDetail akun login premium Anda dikirimkan secara manual oleh admin di chat ini atau email terpisah demi keamanan.\n\nTerima kasih atas pembelian Anda!',
        },
      ];

      for (const t of defaults) {
        await db.insert(messageTemplates).values({
          name: t.name,
          code: t.code,
          content: t.content,
        });
      }

      list = await db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));
    }

    return { success: true, templates: list };
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
    verifyAdminSession();
    const { id, name, code, content } = data;

    try {
      if (id) {
        // Update
        await db
          .update(messageTemplates)
          .set({ name, code, content, updatedAt: new Date() })
          .where(eq(messageTemplates.id, id));
      } else {
        // Create new
        await db.insert(messageTemplates).values({ name, code, content });
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal menyimpan template.' };
    }
  });

export const deleteAdminMessageTemplate = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.string().parse(data))
  .handler(async ({ data: id }) => {
    verifyAdminSession();
    try {
      await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal menghapus template.' };
    }
  });

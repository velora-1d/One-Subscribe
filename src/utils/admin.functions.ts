import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { eq, desc, sql, and } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from '../../db';
import { orders, products, users, credentials, auditLogs, categories } from '../../db/schema';
import { getSessionUser } from './auth.server';
import { encrypt } from './crypto.server';
import { sendFulfillmentNotification } from './notifications.server';

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
    // 1. Total Revenue (sum of completed orders)
    const [revenueRes] = await db
      .select({ total: sql<number>`COALESCE(SUM(${orders.price}), 0)` })
      .from(orders)
      .where(sql`${orders.status} IN ('aktif', 'expired', 'menunggu_aktivasi')`);

    // 2. Total registered customers
    const [usersRes] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.role, 'customer'));

    // 3. Count of orders waiting for admin credentials activation
    const [pendingRes] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(eq(orders.status, 'menunggu_aktivasi'));

    // 4. Count of total orders
    const [totalOrdersRes] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders);

    // 5. Recent orders list
    const recentOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        price: orders.price,
        createdAt: orders.createdAt,
        productName: products.name,
        customerName: users.name,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return {
      success: true,
      stats: {
        totalRevenue: revenueRes.total,
        totalCustomers: usersRes.count,
        pendingActivations: pendingRes.count,
        totalOrders: totalOrdersRes.count,
        recentOrders,
      },
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal memuat statistik.' };
  }
});

// Product Schemas
const productInputSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  price: z.number().int().positive('Harga harus bernilai positif'),
  durationMonths: z.number().int().positive('Durasi harus bernilai positif'),
  category: z.string().min(1, 'Kategori harus diisi'),
  imageUrl: z.string().optional().nullable(),
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

      // 3. Insert or update credentials
      await db
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

      // 4. Update order status to 'aktif'
      await db
        .update(orders)
        .set({ status: 'aktif', updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // 5. Log audit action
      await db.insert(auditLogs).values({
        userId: admin.userId,
        action: 'FULFILL_ORDER',
        details: `Mengaktifkan layanan untuk pesanan ${orderId}`,
      });

      // 6. Dispatch real/simulated notifications
      await sendFulfillmentNotification({
        toEmail: order.customerEmail,
        toWhatsapp: order.customerWhatsapp,
        customerName: order.customerName,
        productName: order.productName,
        accountEmail: email,
        accountPassword: password,
        remarks,
      });

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
      .where(eq(users.role, 'customer'))
      .orderBy(desc(users.createdAt));

    return { success: true, users: list };
  } catch (error: any) {
    return { success: false, error: error?.message };
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

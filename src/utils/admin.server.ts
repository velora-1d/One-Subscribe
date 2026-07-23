import { eq, desc, sql, and, asc } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { orders, products, users, credentials, auditLogs, categories, messageTemplates } from '../../db/schema';
import { encrypt } from './crypto.server';
import { sendFulfillmentNotification, sendWhatsappNotification } from './notifications.server';

export async function uploadBase64Image(base64Str: string): Promise<string> {
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

export async function getAdminStatsServer() {
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
    error: null,
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
      avgOrderValue: Math.round(aovRes[0]?.avg || 0),
      recentOrders,
    },
    recentOrders,
  };
}

export async function getAdminProductsServer() {
  const list = await db.select().from(products).orderBy(asc(products.sortOrder), desc(products.createdAt));
  return { success: true, error: null, products: list };
}

export async function createAdminProductServer(data: any, adminUserId: string) {
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

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'CREATE_PRODUCT',
    details: `Membuat produk ${data.name}`,
  });

  return { success: true, error: null, product: newProduct };
}

export async function updateAdminProductServer(data: any, adminUserId: string) {
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

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'UPDATE_PRODUCT',
    details: `Memperbarui produk ${data.product.name}`,
  });

  return { success: true, error: null, product: updated };
}

export async function toggleProductStatusServer(data: any) {
  await db
    .update(products)
    .set({ isActive: data.isActive, updatedAt: new Date() })
    .where(eq(products.id, data.id));

  return { success: true, error: null };
}

export async function deleteAdminProductServer(id: string, adminUserId: string) {
  await db.delete(products).where(eq(products.id, id));

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'DELETE_PRODUCT',
    details: `Menghapus produk ID: ${id}`,
  });

  return { success: true, error: null };
}

export async function getAdminOrdersServer() {
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

  return { success: true, error: null, orders: list };
}

export async function fulfillOrderServer(data: any, adminUserId: string) {
  const { orderId, email, password, remarks } = data;

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

  const encryptedEmail = encrypt(email);
  const encryptedPassword = encrypt(password);

  await db.transaction(async (tx) => {
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

    await tx
      .update(orders)
      .set({ status: 'aktif', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await tx.insert(auditLogs).values({
      userId: adminUserId,
      action: 'FULFILL_ORDER',
      details: `Mengaktifkan layanan untuk pesanan ${orderId}`,
    });
  });

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
    return { success: true, error: null, notificationWarning: 'Aktivasi berhasil, namun gagal mengirimkan notifikasi WA/Email.' };
  }

  return { success: true, error: null };
}

export async function getAdminUsersServer() {
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

  return { success: true, error: null, users: list };
}

export async function createAdminUserServer(data: any, adminUserId: string) {
  const { name, email, password, whatsapp, role } = data;

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
    userId: adminUserId,
    action: 'CREATE_USER_MANUAL',
    details: `Membuat user manual: ${name} (${email}) dengan role ${role}`,
  });

  return { success: true, error: null, userId: inserted?.id };
}

export async function updateAdminUserServer(data: any, adminUserId: string) {
  const { id, name, email, whatsapp, role, password } = data;

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
    userId: adminUserId,
    action: 'UPDATE_USER_MANUAL',
    details: `Mengedit user manual: ${name} (${email})`,
  });

  return { success: true, error: null };
}

export async function deleteAdminUserServer(userId: string, adminUserId: string) {
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
    userId: adminUserId,
    action: 'DELETE_USER_MANUAL',
    details: `Menghapus user: ${user.name} (${user.email})`,
  });

  return { success: true, error: null };
}

export async function toggleUserStatusServer(data: any, adminUserId: string) {
  await db
    .update(users)
    .set({ isActive: data.isActive, updatedAt: new Date() })
    .where(eq(users.id, data.id));

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: data.isActive ? 'ACTIVATE_USER' : 'BLOCK_USER',
    details: `Mengubah status aktif user ID: ${data.id} menjadi ${data.isActive}`,
  });

  return { success: true, error: null };
}

export async function getFinanceReportServer() {
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

  return { success: true, error: null, report: list };
}

export async function getAdminCategoriesServer() {
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
  return { success: true, error: null, categories: list };
}

export async function createAdminCategoryServer(data: any, adminUserId: string) {
  const [newCategory] = await db
    .insert(categories)
    .values({
      name: data.name.trim(),
      description: data.description?.trim() || null,
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'CREATE_CATEGORY',
    details: `Membuat kategori ${data.name}`,
  });

  return { success: true, error: null, category: newCategory };
}

export async function updateAdminCategoryServer(data: any, adminUserId: string) {
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
    userId: adminUserId,
    action: 'UPDATE_CATEGORY',
    details: `Memperbarui kategori ${data.category.name}`,
  });

  return { success: true, error: null, category: updated };
}

export async function deleteAdminCategoryServer(id: string, adminUserId: string) {
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category) {
    throw new Error('Kategori tidak ditemukan.');
  }

  const productsUsingCategory = await db
    .select()
    .from(products)
    .where(eq(products.category, category.name))
    .limit(1);

  if (productsUsingCategory.length > 0) {
    throw new Error(`Kategori "${category.name}" tidak dapat dihapus karena masih digunakan oleh produk.`);
  }

  await db.delete(categories).where(eq(categories.id, id));

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'DELETE_CATEGORY',
    details: `Menghapus kategori ${category.name}`,
  });

  return { success: true, error: null };
}

export async function cancelAdminOrderServer(orderId: string, adminUserId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  await db
    .update(orders)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'CANCEL_ORDER',
    details: `Membatalkan pesanan ${orderId}`,
  });

  return { success: true, error: null };
}

export async function deleteAdminOrderServer(orderId: string, adminUserId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) {
    throw new Error('Pesanan tidak ditemukan.');
  }

  await db.delete(orders).where(eq(orders.id, orderId));

  await db.insert(auditLogs).values({
    userId: adminUserId,
    action: 'DELETE_ORDER',
    details: `Menghapus pesanan ${orderId}`,
  });

  return { success: true, error: null };
}

export async function getAdminReportsServer() {
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

  return { success: true, error: null, orders: list };
}

export async function confirmRenewalServer(orderId: string, adminUserId: string) {
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

  const [parentOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, renewalOrder.parentOrderId))
    .limit(1);

  if (!parentOrder) {
    throw new Error('Pesanan utama tidak ditemukan.');
  }

  await db.transaction(async (tx) => {
    const newDuration = parentOrder.remainingDuration + renewalOrder.remainingDuration;

    await tx
      .update(orders)
      .set({
        remainingDuration: newDuration,
        status: 'aktif',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, parentOrder.id));

    await tx
      .update(orders)
      .set({
        status: 'aktif',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, renewalOrder.id));

    await tx.insert(auditLogs).values({
      userId: adminUserId,
      action: 'CONFIRM_RENEWAL',
      details: `Mengonfirmasi perpanjangan masa aktif +${renewalOrder.remainingDuration} bulan untuk pesanan utama ${parentOrder.id}`,
    });
  });

  return { success: true, error: null };
}

export async function sendCustomWhatsappServer(data: any) {
  await sendWhatsappNotification(data.whatsapp, data.message);
  return { success: true, error: null };
}

export async function getAdminMessageTemplatesServer() {
  let list = await db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));

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

  return { success: true, error: null, templates: list };
}

export async function saveAdminMessageTemplateServer(data: any) {
  const { id, name, code, content } = data;

  if (id) {
    await db
      .update(messageTemplates)
      .set({ name, code, content, updatedAt: new Date() })
      .where(eq(messageTemplates.id, id));
  } else {
    await db.insert(messageTemplates).values({ name, code, content });
  }
  return { success: true, error: null };
}

export async function deleteAdminMessageTemplateServer(id: string) {
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
  return { success: true, error: null };
}

export async function bulkUpdateProductStockServer(
  updates: { productId: string; adjustment: number }[],
  adminUserId: string
) {
  await db.transaction(async (tx) => {
    for (const update of updates) {
      if (update.adjustment === 0) continue;

      const [product] = await tx
        .select({ stock: products.stock, name: products.name })
        .from(products)
        .where(eq(products.id, update.productId))
        .limit(1);

      if (product) {
        const newStock = Math.max(0, product.stock + update.adjustment);
        await tx
          .update(products)
          .set({ stock: newStock, updatedAt: new Date() })
          .where(eq(products.id, update.productId));

        await tx.insert(auditLogs).values({
          userId: adminUserId,
          action: 'BULK_STOCK_UPDATE',
          details: `Update stok masal produk ${product.name}: ${product.stock} -> ${newStock} (Penyesuaian: ${update.adjustment >= 0 ? '+' : ''}${update.adjustment})`,
        });
      }
    }
  });
  return { success: true, error: null };
}

export async function updateProductsOrderServer(
  updates: { productId: string; sortOrder: number }[],
  adminUserId: string
) {
  await db.transaction(async (tx) => {
    for (const update of updates) {
      await tx
        .update(products)
        .set({ sortOrder: update.sortOrder, updatedAt: new Date() })
        .where(eq(products.id, update.productId));
    }

    await tx.insert(auditLogs).values({
      userId: adminUserId,
      action: 'UPDATE_PRODUCTS_ORDER',
      details: 'Mengubah urutan tampil katalog produk.',
    });
  });
  return { success: true, error: null };
}


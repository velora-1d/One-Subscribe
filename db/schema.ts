import { pgTable, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  whatsapp: text('whatsapp').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<'customer' | 'admin'>().default('customer').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // Price in IDR
  durationMonths: integer('duration_months').default(1).notNull(), // Default to 1 month subscription
  category: text('category').notNull(), // e.g. 'AI', 'Cloud', 'Server'
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(), // Custom ID format like 'ORD-XXXXXXXX'
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }).notNull(),
  status: text('status').$type<'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired'>().default('menunggu_pembayaran').notNull(),
  price: integer('price').notNull(),
  paymentMethod: text('payment_method').$type<'pakasir' | 'midtrans'>().notNull(),
  paymentRedirectUrl: text('payment_redirect_url'),
  paymentTransactionId: text('payment_transaction_id').unique(),
  remainingDuration: integer('remaining_duration').notNull(), // Sisa saldo durasi (dalam bulan / hari)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credentials Table (Encrypted login credentials for active subscriptions)
export const credentials = pgTable('credentials', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull().unique(),
  encryptedAccountEmail: text('encrypted_account_email').notNull(),
  encryptedAccountPassword: text('encrypted_account_password').notNull(),
  remarks: text('remarks'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit Logs Table (Activity history)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // e.g., 'UPDATE_ORDER_STATUS', 'BLOCK_USER'
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations Definitions
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  auditLogs: many(auditLogs),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  credential: one(credentials, {
    fields: [orders.id],
    references: [credentials.orderId],
  }),
}));

export const credentialsRelations = relations(credentials, ({ one }) => ({
  order: one(orders, {
    fields: [credentials.orderId],
    references: [orders.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

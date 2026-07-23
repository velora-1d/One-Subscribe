import { pgTable, text, timestamp, integer, boolean, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  whatsapp: text('whatsapp').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<'customer' | 'admin'>().default('customer').notNull(),
  pin: text('pin'), // PIN specifically for switching/simulation modes
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_role_idx').on(table.role),
  index('users_is_active_idx').on(table.isActive),
]);

// Products Table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // Price in IDR
  durationMonths: integer('duration_months').default(1).notNull(), // Default to 1 month subscription
  category: text('category').notNull(), // e.g. 'AI', 'Cloud', 'Server'
  imageUrl: text('image_url'),
  stock: integer('stock').default(0).notNull(), // Available stock/slots
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('products_category_idx').on(table.category),
  index('products_is_active_idx').on(table.isActive),
]);

// Promos Table
export const promos = pgTable('promos', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').unique(), // null if catalog discount
  discountType: text('discount_type').$type<'percentage' | 'fixed'>().notNull(),
  discountValue: integer('discount_value').notNull(),
  maxDiscountAmount: integer('max_discount_amount'), // for percentage discounts
  minDurationMonths: integer('min_duration_months').default(1).notNull(),
  isCatalogSlashed: boolean('is_catalog_slashed').default(false).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0).notNull(),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('promos_product_id_idx').on(table.productId),
  index('promos_is_active_idx').on(table.isActive),
]);

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
  parentOrderId: text('parent_order_id'),
  appliedPromoId: uuid('applied_promo_id').references(() => promos.id, { onDelete: 'set null' }),
  discountAmount: integer('discount_amount').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('orders_user_id_idx').on(table.userId),
  index('orders_product_id_idx').on(table.productId),
  index('orders_status_idx').on(table.status),
  index('orders_created_at_idx').on(table.createdAt),
  index('orders_parent_order_id_idx').on(table.parentOrderId),
]);

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
}, (table) => [
  index('audit_logs_user_id_idx').on(table.userId),
  index('audit_logs_created_at_idx').on(table.createdAt),
]);

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
  parentOrder: one(orders, {
    fields: [orders.parentOrderId],
    references: [orders.id],
  }),
  appliedPromo: one(promos, {
    fields: [orders.appliedPromoId],
    references: [promos.id],
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

export const promosRelations = relations(promos, ({ one, many }) => ({
  product: one(products, {
    fields: [promos.productId],
    references: [products.id],
  }),
  orders: many(orders),
}));

// Categories Table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

// System Settings Table
export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Message Templates Table
export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});



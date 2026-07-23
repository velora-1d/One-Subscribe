import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../db'
import { orders, credentials, users, products } from '../../db/schema'
import { eq, gt, and } from 'drizzle-orm'
import { sendExpirationNotification } from '../utils/notifications.server'

export const Route = createFileRoute('/api/cron/auto-deduct')({
  server: {
    handlers: {
      GET: async () => {
        return new Response(JSON.stringify({ message: 'Auto-Deduct Cron Endpoint Active' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
      POST: async ({ request }) => {
        try {
          // Verify authorization token
          const authHeader = request.headers.get('Authorization')
          const cronSecret = process.env.CRON_SECRET || 'local-cron-secret'
          if (authHeader !== `Bearer ${cronSecret}`) {
            return new Response(JSON.stringify({ error: 'Akses ditolak. Token otorisasi tidak valid.' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Fetch all currently active orders
          const activeOrders = await db
            .select({
              id: orders.id,
              remainingDuration: orders.remainingDuration,
              customerName: users.name,
              customerEmail: users.email,
              customerWhatsapp: users.whatsapp,
              productName: products.name,
            })
            .from(orders)
            .innerJoin(users, eq(orders.userId, users.id))
            .innerJoin(products, eq(orders.productId, products.id))
            .where(eq(orders.status, 'aktif'))

          let decrementedCount = 0
          let expiredCount = 0

          for (const order of activeOrders) {
            if (order.remainingDuration > 1) {
              // Decrement duration by 1 month
              const newDuration = order.remainingDuration - 1
              await db
                .update(orders)
                .set({ remainingDuration: newDuration, updatedAt: new Date() })
                .where(eq(orders.id, order.id))

              decrementedCount++

              // Dispatch expiration warning notification (e.g., warning 7 days or remaining duration alert)
              await sendExpirationNotification({
                toEmail: order.customerEmail,
                toWhatsapp: order.customerWhatsapp,
                customerName: order.customerName,
                productName: order.productName,
                daysRemaining: newDuration * 30, // rough simulation
              })
            } else {
              // Expiration reached (duration becomes 0) - run atomically
              await db.transaction(async (tx) => {
                await tx
                  .update(orders)
                  .set({ status: 'expired', remainingDuration: 0, updatedAt: new Date() })
                  .where(eq(orders.id, order.id))

                // Delete credentials from DB as safety precaution
                await tx.delete(credentials).where(eq(credentials.orderId, order.id))
              })

              expiredCount++

              // Send final expiration notice
              await sendExpirationNotification({
                toEmail: order.customerEmail,
                toWhatsapp: order.customerWhatsapp,
                customerName: order.customerName,
                productName: order.productName,
                daysRemaining: 0,
              })
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              processed: activeOrders.length,
              decremented: decrementedCount,
              expired: expiredCount,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})

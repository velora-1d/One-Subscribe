import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../db'
import { orders } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { triggerPaymentSuccessNotification } from '../utils/notifications.server'
import { deductProductStock } from '../utils/order.functions'

export const Route = createFileRoute('/api/webhooks/midtrans')({
  server: {
    handlers: {
      GET: async () => {
        return new Response('VeraPay Webhook Gateway Active')
      },
      POST: async ({ request }) => {
        try {
          const payload: any = await request.json()
          
          const orderId = payload.order_id || payload.orderId || payload.reference
          const transactionStatus = payload.transaction_status || payload.status
          const fraudStatus = payload.fraud_status

          if (orderId) {
            let status: 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired' = 'menunggu_pembayaran'
            const normStatus = String(transactionStatus || '').toLowerCase()

            if (
              normStatus === 'capture' ||
              normStatus === 'settlement' ||
              normStatus === 'paid' ||
              normStatus === 'completed' ||
              normStatus === 'success'
            ) {
              if (fraudStatus === 'challenge') {
                status = 'menunggu_pembayaran'
              } else {
                status = 'menunggu_aktivasi'
              }
            } else if (
              normStatus === 'deny' ||
              normStatus === 'cancel' ||
              normStatus === 'expire' ||
              normStatus === 'expired' ||
              normStatus === 'failed'
            ) {
              status = 'expired'
            }

            await db
              .update(orders)
              .set({ status, updatedAt: new Date() })
              .where(eq(orders.id, orderId))
              
            console.log(`[Webhook VeraPay/Legacy] Updated order ${orderId} status to ${status}`)

            if (status === 'menunggu_aktivasi') {
              await deductProductStock(orderId)
              await triggerPaymentSuccessNotification(orderId)
            }
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
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

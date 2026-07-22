import { createAPIFileRoute } from '@tanstack/react-start/api'
import { db } from '../../db'
import { orders } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { triggerPaymentSuccessNotification } from '../utils/notifications.server'

export const APIRoute = createAPIFileRoute('/api/webhooks/midtrans')({
  GET: async () => {
    return new Response('Midtrans Webhook Active')
  },
  POST: async ({ request }) => {
    try {
      const payload: any = await request.json()
      
      const orderId = payload.order_id
      const transactionStatus = payload.transaction_status
      const fraudStatus = payload.fraud_status

      if (orderId) {
        let status: 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired' = 'menunggu_pembayaran'

        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
          if (fraudStatus === 'challenge') {
            status = 'menunggu_pembayaran'
          } else {
            status = 'menunggu_aktivasi' // Paid, waiting for admin activation
          }
        } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
          status = 'expired'
        }

        await db
          .update(orders)
          .set({ status, updatedAt: new Date() })
          .where(eq(orders.id, orderId))
          
        console.log(`[Webhook Midtrans] Updated order ${orderId} status to ${status}`)

        if (status === 'menunggu_aktivasi') {
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
})

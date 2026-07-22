import { createAPIFileRoute } from '@tanstack/react-start/api'
import { db } from '../../db'
import { orders } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { triggerPaymentSuccessNotification } from '../utils/notifications.server'

export const APIRoute = createAPIFileRoute('/api/v1/callback/pakasir')({
  GET: async () => {
    return new Response('Pakasir Webhook Active')
  },
  POST: async ({ request }) => {
    try {
      const payload: any = await request.json()
      
      const reference = payload.reference || payload.order_id || payload.orderId
      const status = payload.status // PAID, EXPIRED

      if (reference) {
        let orderStatus: 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired' = 'menunggu_pembayaran'

        if (status === 'PAID') {
          orderStatus = 'menunggu_aktivasi' // Paid, waiting for admin activation
        } else if (status === 'EXPIRED') {
          orderStatus = 'expired'
        }

        await db
          .update(orders)
          .set({ status: orderStatus, updatedAt: new Date() })
          .where(eq(orders.id, reference))

        console.log(`[Webhook Pakasir] Updated order ${reference} status to ${orderStatus}`)

        if (orderStatus === 'menunggu_aktivasi') {
          await triggerPaymentSuccessNotification(reference)
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

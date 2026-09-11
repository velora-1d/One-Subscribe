import crypto from 'crypto'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../db'
import { orders, systemSettings } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { triggerPaymentSuccessNotification } from '../utils/notifications.server'
import { deductProductStock } from '../utils/order.functions'

export const Route = createFileRoute('/api/v1/callback/verapay')({
  server: {
    handlers: {
      GET: async () => {
        return new Response('VeraPay Webhook Active')
      },
      POST: async ({ request }) => {
        try {
          // Verify callback authorization header / signature
          const authHeader = request.headers.get('authorization') || request.headers.get('x-api-key') || request.headers.get('x-callback-token') || ''
          const token = authHeader.replace(/^Bearer\s+/i, '').trim()

          const [settingKey] = await db
            .select()
            .from(systemSettings)
            .where(eq(systemSettings.key, 'verapay_api_key'))
            .limit(1)

          const expectedToken = settingKey?.value || process.env.VERAPAY_API_KEY || process.env.VERAPAY_CALLBACK_SECRET

          if (expectedToken) {
            const tokenBuf = Buffer.from(token)
            const expectedBuf = Buffer.from(expectedToken)
            if (tokenBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
              return new Response(JSON.stringify({ error: 'Unauthorized callback: Token verifikasi tidak sah.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              })
            }
          }

          const payload: any = await request.json()
          
          const orderId = payload.order_id || payload.orderId || payload.reference
          const status = payload.status || payload.transaction_status

          if (orderId) {
            let orderStatus: 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired' = 'menunggu_pembayaran'

            const normalizedStatus = String(status || '').toLowerCase()
            if (
              normalizedStatus === 'paid' ||
              normalizedStatus === 'completed' ||
              normalizedStatus === 'success' ||
              normalizedStatus === 'settlement' ||
              normalizedStatus === 'capture'
            ) {
              orderStatus = 'menunggu_aktivasi' // Paid, waiting for admin activation
            } else if (
              normalizedStatus === 'expired' ||
              normalizedStatus === 'failed' ||
              normalizedStatus === 'deny' ||
              normalizedStatus === 'cancel'
            ) {
              orderStatus = 'expired'
            }

            await db
              .update(orders)
              .set({ status: orderStatus, updatedAt: new Date() })
              .where(eq(orders.id, orderId))

            console.log(`[Webhook VeraPay] Updated order ${orderId} status to ${orderStatus}`)

            if (orderStatus === 'menunggu_aktivasi') {
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

import crypto from 'crypto'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../db'
import { orders, systemSettings } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { triggerPaymentSuccessNotification } from '../utils/notifications.server'
import { deductProductStock } from '../utils/order.functions'

export const Route = createFileRoute('/api/v1/callback/pakasir')({
  server: {
    handlers: {
      GET: async () => {
        return new Response('Pakasir Webhook Active')
      },
      POST: async ({ request }) => {
        try {
          // Verify callback authorization header / token
          const authHeader = request.headers.get('authorization') || request.headers.get('x-pakasir-token') || request.headers.get('x-callback-token') || ''
          const token = authHeader.replace(/^Bearer\s+/i, '').trim()

          const [settingKey] = await db
            .select()
            .from(systemSettings)
            .where(eq(systemSettings.key, 'pakasir_api_key'))
            .limit(1)

          const expectedToken = settingKey?.value || process.env.PAKASIR_API_KEY || process.env.PAKASIR_CALLBACK_TOKEN

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
          
          const reference = payload.reference || payload.order_id || payload.orderId
          const status = payload.status // PAID, completed, EXPIRED

          if (reference) {
            let orderStatus: 'menunggu_pembayaran' | 'menunggu_aktivasi' | 'aktif' | 'expired' = 'menunggu_pembayaran'

            const normalizedStatus = String(status || '').toUpperCase()
            if (normalizedStatus === 'PAID' || normalizedStatus === 'COMPLETED' || normalizedStatus === 'SUCCESS') {
              orderStatus = 'menunggu_aktivasi' // Paid, waiting for admin activation
            } else if (normalizedStatus === 'EXPIRED' || normalizedStatus === 'FAILED') {
              orderStatus = 'expired'
            }

            await db
              .update(orders)
              .set({ status: orderStatus, updatedAt: new Date() })
              .where(eq(orders.id, reference))

            console.log(`[Webhook Pakasir] Updated order ${reference} status to ${orderStatus}`)

            if (orderStatus === 'menunggu_aktivasi') {
              await deductProductStock(reference)
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
    },
  },
})

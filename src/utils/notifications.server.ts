import nodemailer from 'nodemailer'
import { db } from '../../db'
import { systemSettings, orders, products, users, messageTemplates } from '../../db/schema'
import { eq } from 'drizzle-orm'

async function sendEmail({
  to,
  subject,
  html,
  settingsRecord,
}: {
  to: string
  subject: string
  html: string
  settingsRecord: Record<string, string>
}) {
  const emailProvider = settingsRecord['email_provider'] || process.env.EMAIL_PROVIDER || 'resend'

  if (emailProvider.toLowerCase() === 'smtp') {
    const host = settingsRecord['smtp_host'] || process.env.SMTP_HOST || 'smtp.sumopod.com'
    const portStr = settingsRecord['smtp_port'] || process.env.SMTP_PORT || '465'
    const port = parseInt(portStr.toString(), 10) || 465
    const secureVal = settingsRecord['smtp_secure'] || process.env.SMTP_SECURE || 'true'
    const secure = secureVal === 'true' || secureVal === 'True'
    const user = settingsRecord['smtp_user'] || process.env.SMTP_USER || 'cmrwb114r5zlfr208z53dy1vi'
    const pass = settingsRecord['smtp_pass'] || process.env.SMTP_PASS || 'ZLXzytPQcNQhTUEI8mze5Dhm1GxxupSd'
    const fromEmail = settingsRecord['sender_email'] || process.env.SENDER_EMAIL || 'OneSubscribe <noreply@onesubscribe.com>'

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      })

      const info = await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      })

      console.log('[NOTIFICATION EMAIL SMTP] Sent successfully:', info.messageId)
    } catch (err) {
      console.error('[NOTIFICATION EMAIL SMTP] Failed to send email via SMTP:', err)
    }
  } else {
    // Fallback/Default to Resend
    const RESEND_API_KEY = settingsRecord['resend_api_key'] || process.env.RESEND_API_KEY
    const SENDER_EMAIL = settingsRecord['sender_email'] || process.env.SENDER_EMAIL || 'onboarding@resend.dev'

    if (RESEND_API_KEY && to) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: SENDER_EMAIL.includes('<') ? SENDER_EMAIL : `OneSubscribe <${SENDER_EMAIL}>`,
            to: [to],
            subject,
            html,
          }),
        })
        const result = await response.json()
        console.log('[NOTIFICATION EMAIL RESEND] Resend response:', result)
      } catch (err) {
        console.error('[NOTIFICATION EMAIL RESEND] Failed to send email via Resend:', err)
      }
    } else {
      console.log('[NOTIFICATION EMAIL SIMULATED] No Resend key found. HTML output generated in console.')
    }
  }
}

interface SendNotifParams {
  toEmail: string
  toWhatsapp: string
  customerName: string
  productName: string
  accountEmail?: string
  accountPassword?: string
  remarks?: string
  orderId?: string
}

/**
 * Sends a message via the active WhatsApp provider (Fonnte or Evolution API)
 */
export async function sendWhatsappNotification(to: string, message: string) {
  let provider = 'fonnte';
  try {
    const [waSetting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'active_wa_gateway'))
      .limit(1);
    
    if (waSetting?.value) {
      provider = waSetting.value.toLowerCase();
    } else {
      provider = (process.env.WA_PROVIDER || 'fonnte').toLowerCase();
    }
  } catch (err) {
    console.error('[NOTIFICATION WA] Failed to fetch active WA gateway from settings:', err);
    provider = (process.env.WA_PROVIDER || 'fonnte').toLowerCase();
  }
  
  if (provider === 'evolution') {
    const EVO_API_URL = process.env.EVO_API_URL
    const EVO_API_KEY = process.env.EVO_API_KEY
    const EVO_INSTANCE = process.env.EVO_INSTANCE
    
    if (!EVO_API_URL || !EVO_API_KEY || !EVO_INSTANCE) {
      console.warn('[NOTIFICATION WA] Evolution API config missing in env.')
      return
    }

    const cleanUrl = EVO_API_URL.endsWith('/') ? EVO_API_URL.slice(0, -1) : EVO_API_URL
    const endpoint = `${cleanUrl}/message/sendText/${EVO_INSTANCE}`

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVO_API_KEY,
        },
        body: JSON.stringify({
          number: to,
          text: message,
        }),
      })
      const result = await response.json()
      console.log('[NOTIFICATION WA] Evolution API response:', result)
    } catch (err) {
      console.error('[NOTIFICATION WA] Failed to send WA via Evolution API:', err)
    }
  } else {
    // Default to Fonnte
    const FONNTE_TOKEN = process.env.FONNTE_TOKEN
    const FONNTE_API_URL = process.env.FONNTE_API_URL || 'https://api.fonnte.com/send'

    if (!FONNTE_TOKEN) {
      console.warn('[NOTIFICATION WA] Fonnte token missing in env.')
      return
    }

    try {
      const response = await fetch(FONNTE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: FONNTE_TOKEN,
        },
        body: new URLSearchParams({
          target: to,
          message: message,
        }),
      })
      const result = await response.json()
      console.log('[NOTIFICATION WA] Fonnte response:', result)
    } catch (err) {
      console.error('[NOTIFICATION WA] Failed to send WA via Fonnte:', err)
    }
  }
}

/**
 * Sends a notification message to user via WA Provider (WhatsApp) and Email when payment is successful
 */
export async function triggerPaymentSuccessNotification(orderId: string) {
  try {
    const [order] = await db
      .select({
        id: orders.id,
        customerName: users.name,
        customerWhatsapp: users.whatsapp,
        customerEmail: users.email,
        productName: products.name,
        price: orders.price,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      console.warn(`[NOTIFICATION] Order not found for notification trigger: ${orderId}`);
      return;
    }

    // Fetch configurations from systemSettings
    const settingsList = await db.select().from(systemSettings);
    const settingsRecord: Record<string, string> = {};
    settingsList.forEach(setting => {
      settingsRecord[setting.key] = setting.value;
    });

    // Fetch payment success message template
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.code, 'payment_success'))
      .limit(1);

    let messageText = '';
    if (template) {
      messageText = template.content
        .replaceAll('{customerName}', order.customerName)
        .replaceAll('{productName}', order.productName)
        .replaceAll('{orderId}', order.id)
        .replaceAll('{price}', `Rp ${order.price.toLocaleString('id-ID')}`);
    } else {
      messageText = `Halo *${order.customerName}*,\n\nPembelian & pembayaran untuk pesanan *${order.id}* (${order.productName}) sebesar *Rp ${order.price.toLocaleString('id-ID')}* telah berhasil kami terima! 🎉\n\nStatus pesanan Anda saat ini: *Sedang Diproses*.\nMohon ditunggu, admin kami sedang memproses pesanan Anda dan akan segera dikirimkan secara manual.\n\nTerima kasih telah berlangganan di OneSubscribe!`;
    }

    // 1. Send WhatsApp
    if (order.customerWhatsapp) {
      await sendWhatsappNotification(order.customerWhatsapp, messageText)
    } else {
      console.log('[NOTIFICATION WA SIMULATED] No WA target provided for success notification. Text:\n', messageText)
    }

    // 2. Send Email
    if (order.customerEmail) {
      const emailHtmlText = messageText.replace(/\n/g, '<br />');
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4fba7b;">Pembayaran Berhasil!</h2>
          <p>${emailHtmlText}</p>
          <p style="font-size: 12px; color: #a0aec0; margin-top: 40px;">Tim OneSubscribe</p>
        </div>
      `
      await sendEmail({
        to: order.customerEmail,
        subject: `Pembayaran Berhasil & Sedang Diproses: ${order.productName}`,
        html: emailHtml,
        settingsRecord,
      })
    }
  } catch (err) {
    console.error(`[NOTIFICATION] Error triggering payment success notification for order ${orderId}:`, err);
  }
}


/**
 * Sends a notification message to user via Resend (Email) and the active WA Provider (WhatsApp)
 */
export async function sendFulfillmentNotification({
  toEmail,
  toWhatsapp,
  customerName,
  productName,
  accountEmail: _accountEmail,
  accountPassword: _accountPassword,
  remarks,
  orderId,
}: SendNotifParams) {
  // Fetch configurations from systemSettings
  const settingsList = await db.select().from(systemSettings);
  const settingsRecord: Record<string, string> = {};
  settingsList.forEach(setting => {
    settingsRecord[setting.key] = setting.value;
  });

  // Fetch active notification message template
  const [template] = await db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.code, 'fulfillment_success'))
    .limit(1);

  let messageText = '';
  if (template) {
    messageText = template.content
      .replaceAll('{customerName}', customerName)
      .replaceAll('{productName}', productName)
      .replaceAll('{orderId}', orderId || '')
      .replaceAll('{remarks}', remarks || '');
  } else {
    messageText = `Halo ${customerName},\n\nLayanan langganan premium Anda *${productName}* telah diaktifkan! 🎉\n\nDetail akun dikirimkan secara manual oleh admin.\n${remarks ? `- Catatan: ${remarks}\n` : ''}\nTerima kasih telah berlangganan di OneSubscribe!`;
  }

  // 1. Dispatch WhatsApp (Unified)
  if (toWhatsapp) {
    await sendWhatsappNotification(toWhatsapp, messageText)
  } else {
    console.log('[NOTIFICATION WA SIMULATED] No WA target provided. Text:\n', messageText)
  }

  // 2. Dispatch Email (Resend or SMTP)
  if (toEmail) {
    const emailHtmlText = messageText.replace(/\n/g, '<br />');
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4fba7b;">Layanan Aktif!</h2>
        <p>${emailHtmlText}</p>
        <p style="font-size: 12px; color: #a0aec0; margin-top: 40px;">Tim OneSubscribe</p>
      </div>
    `
    await sendEmail({
      to: toEmail,
      subject: `Aktivasi Akun Premium: ${productName}`,
      html: emailHtml,
      settingsRecord,
    })
  }
}

/**
 * Sends a notification warning for subscription warning / expiry
 */
export async function sendExpirationNotification({
  toEmail,
  toWhatsapp,
  customerName,
  productName,
  daysRemaining,
}: {
  toEmail: string
  toWhatsapp: string
  customerName: string
  productName: string
  daysRemaining: number
}) {
  // Fetch configurations from systemSettings
  const settingsList = await db.select().from(systemSettings);
  const settingsRecord: Record<string, string> = {};
  settingsList.forEach(setting => {
    settingsRecord[setting.key] = setting.value;
  });

  const messageText = `Halo ${customerName},\n\nLangganan premium *${productName}* Anda akan habis dalam *${daysRemaining} hari*. Jangan lupa perpanjang layanan Anda agar tidak terputus!\n\nOneSubscribe`

  // Send WhatsApp (Unified)
  if (toWhatsapp) {
    await sendWhatsappNotification(toWhatsapp, messageText)
  } else {
    console.log('[NOTIFICATION EXP WA SIMULATED]', messageText)
  }

  // Send Email (Resend or SMTP)
  if (toEmail) {
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #dd6b20;">Langganan Segera Berakhir</h2>
        <p>Halo <strong>${customerName}</strong>,</p>
        <p>Layanan premium <strong>${productName}</strong> Anda akan habis masa aktifnya dalam waktu <strong>${daysRemaining} hari</strong>.</p>
        <p>Silakan kunjungi dashboard Anda untuk memperpanjang langganan agar akses premium Anda tetap berjalan tanpa gangguan.</p>
        <p style="font-size: 12px; color: #a0aec0; margin-top: 40px;">Tim OneSubscribe</p>
      </div>
    `
    await sendEmail({
      to: toEmail,
      subject: `Peringatan: Langganan ${productName} Hampir Habis!`,
      html: emailHtml,
      settingsRecord,
    })
  }
}

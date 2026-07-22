import { db } from '../../db'
import { systemSettings } from '../../db/schema'
import { eq } from 'drizzle-orm'


interface SendNotifParams {
  toEmail: string
  toWhatsapp: string
  customerName: string
  productName: string
  accountEmail?: string
  accountPassword?: string
  remarks?: string
}

/**
 * Sends a notification message to user via Resend (Email) and Fonnte (WhatsApp)
 */
export async function sendFulfillmentNotification({
  toEmail,
  toWhatsapp,
  customerName,
  productName,
  accountEmail,
  accountPassword,
  remarks,
}: SendNotifParams) {
  // Fetch configurations from systemSettings
  const settingsList = await db.select().from(systemSettings);
  const settingsRecord: Record<string, string> = {};
  settingsList.forEach(setting => {
    settingsRecord[setting.key] = setting.value;
  });

  const RESEND_API_KEY = settingsRecord['resend_api_key'] || process.env.RESEND_API_KEY
  const FONNTE_TOKEN = settingsRecord['fonnte_token'] || process.env.FONNTE_TOKEN
  const SENDER_EMAIL = settingsRecord['sender_email'] || process.env.SENDER_EMAIL || 'onboarding@resend.dev'

  const messageText = `Halo ${customerName},\n\nLayanan langganan premium Anda *${productName}* telah diaktifkan! 🎉\n\nKredensial Akses:\n- Email/Username: ${accountEmail || '-'}\n- Password: ${accountPassword || '-'}\n${remarks ? `- Catatan: ${remarks}\n` : ''}\nTerima kasih telah berlangganan di OneSubscribe!`

  // 1. Dispatch WhatsApp (Fonnte)
  if (FONNTE_TOKEN && toWhatsapp) {
    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: FONNTE_TOKEN,
        },
        body: new URLSearchParams({
          target: toWhatsapp,
          message: messageText,
        }),
      })
      const result = await response.json()
      console.log('[NOTIFICATION WA] Fonnte response:', result)
    } catch (err) {
      console.error('[NOTIFICATION WA] Failed to send WA via Fonnte:', err)
    }
  } else {
    console.log('[NOTIFICATION WA SIMULATED] No Fonnte token found. Text:\n', messageText)
  }

  // 2. Dispatch Email (Resend)
  if (RESEND_API_KEY && toEmail) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `OneSubscribe <${SENDER_EMAIL}>`,
          to: [toEmail],
          subject: `Aktivasi Akun Premium: ${productName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #4fba7b;">Layanan Aktif!</h2>
              <p>Halo <strong>${customerName}</strong>,</p>
              <p>Langganan premium <strong>${productName}</strong> Anda telah berhasil diaktifkan dan siap digunakan.</p>
              
              <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Detail Akun:</h4>
                <p style="margin: 5px 0;"><strong>Username / Email:</strong> <code>${accountEmail || '-'}</code></p>
                <p style="margin: 5px 0;"><strong>Password:</strong> <code>${accountPassword || '-'}</code></p>
                ${remarks ? `<p style="margin: 5px 0;"><strong>Catatan Admin:</strong> ${remarks}</p>` : ''}
              </div>
              
              <p>Silakan login menggunakan informasi di atas. Jika ada masalah, jangan ragu untuk membalas email ini.</p>
              <p style="font-size: 12px; color: #a0aec0; margin-top: 40px;">Tim OneSubscribe</p>
            </div>
          `,
        }),
      })
      const result = await response.json()
      console.log('[NOTIFICATION EMAIL] Resend response:', result)
    } catch (err) {
      console.error('[NOTIFICATION EMAIL] Failed to send email via Resend:', err)
    }
  } else {
    console.log('[NOTIFICATION EMAIL SIMULATED] No Resend key found. HTML output generated in console.')
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

  const RESEND_API_KEY = settingsRecord['resend_api_key'] || process.env.RESEND_API_KEY
  const FONNTE_TOKEN = settingsRecord['fonnte_token'] || process.env.FONNTE_TOKEN
  const SENDER_EMAIL = settingsRecord['sender_email'] || process.env.SENDER_EMAIL || 'onboarding@resend.dev'

  const messageText = `Halo ${customerName},\n\nLangganan premium *${productName}* Anda akan habis dalam *${daysRemaining} hari*. Jangan lupa perpanjang layanan Anda agar tidak terputus!\n\nOneSubscribe`

  // Send WhatsApp
  if (FONNTE_TOKEN && toWhatsapp) {
    try {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: FONNTE_TOKEN },
        body: new URLSearchParams({ target: toWhatsapp, message: messageText }),
      })
    } catch (err) {
      console.error(err)
    }
  } else {
    console.log('[NOTIFICATION EXP WA SIMULATED]', messageText)
  }

  // Send Email
  if (RESEND_API_KEY && toEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `OneSubscribe <${SENDER_EMAIL}>`,
          to: [toEmail],
          subject: `Peringatan: Langganan ${productName} Hampir Habis!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #dd6b20;">Langganan Segera Berakhir</h2>
              <p>Halo <strong>${customerName}</strong>,</p>
              <p>Layanan premium <strong>${productName}</strong> Anda akan habis masa aktifnya dalam waktu <strong>${daysRemaining} hari</strong>.</p>
              <p>Silakan kunjungi dashboard Anda untuk memperpanjang langganan agar akses premium Anda tetap berjalan tanpa gangguan.</p>
              <p style="font-size: 12px; color: #a0aec0; margin-top: 40px;">Tim OneSubscribe</p>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.error(err)
    }
  } else {
    console.log('[NOTIFICATION EXP EMAIL SIMULATED]')
  }
}

import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { systemSettings } from '../../db/schema';
import { z } from 'zod';

const testConnectionSchema = z.object({
  service: z.enum(['midtrans', 'pakasir', 'fonnte', 'evolution', 'rustfs', 'midtrans_callback', 'pakasir_callback', 'email']),
});

/**
 * Server function to fetch all system settings values (toggles only).
 */
export const getAllSystemSettings = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const settingsList = await db.select().from(systemSettings);
    
    // Map list of settings to key-value record object
    const settingsRecord: Record<string, string> = {};
    settingsList.forEach(setting => {
      settingsRecord[setting.key] = setting.value;
    });

    return { 
      success: true, 
      settings: {
        active_payment_gateway: settingsRecord['active_payment_gateway'] || 'midtrans',
        midtrans_env: settingsRecord['midtrans_env'] || 'sandbox',
        pakasir_env: settingsRecord['pakasir_env'] || 'sandbox',
        active_wa_gateway: settingsRecord['active_wa_gateway'] || 'fonnte',
      }
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil konfigurasi sistem.' };
  }
});

/**
 * Server function to update system settings (toggles only).
 */
export const updateSystemSettings = createServerFn({ method: 'POST' })
  .validator((data: Record<string, string>) => data)
  .handler(async ({ data }) => {
    try {
      for (const [key, value] of Object.entries(data)) {
        const [existing] = await db
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.key, key))
          .limit(1);

        if (existing) {
          await db
            .update(systemSettings)
            .set({ value: value, updatedAt: new Date() })
            .where(eq(systemSettings.key, key));
        } else {
          await db.insert(systemSettings).values({
            key,
            value,
          });
        }
      }
      return { success: true, message: 'Semua pengaturan berhasil disimpan!' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Gagal menyimpan pengaturan.' };
    }
  });

/**
 * Server function to fetch the active payment gateway setting.
 */
export const getActivePaymentGateway = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'active_payment_gateway'))
      .limit(1);
    
    const value = setting?.value || 'midtrans';
    return { success: true, activeGateway: value };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Gagal mengambil status gateway aktif.' };
  }
});

/**
 * Server function to update active payment gateway.
 */
export const updateActivePaymentGateway = createServerFn({ method: 'POST' })
  .validator((gateway: 'midtrans' | 'pakasir') => gateway)
  .handler(async ({ data: gateway }) => {
    try {
      await db
        .insert(systemSettings)
        .values({ key: 'active_payment_gateway', value: gateway })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: gateway, updatedAt: new Date() }
        });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

/**
 * Server function to perform connectivity tests using env variables.
 */
export const testConnection = createServerFn({ method: 'POST' })
  .validator((data: unknown) => testConnectionSchema.parse(data))
  .handler(async ({ data }) => {
    // Fetch all configurations from database settings
    const settingsList = await db.select().from(systemSettings);
    const settingsRecord: Record<string, string> = {};
    settingsList.forEach(setting => {
      settingsRecord[setting.key] = setting.value;
    });

    if (data.service === 'midtrans') {
      const env = settingsRecord['midtrans_env'] || 'sandbox';
      const isProduction = env === 'production';
      const serverKey = isProduction
        ? process.env.MIDTRANS_PRODUCTION_SERVER_KEY
        : (process.env.MIDTRANS_SANDBOX_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY);
      
      if (!serverKey) {
        return { success: false, message: `Koneksi Gagal: Server Key Midtrans ${env.toUpperCase()} tidak ditemukan di file .env` };
      }

      const endpoint = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
      
      const authHeader = Buffer.from(`${serverKey}:`).toString('base64');
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`,
            'User-Agent': 'OneSubscribe/1.0',
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: `CONN-TEST-${Date.now()}`,
              gross_amount: 1000,
            },
          }),
        });

        if (response.status === 401) {
          return { success: false, message: 'Kredensial Tidak Valid (401 Unauthorized). Periksa kembali Server Key di file .env Anda.' };
        }
        if (response.status === 201 || response.status === 400 || response.ok) {
          return { success: true, message: `Koneksi ke Midtrans ${env.toUpperCase()} Berhasil!` };
        }
        return { success: false, message: `Respon Midtrans: ${response.statusText} (${response.status})` };
      } catch (err: any) {
        return { success: false, message: `Koneksi Gagal: ${err.message}` };
      }
    }

    if (data.service === 'pakasir') {
      const env = settingsRecord['pakasir_env'] || 'sandbox';
      const isProduction = env === 'production';
      
      const slug = isProduction
        ? (process.env.PAKASIR_PRODUCTION_SLUG || process.env.PAKASIR_SLUG || 'jbr-minpo')
        : (process.env.PAKASIR_SANDBOX_SLUG || process.env.PAKASIR_SLUG || 'jbr-minpo');
        
      const apiKey = isProduction
        ? process.env.PAKASIR_PRODUCTION_API_KEY
        : (process.env.PAKASIR_SANDBOX_API_KEY || process.env.PAKASIR_API_KEY);

      if (!apiKey) {
        return { success: false, message: `Koneksi Gagal: API Key Pakasir ${env.toUpperCase()} tidak ditemukan di file .env` };
      }

      const endpoint = `https://app.pakasir.com/api/transactiondetail?project=${slug}&amount=1000&order_id=TEST-${Date.now()}&api_key=${apiKey}`;
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'OneSubscribe/1.0',
          },
        });
        const resBody = await response.json() as any;
        if (response.status === 401 || response.status === 403 || resBody?.status === 'error' || resBody?.error) {
          const errMsg = resBody?.message || resBody?.error || 'Kredensial tidak valid.';
          return { success: false, message: `Gagal: ${errMsg}` };
        }
        return { success: true, message: `Koneksi ke Pakasir ${env.toUpperCase()} Berhasil!` };
      } catch (err: any) {
        return { success: false, message: `Koneksi Gagal: ${err.message}` };
      }
    }

    if (data.service === 'fonnte') {
      const token = process.env.FONNTE_TOKEN;
      if (!token) {
        return { success: false, message: 'Koneksi Gagal: Token Fonnte tidak ditemukan di file .env' };
      }
      try {
        const response = await fetch('https://api.fonnte.com/device', {
          method: 'POST',
          headers: {
            Authorization: token,
            'User-Agent': 'OneSubscribe/1.0',
          },
        });
        const resBody = await response.json() as any;
        if (resBody?.status === true) {
          const deviceStatus = resBody?.device_status || 'unknown';
          const quota = resBody?.quota || 0;
          return { 
            success: true, 
            message: `Koneksi Fonnte Berhasil! Status Device: ${deviceStatus.toUpperCase()}, Sisa Kuota: ${quota} pesan.` 
          };
        } else {
          return { 
            success: false, 
            message: `Fonnte Error: ${resBody?.reason || 'Token tidak valid atau device belum di-scan.'}` 
          };
        }
      } catch (err: any) {
        return { success: false, message: `Koneksi Gagal: ${err.message}` };
      }
    }

    if (data.service === 'evolution') {
      const endpoint = process.env.EVO_API_URL;
      const apiKey = process.env.EVO_API_KEY;
      const instance = process.env.EVO_INSTANCE;

      if (!endpoint || !apiKey || !instance) {
        return { success: false, message: 'Koneksi Gagal: Kredensial Evolution API tidak lengkap di file konfigurasi .env' };
      }

      const cleanUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
      const connectionUrl = `${cleanUrl}/instance/connectionState/${instance}`;

      try {
        const response = await fetch(connectionUrl, {
          method: 'GET',
          headers: {
            apikey: apiKey,
            'User-Agent': 'OneSubscribe/1.0',
          },
        });
        
        if (response.status === 401 || response.status === 403) {
          return { success: false, message: 'Evolution API Error: Kredensial API Key tidak valid (401/403).' };
        }

        if (response.status >= 500) {
          return { success: false, message: `Evolution API Server Error: Server mengembalikan status ${response.status} (${response.statusText || 'Bad Gateway'}). Pastikan server/container Evolution API Anda di wa.ve-lora.my.id sudah aktif.` };
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const rawText = await response.text();
          const cleanText = rawText.replace(/<[^>]*>/g, '').trim().substring(0, 80);
          return { success: false, message: `Evolution API Error: Respon dari server bukan JSON (${response.status}). Pesan: ${cleanText || 'Nginx/Proxy Error'}` };
        }

        const resBody = await response.json() as any;
        if (resBody && resBody.instance) {
          const state = resBody.instance.state || 'unknown';
          return {
            success: true,
            message: `Koneksi Evolution API Berhasil! Instance: ${instance}, Status Koneksi WA: ${state.toUpperCase()}`
          };
        } else {
          return {
            success: false,
            message: `Evolution API Error: ${resBody?.message || 'Instance tidak ditemukan atau tidak aktif.'}`
          };
        }
      } catch (err: any) {
        return { success: false, message: `Koneksi Gagal: ${err.message}` };
      }
    }

    if (data.service === 'rustfs') {
      const endpoint = process.env.RUSTFS_ENDPOINT;
      const accessKey = process.env.RUSTFS_ACCESS_KEY;
      const secretKey = process.env.RUSTFS_SECRET_KEY;
      const bucket = process.env.RUSTFS_BUCKET;

      if (!endpoint || !accessKey || !secretKey || !bucket) {
        return { success: false, message: 'Koneksi Gagal: Kredensial RustFS tidak lengkap di file konfigurasi .env' };
      }

      try {
        const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
        const s3Client = new S3Client({
          endpoint,
          region: 'ap-southeast-1',
          credentials: {
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
          },
          forcePathStyle: true,
        });

        await s3Client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
        return { success: true, message: 'Koneksi ke Storage RustFS Berhasil! Buckets terhubung dengan aman.' };
      } catch (err: any) {
        return { success: false, message: `Koneksi Gagal: ${err.message}` };
      }
    }

    if (data.service === 'midtrans_callback') {
      let origin = 'http://localhost:3000';
      try {
        const { getRequest } = await import('@tanstack/react-start/server');
        const req = getRequest();
        if (req) {
          origin = new URL(req.url).origin;
        }
      } catch (e) {
        // fallback
      }

      const endpoint = `${origin}/api/webhooks/midtrans`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OneSubscribe-Callback-Test/1.0',
          },
          body: JSON.stringify({
            order_id: "", // Dummy/empty to avoid database side-effects
            transaction_status: "settlement",
          }),
        });

        if (response.ok) {
          const resBody = await response.json() as any;
          if (resBody?.success) {
            return { success: true, message: 'Koneksi Callback Midtrans Aktif & Berhasil Merespon!' };
          }
        }
        return { success: false, message: `Koneksi Callback Gagal: HTTP ${response.status} (${response.statusText})` };
      } catch (err: any) {
        return { success: false, message: `Koneksi Callback Gagal: ${err.message}` };
      }
    }

    if (data.service === 'pakasir_callback') {
      let origin = 'http://localhost:3000';
      try {
        const { getRequest } = await import('@tanstack/react-start/server');
        const req = getRequest();
        if (req) {
          origin = new URL(req.url).origin;
        }
      } catch (e) {
        // fallback
      }

      const endpoint = `${origin}/api/v1/callback/pakasir`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OneSubscribe-Callback-Test/1.0',
          },
          body: JSON.stringify({
            reference: "", // Dummy/empty
            status: "PAID",
          }),
        });

        if (response.ok) {
          const resBody = await response.json() as any;
          if (resBody?.success) {
            return { success: true, message: 'Koneksi Callback Pakasir Aktif & Berhasil Merespon!' };
          }
        }
        return { success: false, message: `Koneksi Callback Gagal: HTTP ${response.status} (${response.statusText})` };
      } catch (err: any) {
        return { success: false, message: `Koneksi Callback Gagal: ${err.message}` };
      }
    }

    if (data.service === 'email') {
      const emailProvider = settingsRecord['email_provider'] || process.env.EMAIL_PROVIDER || 'resend';
      if (emailProvider.toLowerCase() === 'smtp') {
        const host = settingsRecord['smtp_host'] || process.env.SMTP_HOST || 'smtp.sumopod.com';
        const portStr = settingsRecord['smtp_port'] || process.env.SMTP_PORT || '465';
        const port = parseInt(portStr.toString(), 10) || 465;
        const secureVal = settingsRecord['smtp_secure'] || process.env.SMTP_SECURE || 'true';
        const secure = secureVal === 'true' || secureVal === 'True';
        const user = settingsRecord['smtp_user'] || process.env.SMTP_USER || 'cmrwb114r5zlfr208z53dy1vi';
        const pass = settingsRecord['smtp_pass'] || process.env.SMTP_PASS || 'ZLXzytPQcNQhTUEI8mze5Dhm1GxxupSd';

        try {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
              user,
              pass,
            },
            connectionTimeout: 5000,
          });

          await transporter.verify();
          return { success: true, message: `Koneksi SMTP (${host}:${port}) Berhasil terhubung!` };
        } catch (err: any) {
          return { success: false, message: `Koneksi SMTP Gagal: ${err.message}` };
        }
      } else {
        const resendKey = settingsRecord['resend_api_key'] || process.env.RESEND_API_KEY;
        if (!resendKey) {
          return { success: false, message: 'Koneksi Gagal: API Key Resend tidak ditemukan.' };
        }
        try {
          const response = await fetch('https://api.resend.com/domains', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            return { success: true, message: 'Koneksi Resend API Berhasil!' };
          }
          return { success: false, message: `Koneksi Resend Gagal: API Key tidak valid (${response.status})` };
        } catch (err: any) {
          return { success: false, message: `Koneksi Resend Gagal: ${err.message}` };
        }
      }
    }

    return { success: false, message: 'Service tidak dikenal.' };
  });

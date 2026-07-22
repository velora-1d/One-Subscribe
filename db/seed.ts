import { db, client } from './index';
import { products, users, systemSettings, orders, credentials, auditLogs, categories, promos } from './schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');
  try {
    // Clear all existing data in correct dependency order to avoid constraint violations
    await db.delete(credentials);
    await db.delete(orders);
    await db.delete(promos);
    await db.delete(auditLogs);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(users);
    await db.delete(systemSettings);

    // Seed default system settings
    await db.insert(systemSettings).values({
      key: 'active_payment_gateway',
      value: 'midtrans',
    });
    console.log('⚙️ Default payment gateway setting seeded (midtrans)');

    // Seed categories
    await db.insert(categories).values([
      { name: 'AI Tools', description: 'Kecerdasan Buatan dan AI Assistant' },
      { name: 'Design', description: 'Alat bantu desain grafis dan kreatif' },
      { name: 'Streaming', description: 'Layanan streaming hiburan premium' },
      { name: 'Server/VPS', description: 'Server VPS dan Virtual Machine hosting' },
      { name: 'Cloud & Storage', description: 'Penyimpanan cloud, basis data serverless, dan infrastruktur cloud' },
      { name: 'Developer Tools', description: 'Lisensi IDE, API credit, dan peralatan web development' },
    ]);
    console.log('📂 Product categories seeded successfully!');

    // Seed default admin user
    const adminPasswordHash = await bcrypt.hash('adminpassword123', 10);
    await db.insert(users).values({
      id: '19889b10-a288-4bff-812b-74f4adfb1e50',
      name: 'Admin OneSubscribe',
      email: 'admin@onesubscribe.com',
      whatsapp: '081234567890',
      passwordHash: adminPasswordHash,
      role: 'admin',
      pin: '200601',
      isActive: true,
    });
    console.log('👤 Admin user seeded successfully! (admin@onesubscribe.com / adminpassword123) with PIN 200601');

    await db.insert(products).values([
      {
        id: '3832dffd-8a58-40e4-9830-2c352644fb4a',
        name: 'ChatGPT Plus',
        description: 'Akses penuh ke GPT-4o, DALL-E 3, Advanced Voice Mode, dan fitur analisis data tingkat lanjut.',
        price: 320000,
        durationMonths: 1,
        category: 'AI Tools',
        imageUrl: 'https://picsum.photos/seed/chatgpt/800/600',
        isActive: true,
      },
      {
        id: '69a5f6f2-e61f-401f-8821-2b66d1b31d1c',
        name: 'Canva Pro',
        description: 'Akses ke jutaan elemen desain premium, font, template eksklusif, dan background remover.',
        price: 45000,
        durationMonths: 1,
        category: 'Design',
        imageUrl: 'https://picsum.photos/seed/canva/800/600',
        isActive: true,
      },
      {
        id: 'e0a30b20-dfeb-4e6f-9988-c7e1898bd03f',
        name: 'Netflix Premium (Ultra HD)',
        description: 'Menonton dalam kualitas 4K+HDR di 4 perangkat sekaligus. Akses bebas iklan.',
        price: 186000,
        durationMonths: 1,
        category: 'Streaming',
        imageUrl: 'https://picsum.photos/seed/netflix/800/600',
        isActive: true,
      },
      {
        id: '62fcf882-9599-4c8d-b0a7-640a459bf6a0',
        name: 'VPS Server SG - 2GB RAM',
        description: 'Virtual Private Server berlokasi di Singapura, 1 vCPU, 2GB RAM, 50GB SSD NVMe, 1TB Bandwidth.',
        price: 120000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/vps/800/600',
        isActive: true,
      },
      {
        id: '92110c73-455b-43ad-8d9b-d7d8e8749a01',
        name: 'Cloudflare R2 Storage',
        description: 'Cloudflare R2 Object Storage Standard Plan. Bebas biaya egress, kompatibel dengan S3 API, latensi sangat rendah.',
        price: 80000,
        durationMonths: 1,
        category: 'Cloud & Storage',
        imageUrl: 'https://picsum.photos/seed/cfr2/800/600',
        isActive: true,
      },
      {
        id: '5023fa38-2a91-447f-83ba-8dcd81e6e902',
        name: 'Firebase Cloud Messaging (FCM) API Hub',
        description: 'Firebase Cloud Messaging API Integration Hub. Server push notification terdedikasi untuk Android, iOS, dan Web.',
        price: 150000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/fcm/800/600',
        isActive: true,
      },
      {
        id: '1a7740cb-4654-4a25-bc32-15f93cdfe903',
        name: 'Niagahoster VPS KVM 1',
        description: 'Virtual Private Server KVM dari Niagahoster. 1 Core CPU, 1GB RAM, 20GB SSD, IP Dedicated, lokasi server Indonesia.',
        price: 95000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/nhkvm1/800/600',
        isActive: true,
      },
      {
        id: '8dbf8c47-38e2-411a-b6e3-2cc51adfa904',
        name: 'Niagahoster VPS KVM 2',
        description: 'Virtual Private Server KVM dari Niagahoster. 2 Core CPU, 2GB RAM, 40GB SSD, IP Dedicated, lokasi server Indonesia.',
        price: 180000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/nhkvm2/800/600',
        isActive: true,
      },
      {
        id: 'a90e3cd2-901b-4b2a-89a1-5c8e3bfda905',
        name: 'DomaiNesia VPS Monster',
        description: 'VPS performa tinggi dari DomaiNesia. 4 Core CPU, 8GB RAM, 160GB SSD NVMe, bandwidth tanpa batas untuk aplikasi developer.',
        price: 450000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/dnmonster/800/600',
        isActive: true,
      },
      {
        id: 'cd3db7b9-1f48-43be-a991-ee8a79ad2906',
        name: 'DomaiNesia Cloud Hosting Super',
        description: 'Cloud Hosting premium DomaiNesia dengan Unlimited SSD NVMe storage, unlimited bandwidth, & SSL gratis selamanya.',
        price: 75000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/dnsuper/800/600',
        isActive: true,
      },
      {
        id: '3ff9da0b-33bb-40ca-b3a1-2d3ea9ad3907',
        name: 'Sumopod Cloud VPS Developer',
        description: 'Cloud VPS khusus dengan container development tools terinstal. 2 vCPU, 4GB RAM, dioptimalkan untuk Docker dan Node.js.',
        price: 250000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/sumopod/800/600',
        isActive: true,
      },
      {
        id: '9ac8d6ea-2a3b-488f-9a1b-1d7c3b2da908',
        name: 'Dewaweb Cloud VPS Hunter',
        description: 'Cloud VPS Dewaweb dengan perlindungan keamanan tinggi. 2 vCPU, 2GB RAM, SSD Storage, CyberPanel pra-instalasi.',
        price: 150000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/dwhunter/800/600',
        isActive: true,
      },
      {
        id: '7b28cdba-329b-46fa-a83b-9e4a3b8da909',
        name: 'Hostinger Cloud Startup',
        description: 'Paket Hosting Cloud dari Hostinger dengan 200GB SSD NVMe, RAM 3GB, 2 vCPU terdedikasi, serta domain gratis.',
        price: 220000,
        durationMonths: 1,
        category: 'Server/VPS',
        imageUrl: 'https://picsum.photos/seed/hosing/800/600',
        isActive: true,
      },
      {
        id: '1df12d3b-aa3b-468a-9a99-b1d83b7da910',
        name: 'GitHub Copilot Individual',
        description: 'AI pendamping coding di IDE Anda. Autocomplete cerdas untuk baris kode, pengujian, penjelasan error, dan fungsi kompleks.',
        price: 160000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/ghcopilot/800/600',
        isActive: true,
      },
      {
        id: '8dbf8c47-38e2-411a-b6e3-2cc51adfa911',
        name: 'OpenAI API Credits $50',
        description: 'Token saldo API OpenAI sebesar USD $50 untuk integrasi API GPT-4o, DALL-E 3, Embeddings, dan Whisper API.',
        price: 780000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/openaiapi/800/600',
        isActive: true,
      },
      {
        id: '2cf8cda2-9b2b-45ca-b3a1-1e3ab8ba2912',
        name: 'Cursor Pro AI Editor',
        description: 'Abonnement bulanan editor kode berbasis AI dengan fitur chat codebase kontekstual dan penulisan otomatis.',
        price: 310000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/cursorpro/800/600',
        isActive: true,
      },
      {
        id: 'aa9d8b7b-23ab-4c2a-b9a1-3d7ea89da913',
        name: 'JetBrains All Products Pack',
        description: 'Akses penuh ke semua IDE kelas atas JetBrains termasuk IntelliJ IDEA, WebStorm, PyCharm, PhpStorm, dan CLion.',
        price: 390000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/jetbrains/800/600',
        isActive: true,
      },
      {
        id: '9bdcba8b-2a9f-43ba-ba9d-15a9ab2ea914',
        name: 'GitKraken Client Pro',
        description: 'Klien GUI Git premium untuk kemudahan visualisasi commit history, resolusi konflik merge, dan manajemen branch tim.',
        price: 90000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/gitkraken/800/600',
        isActive: true,
      },
      {
        id: '4ff9b8c2-3e2b-468a-b9a9-2d7ea8fda915',
        name: 'Laracasts Yearly Subscription',
        description: 'Akses 12 Bulan ke seluruh video edukasi web development modern (PHP, Laravel, Vue.js, React, Inertia, dan Tailwind CSS).',
        price: 2200000,
        durationMonths: 12,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/laracasts/800/600',
        isActive: true,
      },
      {
        id: '8dbf8c47-38e2-411a-b6e3-2cc51adfa916',
        name: 'Tailwind UI Enterprise License',
        description: 'Lisensi enterprise sekali bayar untuk ribuan komponen HTML/React/Vue siap pakai dari kreator Tailwind CSS.',
        price: 3500000,
        durationMonths: 12,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/tailwindui/800/600',
        isActive: true,
      },
      {
        id: '7b28cdba-329b-46fa-a83b-9e4a3b8da917',
        name: 'Ngrok Pro Plan',
        description: 'Konektivitas tunnel localhost aman ke publik dengan domain statis kustom, proteksi OAuth, dan pembatasan alamat IP.',
        price: 290000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/ngrok/800/600',
        isActive: true,
      },
      {
        id: '9bdcba8b-2a9f-43ba-ba9d-15a9ab2ea918',
        name: 'Postman Professional',
        description: 'Kolaborasi tim pengujian API tanpa batas. Desain skema API, dokumentasi interaktif, dan mock server terintegrasi.',
        price: 230000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/postman/800/600',
        isActive: true,
      },
      {
        id: 'aa9d8b7b-23ab-4c2a-b9a1-3d7ea89da919',
        name: 'Docker Pro Account',
        description: 'Akun Docker Hub Pro dengan build repositori privat tanpa batas dan batas 5.000 kali pull image per hari.',
        price: 140000,
        durationMonths: 1,
        category: 'Developer Tools',
        imageUrl: 'https://picsum.photos/seed/docker/800/600',
        isActive: true,
      },
      {
        id: '3ff9da0b-33bb-40ca-b3a1-2d3ea9ad3920',
        name: 'Claude Pro',
        description: 'Akses prioritas ke model cerdas Claude 3.5 Sonnet & Claude 3 Opus dari Anthropic dengan batas pesan 5x lipat.',
        price: 320000,
        durationMonths: 1,
        category: 'AI Tools',
        imageUrl: 'https://picsum.photos/seed/claude/800/600',
        isActive: true,
      },
      {
        id: '9ac8d6ea-2a3b-488f-9a1b-1d7c3b2da921',
        name: 'Midjourney Basic Plan',
        description: 'Langganan generator gambar AI Midjourney dengan jatah waktu rendering cepat GPU 3.3 jam per bulan.',
        price: 160000,
        durationMonths: 1,
        category: 'AI Tools',
        imageUrl: 'https://picsum.photos/seed/midjourney/800/600',
        isActive: true,
      },
      {
        id: '7b28cdba-329b-46fa-a83b-9e4a3b8da922',
        name: 'v0 by Vercel Premium',
        description: 'Asisten kecerdasan buatan frontend premium untuk pembuatan komponen React/Tailwind instan dengan ekspor sekali klik.',
        price: 310000,
        durationMonths: 1,
        category: 'AI Tools',
        imageUrl: 'https://picsum.photos/seed/v0vercel/800/600',
        isActive: true,
      },
      {
        id: '1df12d3b-aa3b-468a-9a99-b1d83b7da923',
        name: 'Supabase Pro Plan',
        description: 'Backend service lengkap dengan database Postgres 8GB, 100GB transfer data bulanan, Auth, & serverless functions.',
        price: 390000,
        durationMonths: 1,
        category: 'Cloud & Storage',
        imageUrl: 'https://picsum.photos/seed/supabase/800/600',
        isActive: true,
      },
      {
        id: '8dbf8c47-38e2-411a-b6e3-2cc51adfa924',
        name: 'Neon Serverless Postgres',
        description: 'Database Postgres serverless dengan fitur database branching instan dan penskalaan komputasi otomatis ke nol.',
        price: 290000,
        durationMonths: 1,
        category: 'Cloud & Storage',
        imageUrl: 'https://picsum.photos/seed/neon/800/600',
        isActive: true,
      },
      {
        id: '2cf8cda2-9b2b-45ca-b3a1-1e3ab8ba2925',
        name: 'PlanetScale Starter Plan',
        description: 'Database MySQL serverless berbasis Vitess dengan fitur skema migrasi tanpa downtime dan jaminan high availability.',
        price: 450000,
        durationMonths: 1,
        category: 'Cloud & Storage',
        imageUrl: 'https://picsum.photos/seed/planetscale/800/600',
        isActive: true,
      },
      {
        id: 'aa9d8b7b-23ab-4c2a-b9a1-3d7ea89da926',
        name: 'AWS EC2 t3.medium Instance',
        description: 'Sewa instans server cloud AWS EC2 t3.medium (2 vCPU, 4GB RAM) di Singapura, gratis 80GB SSD NVMe.',
        price: 380000,
        durationMonths: 1,
        category: 'Cloud & Storage',
        imageUrl: 'https://picsum.photos/seed/awsec2/800/600',
        isActive: true,
      }
    ]);
    console.log('📦 Products seeded successfully!');

    // Seed 15 Promos & Vouchers targeting different products
    await db.insert(promos).values([
      {
        code: null, // Catalog discount (slashed price)
        discountType: 'percentage',
        discountValue: 10,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: '3832dffd-8a58-40e4-9830-2c352644fb4a', // ChatGPT Plus
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'CANVAPRO', // Voucher code
        discountType: 'percentage',
        discountValue: 20,
        minDurationMonths: 1,
        isCatalogSlashed: false,
        productId: '69a5f6f2-e61f-401f-8821-2b66d1b31d1c', // Canva Pro
        maxUses: 100,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: null, // Catalog discount
        discountType: 'percentage',
        discountValue: 15,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: 'e0a30b20-dfeb-4e6f-9988-c7e1898bd03f', // Netflix Premium
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'SGSERVER', // Voucher
        discountType: 'fixed',
        discountValue: 15000,
        minDurationMonths: 3, // Min 3 months
        isCatalogSlashed: false,
        productId: '62fcf882-9599-4c8d-b0a7-640a459bf6a0', // VPS Server SG
        maxUses: 50,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: null, // Catalog discount
        discountType: 'fixed',
        discountValue: 10000,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: '92110c73-455b-43ad-8d9b-d7d8e8749a01', // Cloudflare R2
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'FCMAPI', // Voucher
        discountType: 'percentage',
        discountValue: 10,
        minDurationMonths: 1,
        isCatalogSlashed: false,
        productId: '5023fa38-2a91-447f-83ba-8dcd81e6e902', // Firebase FCM
        maxUses: 200,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: null, // Catalog discount
        discountType: 'percentage',
        discountValue: 15,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: '1a7740cb-4654-4a25-bc32-15f93cdfe903', // Niagahoster KVM 1
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'KVMHEBAT', // Voucher
        discountType: 'percentage',
        discountValue: 20,
        minDurationMonths: 2,
        isCatalogSlashed: false,
        productId: '8dbf8c47-38e2-411a-b6e3-2cc51adfa904', // Niagahoster KVM 2
        maxUses: 75,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: null, // Catalog discount
        discountType: 'fixed',
        discountValue: 50000,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: 'a90e3cd2-901b-4b2a-89a1-5c8e3bfda905', // DomaiNesia VPS Monster
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'HOSTINGSUPER', // Voucher
        discountType: 'fixed',
        discountValue: 15000,
        minDurationMonths: 3,
        isCatalogSlashed: false,
        productId: 'cd3db7b9-1f48-43be-a991-ee8a79ad2906', // DomaiNesia Hosting Super
        maxUses: 150,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: null, // Catalog discount
        discountType: 'percentage',
        discountValue: 10,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: '3ff9da0b-33bb-40ca-b3a1-2d3ea9ad3907', // Sumopod VPS Developer
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'DEWAWEB', // Voucher
        discountType: 'fixed',
        discountValue: 20000,
        minDurationMonths: 1,
        isCatalogSlashed: false,
        productId: '9ac8d6ea-2a3b-488f-9a1b-1d7c3b2da908', // Dewaweb VPS Hunter
        maxUses: 80,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: null, // Catalog discount
        discountType: 'fixed',
        discountValue: 30000,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: '7b28cdba-329b-46fa-a83b-9e4a3b8da909', // Hostinger Cloud Startup
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: 'COPILOTAI', // Voucher
        discountType: 'percentage',
        discountValue: 15,
        minDurationMonths: 1,
        isCatalogSlashed: false,
        productId: '1df12d3b-aa3b-468a-9a99-b1d83b7da910', // GitHub Copilot
        maxUses: 300,
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        code: null, // Catalog discount
        discountType: 'percentage',
        discountValue: 10,
        minDurationMonths: 1,
        isCatalogSlashed: true,
        productId: '8dbf8c47-38e2-411a-b6e3-2cc51adfa911', // OpenAI API Credits
        validUntil: new Date('2026-12-31'),
        isActive: true,
      }
    ]);
    console.log('🎫 15 Promos and Vouchers seeded successfully!');

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.end();
  }
}

main();

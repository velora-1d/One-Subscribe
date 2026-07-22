import { db, client } from './index';
import { products, users, systemSettings, orders, credentials, auditLogs } from './schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');
  try {
    // Clear all existing data in correct dependency order to avoid constraint violations
    await db.delete(credentials);
    await db.delete(orders);
    await db.delete(auditLogs);
    await db.delete(products);
    await db.delete(users);
    await db.delete(systemSettings);

    // Seed default system settings
    await db.insert(systemSettings).values({
      key: 'active_payment_gateway',
      value: 'midtrans',
    });
    console.log('⚙️ Default payment gateway setting seeded (midtrans)');

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
      }
    ]);
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.end();
  }
}

main();

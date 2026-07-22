# OneSubscribe

## Deskripsi
OneSubscribe adalah platform marketplace langganan digital yang memudahkan pengguna mendapatkan akses ke berbagai layanan teknologi premium seperti AI tools, Firebase, Cloudflare, server/VPS, dan lainnya hanya dalam satu tempat. User cukup memilih layanan, mengisi form, melakukan pembayaran, dan tim OneSubscribe akan mengaktifkan langganan serta mengirimkan kredensial langsung via WhatsApp dan email.

## Stack Teknologi
- Frontend + Backend: TanStack Start (TypeScript)
- Database: PostgreSQL
- ORM: Drizzle ORM
- Payment Gateway: Pakasir & Midtrans
- WA Gateway: Fonnte
- Email Service: Resend
- Storage: RustFS (S3-compatible, self-hosted)

## Mode Arsitektur
- [x] TanStack Start Fullstack
- [ ] Laravel API + Next.js Frontend
- [ ] Lainnya

## Target Platform
- [x] Web only
- [ ] Mobile app
- [ ] Lainnya

## Multi-tenant
- [ ] Ya
- [x] Tidak

## Skala User
- [x] Kecil (< 100 user)
- [ ] Menengah (< 10.000 user)
- [ ] Besar (> 10.000 user)

## Tim
- [x] Solo developer
- [ ] Tim

## Hosting & Infra
- Development: Local Machine
- Staging/Production: VPS + Dokploy

## Struktur Folder (ringkas)
```
.
├── src/                 Aplikasi frontend & backend TanStack Start
│   ├── routes/          File-based routes & API endpoints
│   ├── components/      Reusable UI components (Header, Footer, dll)
│   └── styles.css       Styles & Tailwind CSS configurations
├── db/                  Database schema, index & generated migrations
│   ├── schema.ts        Drizzle schema definitions
│   ├── index.ts         Database client connection
│   └── migrations/      Generated SQL migrations
├── PROJECT.md           File ini (untuk manusia)
├── project.json         Context proyek untuk mesin
├── PRD-OneSubscribe.md  Detail requirement produk
├── drizzle.config.ts    Drizzle kit migration config
├── .env.example         Template environment variables
└── .env                 Local environment configuration
```

## Last Updated
2026-07-22

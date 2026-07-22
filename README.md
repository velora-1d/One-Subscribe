# OneSubscribe - Digital Subscription Marketplace & Management System

[![Developer](https://img.shields.io/badge/Developer-Velora%20Dev%20(Mahin%20Utsman%20Nawawi%2C%20S.H)-blue?style=for-the-badge)](https://github.com/velora-1d)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20TanStack%20Start%20%2B%20PostgreSQL-emerald?style=for-the-badge)](#tech-stack)

**OneSubscribe** adalah platform marketplace digital dan manajemen langganan premium terpadu yang dirancang dari nol dengan visualisasi premium (*glassmorphism*, *sleek dark mode*, micro-animations) dan integrasi gerbang pembayaran dinamis.

Platform ini memungkinkan pengguna akhir (pelanggan) untuk menelusuri katalog dan membeli akun premium (seperti Canva Pro, ChatGPT Plus, Spotify, Netflix) secara instan, serta memberikan kendali penuh kepada administrator untuk mengelola transaksi, produk, kredensial, dan konfigurasi API eksternal.

---

## 🛠️ Tech Stack

Platform ini menggunakan kombinasi teknologi modern berperforma tinggi:
* **Frontend & Backend**: [React 19](https://react.dev/) & [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (SSR dengan *server functions* dan kompilasi cepat menggunakan Vite).
* **Database**: [PostgreSQL](https://www.postgresql.org/) dengan [Drizzle ORM](https://orm.drizzle.team/) untuk manajemen skema dan migrasi.
* **Storage Gateway**: **RustFS** (S3-compatible, self-hosted storage) untuk mengunggah dan melayani gambar/foto produk.
* **Payment Gateways**: **Midtrans** & **Pakasir** (Dapat ditoggle dan dikonfigurasi langsung dari Admin Panel secara dinamis).
* **Notification Gateways**: **Fonnte** (WhatsApp API) & **Resend** (Email gateway) untuk notifikasi status pesanan, kredensial, dan pengingat masa kedaluwarsa.
* **Styling**: Vanilla CSS modern yang dioptimalkan untuk performa tinggi dan kustomisasi visual tingkat tinggi.

---

## 👥 Peran Pengguna (Roles & Permissions)

Sistem ini mendukung 2 peran utama dengan akses yang terisolasi secara ketat:

### 1. Pelanggan (Customer / User)
* **Katalog Produk**: Menelusuri seluruh katalog subscription premium yang aktif di halaman beranda.
* **Checkout Cepat**: Melakukan checkout produk terpilih menggunakan sistem **"Pembayaran Otomatis"** yang aman tanpa dibingungkan oleh detail teknis payment gateway.
* **User Dashboard**:
  * Melihat daftar semua akun premium yang dibeli secara langsung.
  * Melihat kredensial akses (**Email/Username** dan **Password**) secara aman setelah pesanan diselesaikan oleh admin.
  * Memantau sisa durasi aktif langganan premium yang diperbarui otomatis setiap hari.
  * Melihat riwayat pembayaran dan status pesanan (menunggu pembayaran, menunggu aktivasi, aktif, kedaluwarsa).

### 2. Administrator (Admin)
* **Dashboard Statistik**: Memantau laporan pendapatan bulanan, jumlah pengguna aktif, dan pesanan yang membutuhkan tindakan.
* **Product Management**: Melakukan operasi CRUD (Create, Read, Update, Delete) produk subscription premium beserta unggah gambar ke RustFS storage.
* **Category Management**: Mengelompokkan produk ke dalam kategori yang dinamis.
* **Order Management**: Memproses pesanan masuk, mengonfirmasi transaksi, mengisi kredensial premium untuk user, dan menulis catatan admin (*remarks*).
* **User & Audit Logs**: Memantau pengguna terdaftar dan log aktivitas tindakan admin di dalam sistem demi keamanan.
* **System Settings**:
  * Mengaktifkan/menonaktifkan payment gateway utama (**Midtrans** vs **Pakasir**).
  * Mengatur lingkungan kerja (**Sandbox/Production**) untuk Midtrans dan Pakasir.
  * Tombol **Tes Koneksi API** instan untuk Midtrans, Pakasir, Fonnte, dan RustFS Storage untuk memastikan status API terhubung sebelum live.

---

## 💻 Panduan Instalasi Lokal (Development)

### Prasyarat
* Node.js v20+ atau yang terbaru
* pnpm (direkomendasikan) atau npm
* PostgreSQL database aktif

### Langkah-langkah
1. **Clone Repositori**:
   ```bash
   git clone https://github.com/velora-1d/One-Subscribe.git
   cd One-Subscribe
   ```

2. **Instal Dependensi**:
   ```bash
   pnpm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin file contoh konfigurasi `.env.example` ke `.env` dan sesuaikan nilainya:
   ```bash
   cp .env.example .env
   ```

   **Isi penting `.env`:**
   ```env
   # Database Connection
   DATABASE_URL="postgres://username:password@localhost:5432/onesubscribe"

   # Midtrans Credentials
   MIDTRANS_SANDBOX_SERVER_KEY="SB-Mid-server-xxx"
   MIDTRANS_PRODUCTION_SERVER_KEY="Mid-server-xxx"

   # Pakasir Credentials
   PAKASIR_SLUG="jbr-minpo"
   PAKASIR_API_KEY="api-key-xxx"

   # Fonnte WhatsApp API
   FONNTE_TOKEN="fonnte-token-xxx"

   # Resend Email Gateway
   RESEND_API_KEY="re_xxx"
   SENDER_EMAIL="onboarding@resend.dev"

   # RustFS Storage Gateway
   RUSTFS_ENDPOINT="https://rustfs.domainanda.com"
   RUSTFS_ACCESS_KEY="access-key-xxx"
   RUSTFS_SECRET_KEY="secret-key-xxx"
   RUSTFS_BUCKET="onesubscribe"
   ```

4. **Migrasi Database & Seeding**:
   ```bash
   # Buat skema migrasi lokal
   pnpm db:generate
   
   # Terapkan migrasi ke database PostgreSQL
   pnpm db:migrate
   
   # Jalankan seeder (membuat user admin uji coba & produk dummy)
   pnpm db:seed
   ```

5. **Jalankan Aplikasi**:
   ```bash
   pnpm dev
   ```
   Buka `http://localhost:3000` pada browser Anda.

---

## 🚀 Panduan Deployment (Production)

### Metode 1: Menggunakan Docker (Direkomendasikan)
Aplikasi ini sudah dilengkapi dengan Dockerfile multi-stage yang dioptimalkan untuk ukuran image yang kecil dan performa runtime yang andal.

1. **Build Docker Image**:
   ```bash
   docker build -t onesubscribe:latest .
   ```

2. **Jalankan Container**:
   Jalankan container dengan memetakan port internal 3000 ke port host Anda (misalnya 3000) dan menyertakan file konfigurasi `.env` Anda:
   ```bash
   docker run -d \
     --name onesubscribe-app \
     -p 3000:3000 \
     --env-file .env \
     onesubscribe:latest
   ```

3. **Deployment dengan Docker Compose**:
   Jika ingin menjalankan aplikasi sekaligus dengan PostgreSQL secara otomatis, buat file `docker-compose.yml`:
   ```yaml
   version: '3.8'

   services:
     db:
       image: postgres:15-alpine
       container_name: onesubscribe-db
       restart: always
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: mysecretpassword
         POSTGRES_DB: onesubscribe
       ports:
         - "5432:5432"
       volumes:
         - pgdata:/var/lib/postgresql/data

     app:
       image: onesubscribe:latest
       container_name: onesubscribe-app
       restart: always
       ports:
         - "3000:3000"
       env_file:
         - .env
       depends_on:
         - db

   volumes:
     pgdata:
   ```
   Jalankan dengan perintah:
   ```bash
   docker compose up -d
   ```

### Metode 2: VPS Manual (Dokploy / Coolify / Node.js Runner)
1. Lakukan instalasi dependensi dan pastikan file `.env` sudah sesuai dengan data produksi.
2. Jalankan perintah kompilasi produksi:
   ```bash
   pnpm build
   ```
3. Jalankan migrasi database produksi:
   ```bash
   pnpm db:migrate
   ```
4. Jalankan aplikasi di port yang diinginkan menggunakan Node.js secara langsung atau via PM2:
   ```bash
   # Menjalankan langsung
   PORT=3000 node dist/server/server.js

   # Menggunakan PM2 agar tetap hidup di background
   pm2 start dist/server/server.js --name "onesubscribe"
   ```

---

## 👥 Kontributor
* **Velora Dev** - *Creator & Architect* - [Mahin Utsman Nawawi, S.H](https://github.com/velora-1d)

# Implementation Plan — OneSubscribe

This document outlines the step-by-step development roadmap for the OneSubscribe fullstack application.

---

## Phase 1: Authentication & User Management (Core)

- [ ] Task 1.1: Setup session/auth helpers (JWT or database-session token cookies).
- [ ] Task 1.2: Build `/register` page and API validation (name, email, password, whatsapp).
- [ ] Task 1.3: Build `/login` page (handling both customer and admin redirection).
- [ ] Task 1.4: Implement auth check middlewares for protected customer routes (`/checkout`, `/dashboard/*`) and admin routes (`/admin/*`).

---

## Phase 2: Catalog & Landing Page (Public)

- [ ] Task 2.1: Implement database seeding for initial products (for local testing).
- [ ] Task 2.2: Design & build Landing Page (`/` route) containing product grids, category filtering, and search functionality.
- [ ] Task 2.3: Build Product Detail Page (`/products/$productId`) displaying price, duration, features, and the "Order Sekarang" CTA.

---

## Phase 3: Checkout & Payment Integration

- [ ] Task 3.1: Build Checkout Page (`/checkout`) with pre-filled user metadata and payment gateway selection (Pakasir / Midtrans).
- [ ] Task 3.2: Implement server-side checkout handler (creating database orders with `menunggu_pembayaran` status and initializing gateway links).
- [ ] Task 3.3: Implement webhook endpoints (`/api/webhooks/midtrans` and `/api/webhooks/pakasir`) to verify signatures and update order status to `menunggu_aktivasi`.
- [ ] Task 3.4: Integrate Resend (email) and Fonnte (WhatsApp) notifications for successful payments.

---

## Phase 4: User Dashboard (Customer Panel)

- [ ] Task 4.1: Build Customer Main Dashboard (`/dashboard`) showing active subscriptions, remaining duration, and credential access.
- [ ] Task 4.2: Build Order History Page (`/dashboard/orders`) listing past transactions and payment links for pending invoices.
- [ ] Task 4.3: Build User Profile Page (`/dashboard/profile`) to update account info and change passwords.

---

## Phase 5: Admin Panel (CRUD & Operations)

- [ ] Task 5.1: Build `/admin/dashboard` showing operational metrics (revenue, active users, pending order alerts).
- [ ] Task 5.2: Build Product Management CRUD (`/admin/products`) with photo upload support (integrated with RustFS storage).
- [ ] Task 5.3: Build Order Fulfillment Panel (`/admin/orders`) for manual activation, credential entry (storing encrypted passwords), and WA/Email credentials dispatch.
- [ ] Task 5.4: Build User Management (`/admin/users`) with search, filter, and user blocking/unblocking tools.
- [ ] Task 5.5: Build System Settings (`/admin/settings`) to edit branding details and WA/Email notification templates.

---

## Phase 6: System Automation (Cron Jobs)

- [ ] Task 6.1: Develop background task/cron endpoint (`/api/cron/auto-deduct`) to decrement remaining subscription duration by 1 month.
- [ ] Task 6.2: Implement notifications dispatch for warning users at remaining duration = 1 month, and expiring accounts at remaining duration = 0.

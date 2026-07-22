# Coding Standards & Rules — OneSubscribe

This document outlines the design constraints, coding standards, and project-specific rules to be adhered to during development.

---

## 1. General Constraints
- **Language:** Strictly TypeScript (no `any` types unless absolutely unavoidable).
- **Environment Boundaries:** Make clear distinctions between client and server execution. Use `createServerFn` for server logic and mark server files accordingly (`.server.ts`).
- **Dependencies:** Avoid adding external packages unless they are absolutely necessary. Standardize on the existing project choices (Drizzle, React 19, Tailwind CSS).

## 2. Database & ORM Rules
- **Type Safety:** Always infer types directly from Drizzle schema instead of manually declaring matching TypeScript interfaces.
- **Transactions:** Use database transactions (`db.transaction(...)`) for operations that perform multi-step inserts or updates (e.g., checkout order creation, user registration).
- **Sensitive Data:** Always encrypt credential passwords and account details before saving them to the database. Use AES-256-GCM.

## 3. UI/UX & Styling Rules
- **Modern Aesthetics:** Implement sleeker dark/light interfaces using tailwind tokens, rounded borders, clear transitions, and glassmorphism cards.
- **Form Validation:** Use `zod` for validating form inputs on both client and server sides.
- **Redirects:** Use TanStack Router's `redirect()` function inside loaders or route settings to block unauthenticated access.

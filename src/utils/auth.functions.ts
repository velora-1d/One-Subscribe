import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import { setSessionCookie, deleteSessionCookie, getSessionUser } from './auth.server';
import type { UserSession } from './auth.server';

// Registration input schema
const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  whatsapp: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
});

// Login input schema
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
});

// Profile update schema
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  whatsapp: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
});

// Password change schema
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

/**
 * Server function to register a new user.
 */
export const registerUser = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: any }) => {
    const parseResult = registerSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || 'Data registrasi tidak valid.',
      };
    }

    const { name, email, password, whatsapp } = parseResult.data;

    // Check if email already exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUsers.length > 0) {
      return { success: false, error: 'Email sudah terdaftar. Silakan gunakan email lain.' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into DB
    const [insertedUser] = await db
      .insert(users)
      .values({
        name,
        email,
        whatsapp,
        passwordHash,
        role: 'customer', // Default role
        isActive: true,
      })
      .returning();

    if (!insertedUser) {
      return { success: false, error: 'Gagal mendaftarkan user baru.' };
    }

    const sessionUser: UserSession = {
      userId: insertedUser.id,
      name: insertedUser.name,
      email: insertedUser.email,
      whatsapp: insertedUser.whatsapp,
      role: insertedUser.role,
    };

    // Set session cookie
    setSessionCookie(sessionUser);

    return {
      success: true,
      user: sessionUser,
    };
  });

/**
 * Server function to login an existing user.
 */
export const loginUser = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: any }) => {
    const parseResult = loginSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || 'Email atau password tidak valid.',
      };
    }

    const { email, password } = parseResult.data;

    // Find user in DB
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return { success: false, error: 'Email atau password salah.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.' };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Email atau password salah.' };
    }

    const sessionUser: UserSession = {
      userId: user.id,
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp,
      role: user.role,
    };

    // Set session cookie
    setSessionCookie(sessionUser);

    return {
      success: true,
      user: sessionUser,
    };
  });

/**
 * Server function to logout the user.
 */
export const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  deleteSessionCookie();
  return { success: true };
});

/**
 * Server function to retrieve current user info.
 */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  const user = getSessionUser();
  return { user };
});

/**
 * Server function to update the authenticated user's profile info.
 */
export const updateProfile = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: any }) => {
    const user = getSessionUser();
    if (!user) {
      return { success: false, error: 'Akses tidak diijinkan. Silakan login kembali.' };
    }

    const parseResult = updateProfileSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || 'Data profil tidak valid.',
      };
    }

    const { name, email, whatsapp } = parseResult.data;

    // Check if email already used by another user
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== user.userId) {
      return { success: false, error: 'Email sudah digunakan oleh akun lain.' };
    }

    // Update in DB
    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        email,
        whatsapp,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId))
      .returning();

    if (!updatedUser) {
      return { success: false, error: 'Gagal memperbarui profil.' };
    }

    const newSession: UserSession = {
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      whatsapp: updatedUser.whatsapp,
      role: updatedUser.role,
    };

    setSessionCookie(newSession);

    return { success: true, user: newSession };
  });

/**
 * Server function to change the authenticated user's password.
 */
export const changePassword = createServerFn({ method: 'POST' })
  .handler(async ({ data }: { data: any }) => {
    const user = getSessionUser();
    if (!user) {
      return { success: false, error: 'Akses tidak diijinkan. Silakan login kembali.' };
    }

    const parseResult = changePasswordSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.errors[0]?.message || 'Input password tidak valid.',
      };
    }

    const { oldPassword, newPassword } = parseResult.data;

    // Fetch user from DB
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.userId))
      .limit(1);

    if (!dbUser) {
      return { success: false, error: 'User tidak ditemukan.' };
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, dbUser.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Password lama yang Anda masukkan salah.' };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.userId));

    return { success: true };
  });

export const verifyAdminPin = createServerFn({ method: 'POST' })
  .validator((pin: string) => z.string().min(1).parse(pin))
  .handler(async ({ data: pin }) => {
    const user = getSessionUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Akses ditolak.' };
    }

    const [dbUser] = await db
      .select({ pin: users.pin })
      .from(users)
      .where(eq(users.id, user.userId))
      .limit(1);

    if (!dbUser) {
      return { success: false, error: 'User tidak ditemukan.' };
    }

    if (dbUser.pin === pin) {
      return { success: true };
    }

    return { success: false, error: 'PIN Admin salah.' };
  });

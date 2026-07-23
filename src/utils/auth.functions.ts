import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

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
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const parseResult = registerSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Data registrasi tidak valid.',
      };
    }

    const { registerUserServer } = await import('./auth.server');
    return registerUserServer(parseResult.data);
  });

/**
 * Server function to login an existing user.
 */
export const loginUser = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const parseResult = loginSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Email atau password tidak valid.',
      };
    }

    const { loginUserServer } = await import('./auth.server');
    return loginUserServer(parseResult.data);
  });

/**
 * Server function to logout the user.
 */
export const logoutUser = createServerFn({ method: 'POST' }).handler(async () => {
  const { deleteSessionCookie } = await import('./auth.server');
  deleteSessionCookie();
  return { success: true, error: null };
});

/**
 * Server function to retrieve current user info.
 */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  const { getSessionUser } = await import('./auth.server');
  const user = getSessionUser();
  return { user };
});

/**
 * Server function to update the authenticated user's profile info.
 */
export const updateProfile = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user) {
      return { success: false, error: 'Akses tidak diijinkan. Silakan login kembali.' };
    }

    const parseResult = updateProfileSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Data profil tidak valid.',
      };
    }

    const { updateProfileServer } = await import('./auth.server');
    return updateProfileServer(parseResult.data, user);
  });

/**
 * Server function to change the authenticated user's password.
 */
export const changePassword = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user) {
      return { success: false, error: 'Akses tidak diijinkan. Silakan login kembali.' };
    }

    const parseResult = changePasswordSchema.safeParse(data);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || 'Input password tidak valid.',
      };
    }

    const { changePasswordServer } = await import('./auth.server');
    return changePasswordServer(parseResult.data, user);
  });

export const verifyAdminPin = createServerFn({ method: 'POST' })
  .validator((pin: string) => z.string().min(1).parse(pin))
  .handler(async ({ data: pin }) => {
    const { getSessionUser } = await import('./auth.server');
    const user = getSessionUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Akses ditolak.' };
    }

    const { verifyAdminPinServer } = await import('./auth.server');
    return verifyAdminPinServer(pin, user);
  });

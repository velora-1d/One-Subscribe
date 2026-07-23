import crypto from 'crypto';
import dotenv from 'dotenv';
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}

const COOKIE_NAME = 'onesubscribe_session';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  whatsapp: string;
  role: 'customer' | 'admin';
}

function base64UrlEncode(str: string | Buffer): string {
  const base64 = typeof str === 'string' ? Buffer.from(str).toString('base64') : str.toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Creates a signed JWT token containing the payload.
 */
export function signToken(payload: UserSession, expiresInDays = 30): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET!)
    .update(signatureInput)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Verifies a JWT token and returns its payload if valid, otherwise returns null.
 */
export function verifyToken(token: string): UserSession | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET!)
      .update(signatureInput)
      .digest();

    const expectedEncodedSignature = base64UrlEncode(expectedSignature);

    if (encodedSignature !== expectedEncodedSignature) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Expired
    }

    return {
      userId: payload.userId,
      name: payload.name,
      email: payload.email,
      whatsapp: payload.whatsapp,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Gets the current logged-in user from request cookies.
 * Safe to call in loaders and server functions.
 */
export function getSessionUser(): UserSession | null {
  const sessionCookie = getCookie(COOKIE_NAME);
  if (!sessionCookie) return null;

  return verifyToken(sessionCookie);
}

/**
 * Sets the authentication cookie with a signed token.
 */
export function setSessionCookie(user: UserSession): void {
  const token = signToken(user);
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears the session cookie logging out the user.
 */
export function deleteSessionCookie(): void {
  deleteCookie(COOKIE_NAME, {
    path: '/',
  });
}

export async function registerUserServer(data: any) {
  const { name, email, password, whatsapp } = data;

  const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUsers.length > 0) {
    return { success: false, error: 'Email sudah terdaftar. Silakan gunakan email lain.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [insertedUser] = await db
    .insert(users)
    .values({
      name,
      email,
      whatsapp,
      passwordHash,
      role: 'customer',
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

  setSessionCookie(sessionUser);

  return {
    success: true,
    error: null,
    user: sessionUser,
  };
}

export async function loginUserServer(data: any) {
  const { email, password } = data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return { success: false, error: 'Email atau password salah.' };
  }

  if (!user.isActive) {
    return { success: false, error: 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.' };
  }

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

  setSessionCookie(sessionUser);

  return {
    success: true,
    error: null,
    user: sessionUser,
  };
}

export async function updateProfileServer(data: any, user: UserSession) {
  const { name, email, whatsapp } = data;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0 && existing[0].id !== user.userId) {
    return { success: false, error: 'Email sudah digunakan oleh akun lain.' };
  }

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

  return { success: true, error: null, user: newSession };
}

export async function changePasswordServer(data: any, user: UserSession) {
  const { oldPassword, newPassword } = data;

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.userId))
    .limit(1);

  if (!dbUser) {
    return { success: false, error: 'User tidak ditemukan.' };
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, dbUser.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: 'Password lama yang Anda masukkan salah.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.userId));

  return { success: true, error: null };
}

export async function verifyAdminPinServer(pin: string, user: UserSession) {
  const [dbUser] = await db
    .select({ pin: users.pin })
    .from(users)
    .where(eq(users.id, user.userId))
    .limit(1);

  if (!dbUser) {
    return { success: false, error: 'User tidak ditemukan.' };
  }

  if (dbUser.pin === pin) {
    return { success: true, error: null };
  }

  return { success: false, error: 'PIN Admin salah.' };
}

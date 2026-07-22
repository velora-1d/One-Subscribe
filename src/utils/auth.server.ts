import crypto from 'crypto';
import dotenv from 'dotenv';
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';

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

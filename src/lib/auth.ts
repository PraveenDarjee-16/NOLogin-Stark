import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'cloud_desktop_session';
const DEFAULT_SECRET = 'stark_industries_quantum_key_2026_super_secure';

function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface AuthSession {
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function createSessionToken(username: string): Promise<string> {
  const secret = getJwtSecret();
  const token = await new SignJWT({ username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30-day session
    .sign(secret);
  return token;
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthSession;
  } catch (error) {
    return null;
  }
}

export async function verifyCredentials(password: string, username?: string): Promise<boolean> {
  const envUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  const inputUser = username?.trim().toLowerCase() || '';

  // If bcrypt hash is configured, use bcrypt comparison
  if (expectedPasswordHash) {
    if (envUsername && inputUser && inputUser !== envUsername) return false;
    return await bcrypt.compare(password, expectedPasswordHash);
  }

  // If explicit environment variables are configured in Vercel:
  if (envUsername && envPassword) {
    if (inputUser && inputUser === envUsername && password === envPassword) {
      return true;
    }
  }

  // Fallback defaults: allows admin / stark2026! or Praveen / Praveen@123
  if ((!inputUser || inputUser === 'admin') && password === (envPassword || 'stark2026!')) {
    return true;
  }
  if ((!inputUser || inputUser === 'praveen') && (password === 'Praveen@123' || password === envPassword)) {
    return true;
  }

  return false;
}

export async function getSessionFromCookies(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<AuthSession | null> {
  const token =
    req.cookies.get(COOKIE_NAME)?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  return await verifySessionToken(token);
}

export function getAuthCookieConfig(token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

export function getClearAuthCookieConfig() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

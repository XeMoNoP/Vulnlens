import { cookies } from 'next/headers';
import { db } from './db';
import { User } from './types';

const COOKIE_NAME = 'vulnlens_session';

export interface SessionData {
  userId: number;
  username: string;
  role: 'admin' | 'customer';
  created: number;
}

export function createSessionToken(user: User): string {
  const data: SessionData = {
    userId: user.id,
    username: user.username,
    role: user.role,
    created: Date.now(),
  };
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function parseSessionToken(token: string): SessionData | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(raw) as SessionData;
    if (data && data.userId && data.role) {
      return data;
    }
  } catch {
    // invalid token
  }
  return null;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = parseSessionToken(token);
    if (!session) return null;

    const user = db.getUserById(session.userId);
    return user || null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: User) {
  const mode = db.getSecurityMode();
  const token = createSessionToken(user);
  const cookieStore = await cookies();

  // VULN-005: Dual Mode CSRF Protection
  if (mode === 'SECURE') {
    // SECURE MODE: Strict SameSite and HttpOnly
    cookieStore.set(COOKIE_NAME, token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } else {
    // VULNERABLE LAB MODE: SameSite relaxed or omitted, allowing cross-site forged requests
    cookieStore.set(COOKIE_NAME, token, {
      path: '/',
      httpOnly: false, // script-readable for XSS theft
      secure: false,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

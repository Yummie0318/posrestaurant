import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';

const COOKIE_NAME = 'pospancitan_session';

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

export async function authenticateUser(username: string, password: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({ where: { username } });
  if (!user || !user.active) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  } satisfies SessionUser;
}

export async function createSessionCookie(user: SessionUser): Promise<void> {
  const token = jwt.sign(user, getJwtSecret(), { expiresIn: '7d' });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (allowedRoles && !allowedRoles.includes(user.role)) redirect('/unauthorized');
  return user;
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.CASHIER:
      return '/cashier';
    case UserRole.KITCHEN:
      return '/kitchen';
    default:
      return '/login';
  }
}

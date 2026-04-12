import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'quotesnap-local-dev-secret-change-in-production-xyz-123'
)

const COOKIE_NAME = 'qs-session'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'quotesnap-salt').digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export async function createSessionToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifySessionToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function getSessionFromCookies(): Promise<{ userId: string; email: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifySessionToken(token)
  } catch {
    return null
  }
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }
}

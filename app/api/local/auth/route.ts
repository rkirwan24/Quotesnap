import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, createUser } from '@/lib/db'
import { hashPassword, verifyPassword, createSessionToken, getSessionCookieOptions, getSessionFromCookies } from '@/lib/local/auth'

// POST /api/local/auth  — sign-in, sign-up, sign-out, get-user
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body

  if (action === 'sign-up') {
    const { email, password, contact_name } = body
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    const user = await createUser(email, hashPassword(password), contact_name)
    const token = await createSessionToken(user.id as string, email)
    const response = NextResponse.json({ user })
    response.cookies.set({ ...getSessionCookieOptions(), value: token })
    return response
  }

  if (action === 'sign-in') {
    const { email, password } = body
    const user = await getUserByEmail(email)
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const token = await createSessionToken(user.id as string, email)
    const response = NextResponse.json({ user: { id: user.id, email: user.email } })
    response.cookies.set({ ...getSessionCookieOptions(), value: token })
    return response
  }

  if (action === 'sign-out') {
    const response = NextResponse.json({ success: true })
    response.cookies.delete('qs-session')
    return response
  }

  if (action === 'get-user') {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ user: null })
    return NextResponse.json({ user: { id: session.userId, email: session.email } })
  }

  if (action === 'magic-link') {
    const { email } = body
    let user = await getUserByEmail(email)
    if (!user) {
      user = await createUser(email, hashPassword(Math.random().toString(36))) as unknown as typeof user
    }
    const token = await createSessionToken(user!.id as string, email)
    const response = NextResponse.json({ token, user: { id: user!.id, email } })
    response.cookies.set({ ...getSessionCookieOptions(), value: token })
    return response
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

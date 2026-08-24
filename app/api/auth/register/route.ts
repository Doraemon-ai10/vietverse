import { NextResponse } from 'next/server'
import { dbQuery, hashPassword, signSession } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json()
    const key = typeof email === 'string' ? email.toLowerCase().trim() : ''
    const name = typeof username === 'string' ? username.trim() : ''
    if (!/^\S+@\S+\.\S+$/.test(key) || !/^[a-zA-Z0-9_]{3,20}$/.test(name) || typeof password !== 'string' || password.length < 8) return NextResponse.json({ error: 'Thông tin đăng ký không hợp lệ.' }, { status: 400 })

    const verified = await dbQuery(`otp_challenges?email=eq.${encodeURIComponent(key)}&verified=eq.true&order=created_at.desc&limit=1`)
    const challenge = Array.isArray(verified) ? verified[0] : null
    if (!challenge || new Date(challenge.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'Hãy xác minh OTP trước. Mã xác minh đã hết hạn.' }, { status: 400 })

    const rows = await dbQuery(`users?select=id&or=(email.eq.${encodeURIComponent(key)},username.eq.${encodeURIComponent(name)})`)
    if (Array.isArray(rows) && rows.length) return NextResponse.json({ error: 'Email hoặc username đã tồn tại.' }, { status: 409 })
    const { hash, salt } = hashPassword(password)
    const created = await dbQuery('users', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ email: key, username: name, password_hash: hash, password_salt: salt, email_verified: true }) })
    const user = Array.isArray(created) ? created[0] : null
    if (!user?.id) return NextResponse.json({ error: 'Không tạo được tài khoản.' }, { status: 500 })
    await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(challenge.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ verified: true }) })
    const response = NextResponse.json({ ok: true, user: { id: user.id, username: name, email: key } })
    response.cookies.set('vv_session', signSession({ id: user.id, username: name }), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
    return response
  } catch (e) {
    console.error('Register error:', e)
    if (e instanceof Error && (e.message === 'DATABASE_NOT_CONFIGURED' || e.message === 'SESSION_SECRET_NOT_CONFIGURED')) return NextResponse.json({ error: 'Server chưa cấu hình đầy đủ database/session trên Vercel.' }, { status: 503 })
    return NextResponse.json({ error: 'Không thể tạo tài khoản.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { dbQuery } from '../../../../lib/auth'
import { hashOtp } from '../../../../lib/otp-store'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()
    if (typeof email !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) return NextResponse.json({ error: 'Mã OTP phải gồm 6 số.' }, { status: 400 })
    const key = email.toLowerCase().trim()
    const rows = await dbQuery(`otp_challenges?email=eq.${encodeURIComponent(key)}&verified=eq.false&order=created_at.desc&limit=1`)
    const record = Array.isArray(rows) ? rows[0] : null
    if (!record) return NextResponse.json({ error: 'Mã không tồn tại hoặc đã hết hạn.' }, { status: 400 })
    if (new Date(record.expires_at).getTime() < Date.now()) return NextResponse.json({ error: 'Mã đã hết hạn. Hãy yêu cầu mã mới.' }, { status: 400 })
    const attempts = Number(record.attempts || 0) + 1
    if (attempts > 5) {
      await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(record.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ verified: true, attempts }) })
      return NextResponse.json({ error: 'Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới.' }, { status: 429 })
    }
    await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(record.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ attempts }) })
    if (hashOtp(key, otp) !== record.code_hash) return NextResponse.json({ error: `Mã OTP không đúng. Còn ${5 - attempts} lần thử.` }, { status: 400 })
    await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(record.id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ verified: true }) })
    return NextResponse.json({ ok: true, verified: true, message: 'Email đã được xác minh. Hoàn tất đăng ký để tạo tài khoản.' })
  } catch (error) {
    console.error('OTP verification error:', error)
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') return NextResponse.json({ error: 'Database chưa được cấu hình trên Vercel.' }, { status: 503 })
    return NextResponse.json({ error: 'Không thể xác minh OTP.' }, { status: 500 })
  }
}

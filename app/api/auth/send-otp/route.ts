import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { dbQuery } from '../../../../lib/auth'
import { hashOtp } from '../../../../lib/otp-store'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 })
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Server chưa có RESEND_API_KEY.' }, { status: 503 })

    const existing = await dbQuery(`otp_challenges?email=eq.${encodeURIComponent(email)}&verified=eq.false&order=created_at.desc&limit=1`)
    const latest = Array.isArray(existing) ? existing[0] : null
    if (latest && new Date(latest.expires_at).getTime() > Date.now()) return NextResponse.json({ error: 'Mã OTP hiện tại vẫn còn hiệu lực. Hãy kiểm tra Gmail hoặc chờ mã hết hạn.' }, { status: 429 })

    const otp = crypto.randomInt(100000, 1000000).toString()
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const from = process.env.RESEND_FROM_EMAIL || 'VietVerse <onboarding@resend.dev>'
    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], subject: 'VietVerse — Mã xác minh 6 số', text: `Mã xác minh VietVerse của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`, html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>🇻🇳 VietVerse</h2><p>Mã xác minh tài khoản:</p><div style="font-size:40px;font-weight:800;letter-spacing:10px;margin:20px 0">${otp}</div><p>Mã có hiệu lực trong <b>5 phút</b>.</p></div>` })
    })
    if (!resend.ok) {
      let detail = ''
      try { detail = ((await resend.json()) as { message?: string }).message || '' } catch {}
      return NextResponse.json({ error: detail || 'Resend không thể gửi email. Kiểm tra email gửi và domain.' }, { status: 502 })
    }
    await dbQuery('otp_challenges', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ email, code_hash: hashOtp(email, otp), expires_at: expires }) })
    return NextResponse.json({ ok: true, message: 'Đã gửi mã OTP. Hãy kiểm tra Gmail/spam.' })
  } catch (error) {
    console.error('OTP request error:', error)
    if (error instanceof Error && error.message === 'DATABASE_NOT_CONFIGURED') return NextResponse.json({ error: 'Database chưa được cấu hình trên Vercel.' }, { status: 503 })
    return NextResponse.json({ error: 'Không thể gửi OTP. Kiểm tra cấu hình server.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { hashOtp, otpStore } from '@/lib/otp-store'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 })
    }
    const key = email.toLowerCase().trim()
    const existing = otpStore.get(key)
    if (existing && existing.expires > Date.now()) {
      return NextResponse.json({ error: 'Vui lòng chờ mã hiện tại hết hạn trước khi gửi lại.' }, { status: 429 })
    }

    const otp = crypto.randomInt(100000, 1000000).toString()
    otpStore.set(key, { hash: hashOtp(key, otp), expires: Date.now() + 5 * 60 * 1000, attempts: 0 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      otpStore.delete(key)
      return NextResponse.json({ error: 'RESEND_API_KEY chưa được cấu hình trên deployment.' }, { status: 503 })
    }
    const from = process.env.RESEND_FROM_EMAIL || 'VietVerse <onboarding@resend.dev>'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [key],
        subject: '🇻🇳 VietVerse — Mã xác minh',
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>VietVerse 🇻🇳</h2><p>Mã xác minh tài khoản của bạn:</p><div style="font-size:38px;font-weight:800;letter-spacing:9px">${otp}</div><p>Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p></div>`,
      }),
    })
    if (!response.ok) {
      otpStore.delete(key)
      return NextResponse.json({ error: 'Resend không thể gửi email OTP. Hãy kiểm tra domain/from email.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true, message: 'Đã gửi mã OTP.' })
  } catch {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }
}

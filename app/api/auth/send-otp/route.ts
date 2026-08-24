import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { hashOtp, otpStore } from '../../../../lib/otp-store'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Server chưa có RESEND_API_KEY. Hãy thêm biến này trong Vercel và redeploy.' }, { status: 503 })
    }

    const now = Date.now()
    const existing = otpStore.get(email)
    if (existing && existing.expires > now) {
      return NextResponse.json({ error: 'Mã OTP hiện tại vẫn còn hiệu lực. Hãy kiểm tra hộp thư hoặc chờ 5 phút trước khi gửi lại.' }, { status: 429 })
    }

    const otp = crypto.randomInt(100000, 1000000).toString()
    const expires = now + 5 * 60 * 1000
    const from = process.env.RESEND_FROM_EMAIL || 'VietVerse <onboarding@resend.dev>'

    const resend = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'VietVerse — Mã xác minh 6 số',
        text: `Mã xác minh VietVerse của bạn là ${otp}. Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px"><h2>🇻🇳 VietVerse</h2><p>Mã xác minh tài khoản của bạn:</p><div style="font-size:40px;font-weight:800;letter-spacing:10px;margin:20px 0">${otp}</div><p>Mã có hiệu lực trong <b>5 phút</b>.</p><p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email.</p></div>`,
      }),
    })

    if (!resend.ok) {
      let detail = ''
      try {
        const data = await resend.json() as { message?: string }
        detail = data.message || ''
      } catch {}
      console.error('Resend OTP error:', resend.status, detail)
      return NextResponse.json({
        error: detail || 'Resend không thể gửi email. Kiểm tra RESEND_FROM_EMAIL và domain đã xác minh.',
      }, { status: 502 })
    }

    otpStore.set(email, { hash: hashOtp(email, otp), expires, attempts: 0 })
    return NextResponse.json({ ok: true, message: 'Đã gửi mã OTP. Hãy kiểm tra Gmail/spam.' })
  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 })
  }
}

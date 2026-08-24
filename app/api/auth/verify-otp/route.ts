import { NextResponse } from 'next/server'
import { hashOtp, otpStore } from '../../../../lib/otp-store'
import { verifiedEmails } from '../../../../lib/verified-emails'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()
    if (typeof email !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) return NextResponse.json({ error: 'Mã OTP phải gồm 6 số.' }, { status: 400 })
    const key = email.toLowerCase().trim(), record = otpStore.get(key)
    if (!record) return NextResponse.json({ error: 'Mã không tồn tại hoặc đã hết hạn.' }, { status: 400 })
    if (record.expires < Date.now()) { otpStore.delete(key); return NextResponse.json({ error: 'Mã đã hết hạn.' }, { status: 400 }) }
    record.attempts += 1
    if (record.attempts > 5) { otpStore.delete(key); return NextResponse.json({ error: 'Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới.' }, { status: 429 }) }
    if (hashOtp(key, otp) !== record.hash) return NextResponse.json({ error: `Mã OTP không đúng. Còn ${5 - record.attempts} lần thử.` }, { status: 400 })
    verifiedEmails.set(key, Date.now()+10*60*1000)
    return NextResponse.json({ ok: true, verified: true, message: 'Email đã được xác minh. Hoàn tất đăng ký để tạo tài khoản.' })
  } catch { return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 400 }) }
}

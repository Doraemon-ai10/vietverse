import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { dbQuery } from '../../../../lib/auth'

const hashOtp = (email: string, otp: string) => crypto.createHash('sha256').update(`${email}:${otp}:${process.env.SESSION_SECRET || 'vietverse-otp'}`).digest('hex')

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()
    const key = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!/^\S+@\S+\.\S+$/.test(key) || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) return NextResponse.json({ error: 'Email hoặc mã OTP không hợp lệ.' }, { status: 400 })
    const rows = await dbQuery(`otp_challenges?select=id,code_hash,expires_at,attempts&email=eq.${encodeURIComponent(key)}&verified=eq.false&order=created_at.desc&limit=1`) as Array<{id:string;code_hash:string;expires_at:string;attempts:number}>
    const record = rows?.[0]
    if (!record) return NextResponse.json({ error: 'Mã không tồn tại hoặc đã hết hạn.' }, { status: 400 })
    if (new Date(record.expires_at).getTime() < Date.now()) { await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(record.id)}`, {method:'DELETE'}); return NextResponse.json({ error: 'Mã đã hết hạn.' }, { status: 400 }) }
    const attempts = Number(record.attempts || 0) + 1
    if (attempts > 5) { await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(record.id)}`, {method:'DELETE'}); return NextResponse.json({ error: 'Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới.' }, { status: 429 }) }
    if (hashOtp(key, otp) !== record.code_hash) {
      await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(record.id)}`, {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({attempts})})
      return NextResponse.json({ error: `Mã OTP không đúng. Còn ${5-attempts} lần thử.` }, { status: 400 })
    }
    await dbQuery(`otp_challenges?id=eq.${encodeURIComponent(record.id)}`, {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({verified:true})})
    return NextResponse.json({ ok:true, verified:true, message:'Email đã được xác minh. Bạn có thể hoàn tất đăng ký.' })
  } catch (error) { console.error('OTP verify error:',error); return NextResponse.json({error:error instanceof Error && error.message==='DATABASE_NOT_CONFIGURED'?'Database chưa được cấu hình trên Vercel.':'Không thể xác minh OTP.'},{status:500}) }
}

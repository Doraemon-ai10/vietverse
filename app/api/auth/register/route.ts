import { NextResponse } from 'next/server'
import { dbQuery, hashPassword } from '../../../../lib/auth'
import { otpStore } from '../../../../lib/otp-store'

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json()
    const key = typeof email === 'string' ? email.toLowerCase().trim() : ''
    const name = typeof username === 'string' ? username.trim() : ''
    if (!/^\S+@\S+\.\S+$/.test(key) || !/^[a-zA-Z0-9_]{3,20}$/.test(name) || typeof password !== 'string' || password.length < 8) return NextResponse.json({error:'Thông tin đăng ký không hợp lệ.'},{status:400})
    const record = otpStore.get(key)
    if (!record || record.expires < Date.now()) return NextResponse.json({error:'Hãy xác minh OTP trước.'},{status:400})
    const rows = await dbQuery(`users?select=id&or=(email.eq.${encodeURIComponent(key)},username.eq.${encodeURIComponent(name)})`)
    if (Array.isArray(rows) && rows.length) return NextResponse.json({error:'Email hoặc username đã tồn tại.'},{status:409})
    const {hash,salt}=hashPassword(password)
    const created = await dbQuery('users', {method:'POST', headers:{Prefer:'return=representation'}, body:JSON.stringify({email:key,username:name,password_hash:hash,password_salt:salt,email_verified:true})})
    otpStore.delete(key)
    const user = Array.isArray(created) ? created[0] : null
    return NextResponse.json({ok:true,user:{id:user?.id,username:name,email:key}})
  } catch (e) {
    if (e instanceof Error && e.message === 'DATABASE_NOT_CONFIGURED') return NextResponse.json({error:'Database chưa được cấu hình trên Vercel.'},{status:503})
    return NextResponse.json({error:'Không thể tạo tài khoản.'},{status:500})
  }
}

import { NextResponse } from 'next/server'
import { dbQuery, signSession, verifyPassword } from '../../../../lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const key = typeof email === 'string' ? email.toLowerCase().trim() : ''
    if (!/^\S+@\S+\.\S+$/.test(key) || typeof password !== 'string') return NextResponse.json({error:'Email hoặc mật khẩu không hợp lệ.'},{status:400})
    const rows = await dbQuery(`users?select=id,username,email,password_hash,password_salt,email_verified&email=eq.${encodeURIComponent(key)}&limit=1`)
    const user = Array.isArray(rows) ? rows[0] : null
    if (!user || !user.email_verified || !verifyPassword(password,user.password_hash,user.password_salt)) return NextResponse.json({error:'Email hoặc mật khẩu không đúng.'},{status:401})
    const response=NextResponse.json({ok:true,user:{id:user.id,username:user.username,email:user.email}})
    response.cookies.set('vv_session',signSession({id:user.id,username:user.username}),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})
    return response
  } catch (e) {
    if (e instanceof Error && e.message === 'DATABASE_NOT_CONFIGURED') return NextResponse.json({error:'Database chưa được cấu hình trên Vercel.'},{status:503})
    return NextResponse.json({error:'Không thể đăng nhập.'},{status:500})
  }
}

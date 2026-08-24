import { NextResponse } from 'next/server'
import { dbQuery, signSession, verifyPassword } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const key = typeof email === 'string' ? email.toLowerCase().trim() : ''
    if (!/^\S+@\S+\.\S+$/.test(key) || typeof password !== 'string' || password.length < 1) return NextResponse.json({error:'Email hoặc mật khẩu không hợp lệ.'},{status:400})
    const rows = await dbQuery(`users?select=id,username,email,password_hash,password_salt,email_verified,coins,xp,level,avatar&email=eq.${encodeURIComponent(key)}&limit=1`) as Array<{id:string;username:string;email:string;password_hash:string;password_salt:string;email_verified:boolean;coins:number;xp:number;level:number;avatar:string}>
    const user = rows?.[0]
    if (!user || !user.email_verified || !verifyPassword(password,user.password_hash,user.password_salt)) return NextResponse.json({error:'Email hoặc mật khẩu không đúng.'},{status:401})
    const response=NextResponse.json({ok:true,user:{id:user.id,username:user.username,email:user.email,coins:user.coins,xp:user.xp,level:user.level,avatar:user.avatar,email_verified:user.email_verified}})
    response.cookies.set('vv_session',signSession({id:user.id,username:user.username}),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})
    return response
  } catch (e) {
    console.error('Login error:',e)
    if (e instanceof Error && (e.message === 'DATABASE_NOT_CONFIGURED' || e.message === 'SESSION_SECRET_NOT_CONFIGURED')) return NextResponse.json({error:'Server chưa cấu hình database/session.'},{status:503})
    return NextResponse.json({error:'Không thể đăng nhập.'},{status:500})
  }
}

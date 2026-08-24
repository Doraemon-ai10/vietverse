import { NextResponse } from 'next/server'
import { dbQuery, hashPassword, signSession } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    const username = typeof body.username === 'string' ? body.username.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({error:'Email không hợp lệ.'},{status:400})
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return NextResponse.json({error:'Username phải dài 3-20 ký tự, chỉ gồm chữ, số hoặc _. '},{status:400})
    if (password.length < 8) return NextResponse.json({error:'Mật khẩu phải có ít nhất 8 ký tự.'},{status:400})

    const existing = await dbQuery(`users?select=id&or=(email.eq.${encodeURIComponent(email)},username.eq.${encodeURIComponent(username)})&limit=1`) as Array<{id:string}>
    if (existing?.length) return NextResponse.json({error:'Email hoặc username đã tồn tại.'},{status:409})

    const {hash,salt} = hashPassword(password)
    const countRows = await dbQuery('users?select=id&limit=1') as Array<{id:string}>
    const isFirstAccount = !countRows?.length

    const payload = {
      email,
      username,
      password_hash: hash,
      password_salt: salt,
      email_verified: true,
      role: isFirstAccount ? 'owner' : 'player',
      is_verified: isFirstAccount,
      verified_badge: isFirstAccount ? 'official_owner' : null,
    }

    const created = await dbQuery('users',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)}) as Array<{id:string;username:string;email:string;coins:number;xp:number;level:number;avatar:string;email_verified:boolean;role:string;is_verified:boolean;verified_badge:string|null}>
    const user = created?.[0]
    if (!user?.id) return NextResponse.json({error:'Không tạo được tài khoản. Kiểm tra database.'},{status:500})

    const response = NextResponse.json({ok:true,user:{id:user.id,username:user.username,email:user.email,coins:user.coins,xp:user.xp,level:user.level,avatar:user.avatar,email_verified:true,role:user.role,is_verified:user.is_verified,verified_badge:user.verified_badge},owner:isFirstAccount})
    response.cookies.set('vv_session',signSession({id:user.id,username:user.username}),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})
    return response
  } catch (e) {
    console.error('Register error:',e)
    if (e instanceof Error && (e.message==='DATABASE_NOT_CONFIGURED'||e.message==='SESSION_SECRET_NOT_CONFIGURED')) return NextResponse.json({error:'Server chưa cấu hình database/session.'},{status:503})
    return NextResponse.json({error:'Không thể tạo tài khoản. Kiểm tra biến môi trường và database.'},{status:500})
  }
}

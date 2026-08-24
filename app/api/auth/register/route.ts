import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { dbQuery, hashPassword } from '../../../../lib/auth'
export const dynamic = 'force-dynamic'
export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json(); const key=typeof email==='string'?email.toLowerCase().trim():''; const name=typeof username==='string'?username.trim():''
    if(!/^\S+@\S+\.\S+$/.test(key)||!/^[a-zA-Z0-9_]{3,20}$/.test(name)||typeof password!=='string'||password.length<8) return NextResponse.json({error:'Thông tin đăng ký không hợp lệ.'},{status:400})
    const rows=await dbQuery(`users?select=id,email_verified&or=(email.eq.${encodeURIComponent(key)},username.eq.${encodeURIComponent(name)})`) as Array<{id:string;email_verified:boolean}>
    if(rows?.length) return NextResponse.json({error:'Email hoặc username đã tồn tại.'},{status:409})
    const {hash,salt}=hashPassword(password)
    const created=await dbQuery('users',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({email:key,username:name,password_hash:hash,password_salt:salt,email_verified:false})}) as Array<{id:string;username:string}>
    const user=created?.[0]; if(!user?.id) return NextResponse.json({error:'Không tạo được tài khoản.'},{status:500})
    const raw=crypto.randomBytes(32).toString('hex'); const tokenHash=crypto.createHash('sha256').update(raw).digest('hex'); const expires=new Date(Date.now()+24*60*60*1000).toISOString()
    await dbQuery('email_verification_tokens',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({user_id:user.id,token_hash:tokenHash,expires_at:expires,used:false})})
    const apiKey=process.env.RESEND_API_KEY; if(!apiKey) return NextResponse.json({error:'Server thiếu RESEND_API_KEY để gửi email xác minh.'},{status:503})
    const from=process.env.RESEND_FROM_EMAIL||'VietVerse <onboarding@resend.dev>'; const verifyUrl=`${new URL(request.url).origin}/api/auth/verify-email?token=${raw}`
    const mail=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[key],subject:'VietVerse — Xác minh email',text:`Mở liên kết này để xác minh tài khoản VietVerse: ${verifyUrl}. Liên kết có hiệu lực 24 giờ.`,html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px"><h2>🇻🇳 VietVerse</h2><p>Bấm nút bên dưới để xác minh email và kích hoạt tài khoản.</p><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#2878ff;color:white;text-decoration:none;border-radius:10px;font-weight:700">Xác minh email</a><p>Liên kết có hiệu lực 24 giờ.</p></div>`})})
    if(!mail.ok) return NextResponse.json({error:'Không gửi được email xác minh. Kiểm tra Resend.'},{status:502})
    return NextResponse.json({ok:true,pending:true,message:'Hãy mở Gmail và bấm link xác minh để kích hoạt tài khoản.'})
  } catch(e){console.error('Register error:',e);if(e instanceof Error&&e.message==='DATABASE_NOT_CONFIGURED')return NextResponse.json({error:'Database chưa được cấu hình.'},{status:503});return NextResponse.json({error:'Không thể tạo tài khoản.'},{status:500})}
}

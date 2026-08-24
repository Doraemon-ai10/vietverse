import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { dbQuery, signSession } from '../../../../lib/auth'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const url = new URL(request.url); const raw = url.searchParams.get('token') || ''
  if (raw.length < 32) return NextResponse.redirect(new URL('/?email=invalid', request.url))
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')
  try {
    const rows = await dbQuery(`email_verification_tokens?select=id,user_id,expires_at,used&token_hash=eq.${encodeURIComponent(tokenHash)}&used=eq.false&limit=1`) as Array<{id:string;user_id:string;expires_at:string}>
    const token = rows?.[0]
    if (!token || new Date(token.expires_at).getTime() < Date.now()) return NextResponse.redirect(new URL('/?email=expired', request.url))
    const users = await dbQuery(`users?select=id,username& id=eq.${encodeURIComponent(token.user_id)}&limit=1`.replace('?select=id,username& id','?select=id,username&id')) as Array<{id:string;username:string}>
    const user = users?.[0]; if (!user) throw new Error('User not found')
    await dbQuery(`users?id=eq.${encodeURIComponent(user.id)}`, {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({email_verified:true})})
    await dbQuery(`email_verification_tokens?id=eq.${encodeURIComponent(token.id)}`, {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({used:true})})
    const response = NextResponse.redirect(new URL('/?email=verified', request.url))
    response.cookies.set('vv_session', signSession({id:user.id,username:user.username}), {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})
    return response
  } catch (e) { console.error('Verify email:',e); return NextResponse.redirect(new URL('/?email=error', request.url)) }
}

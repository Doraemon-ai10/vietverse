import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { dbQuery, signSession } from '../../../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const reqUrl = new URL(request.url)
  const code = reqUrl.searchParams.get('code')
  if (!code || (provider !== 'google' && provider !== 'discord')) return NextResponse.redirect(new URL('/?oauth=error', request.url))
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const anon = process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.redirect(new URL('/?oauth=missing_config', request.url))
  try {
    const tokenRes = await fetch(`${url}/auth/v1/token?grant_type=authorization_code`, { method:'POST', headers:{apikey:anon,'Content-Type':'application/json'}, body:JSON.stringify({code}) })
    if (!tokenRes.ok) throw new Error('OAuth token exchange failed')
    const token = await tokenRes.json() as { access_token?: string; user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> } }
    if (!token.access_token) throw new Error('No access token')
    const userRes = await fetch(`${url}/auth/v1/user`, { headers:{apikey:anon,Authorization:`Bearer ${token.access_token}`} })
    if (!userRes.ok) throw new Error('OAuth user lookup failed')
    const oauthUser = await userRes.json() as { id:string; email?:string; user_metadata?:Record<string, unknown> }
    const email = (oauthUser.email || '').toLowerCase().trim()
    if (!email) throw new Error('OAuth account has no email')
    const rows = await dbQuery(`users?select=id,username,email,coins,xp,level,avatar,email_verified&email=eq.${encodeURIComponent(email)}&limit=1`) as Array<{id:string;username:string}>
    let user = rows?.[0]
    if (!user) {
      const base = String(oauthUser.user_metadata?.user_name || oauthUser.user_metadata?.preferred_username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g,'').slice(0,16) || 'VietPlayer'
      let username = base
      for (let i=1; i<100; i++) {
        const taken = await dbQuery(`users?select=id&username=eq.${encodeURIComponent(username)}&limit=1`) as unknown[]
        if (!taken.length) break
        username = `${base}${i}`.slice(0,20)
      }
      const salt = crypto.randomBytes(16).toString('hex')
      const placeholder = crypto.randomBytes(32).toString('hex')
      const created = await dbQuery('users', {method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({email,username,password_hash:placeholder,password_salt:salt,email_verified:true})}) as Array<{id:string;username:string}>
      user = created?.[0]
    }
    if (!user?.id) throw new Error('Could not create OAuth profile')
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('vv_session', signSession({id:user.id,username:user.username}), {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30})
    return response
  } catch (error) {
    console.error('OAuth callback:', error)
    return NextResponse.redirect(new URL('/?oauth=error', request.url))
  }
}

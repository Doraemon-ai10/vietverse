import { NextResponse } from 'next/server'
import { dbQuery, signSession } from '../../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  if (provider !== 'google' && provider !== 'discord') return NextResponse.json({ error: 'OAuth provider không hợp lệ.' }, { status: 400 })
  const url = process.env.SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trên Vercel.' }, { status: 503 })
  const origin = new URL(request.url).origin
  const callback = `${origin}/api/auth/oauth/${provider}/callback`
  const authUrl = `${url.replace(/\/$/, '')}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(callback)}`
  return NextResponse.redirect(authUrl)
}

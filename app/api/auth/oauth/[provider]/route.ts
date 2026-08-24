import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  if (provider !== 'google' && provider !== 'discord') return NextResponse.json({ error: 'OAuth provider không hợp lệ.' }, { status: 400 })
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const anon = process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trên Netlify.' }, { status: 503 })
  const origin = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') || new URL(request.url).origin
  const callback = `${origin}/api/auth/oauth/${provider}/callback`
  const authUrl = `${url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(callback)}`
  return NextResponse.redirect(authUrl)
}

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
  const anon = process.env.SUPABASE_ANON_KEY
  if (!url || !anon) return NextResponse.json({ error: 'Supabase Realtime chưa được cấu hình.' }, { status: 503 })
  return NextResponse.json({ url, anon, ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}

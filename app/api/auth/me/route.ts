import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, readSession } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session=readSession(request.cookies.get('vv_session')?.value)
  if(!session) return NextResponse.json({user:null})
  try{
    const rows=await dbQuery(`users?select=id,username,email,coins,xp,level,avatar,email_verified,role,is_verified,verified_badge,created_at&id=eq.${encodeURIComponent(session.id)}&limit=1`) as Array<Record<string,unknown>>
    return NextResponse.json({user:rows?.[0]??null})
  }catch(e){ console.error('Me error:',e); return NextResponse.json({user:null}) }
}

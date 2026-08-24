import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, readSession } from '../../../../lib/auth'

export async function GET(request: NextRequest) {
  const session=readSession(request.cookies.get('vv_session')?.value)
  if(!session) return NextResponse.json({user:null})
  try{
    const rows=await dbQuery(`users?select=id,username,email,coins,xp,level,avatar,email_verified&id=eq.${encodeURIComponent(session.id)}&limit=1`)
    return NextResponse.json({user:Array.isArray(rows)?rows[0]??null:null})
  }catch{return NextResponse.json({user:null})}
}

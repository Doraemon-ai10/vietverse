import crypto from 'node:crypto'

export type UserRecord = { id: string; username: string; email: string; password_hash: string; password_salt: string; coins: number; xp: number; level: number; avatar: string; email_verified: boolean }

const db = () => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('DATABASE_NOT_CONFIGURED')
  return { url: url.replace(/\/$/, ''), key }
}

export async function dbQuery(path: string, init: RequestInit = {}) {
  const { url, key } = db()
  const headers = new Headers(init.headers)
  headers.set('apikey', key); headers.set('Authorization', `Bearer ${key}`); headers.set('Content-Type', 'application/json')
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers, cache: 'no-store' })
  const text = await response.text()
  let data: unknown = null; try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!response.ok) throw new Error(typeof data === 'object' && data && 'message' in data ? String((data as {message:string}).message) : `DATABASE_${response.status}`)
  return data
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const actual = crypto.scryptSync(password, salt, 64)
  return crypto.timingSafeEqual(actual, Buffer.from(hash, 'hex'))
}

const sessionSecret = () => process.env.SESSION_SECRET || process.env.RESEND_API_KEY || 'CHANGE_ME_IN_VERCEL'
export function signSession(payload: { id: string; username: string }) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}
export function readSession(value: string | undefined) {
  if (!value) return null
  const [body, sig] = value.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try { return JSON.parse(Buffer.from(body, 'base64url').toString()) as {id:string;username:string} } catch { return null }
}

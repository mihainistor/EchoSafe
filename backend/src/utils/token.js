import { createHmac } from 'crypto'

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me'
const EXP_MIN = parseInt(process.env.TOKEN_EXP_MIN || '60', 10)

function b64url(input) {
  return Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function sign(data) {
  const h = createHmac('sha256', SECRET).update(data).digest('base64')
  return h.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function issueToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const full = { ...payload, iat: now, exp: now + EXP_MIN * 60 }
  const h = b64url(header)
  const p = b64url(full)
  const s = sign(`${h}.${p}`)
  return `${h}.${p}.${s}`
}

export function verifyToken(token) {
  const parts = String(token).split('.')
  if (parts.length !== 3) throw new Error('invalid')
  const [h, p, s] = parts
  const expSig = sign(`${h}.${p}`)
  if (s !== expSig) throw new Error('invalid')
  const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && now > payload.exp) throw new Error('expired')
  return payload
}

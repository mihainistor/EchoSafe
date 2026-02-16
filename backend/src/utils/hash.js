import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto'

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const calc = pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(calc, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

import { Router } from 'express'
import { trackOtpRequest, getOtpEntry, setOtpEntry, deleteOtpEntry } from '../store.js'
import { randomUUID } from 'crypto'
import { hashPassword, verifyPassword, hashOtp, verifyOtp } from '../utils/hash.js'
import { issueToken, verifyToken } from '../utils/token.js'
// removed email provider
import { findUserByEmail, insertUser } from '../repositories/userRepo.js'
import { isEmail, isE164, isSixDigits, inLen } from '../utils/validate.js'
import { insertOtpAudit } from '../repositories/auditRepo.js'

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, msisdn_admin, first_name, last_name } = req.body || {}
    console.log('Register attempt:', { email, hasPassword: !!password, msisdn_admin, hasFirstName: !!first_name, hasLastName: !!last_name })
    if (!email || !password || !msisdn_admin) {
      return res.status(400).json({ error: 'email, password, msisdn_admin required' })
    }
    if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' })
    if (!inLen(password, 8, 120)) return res.status(400).json({ error: 'invalid_password' })
    if (!isE164(String(msisdn_admin))) return res.status(400).json({ error: 'invalid_msisdn' })
    const existsDb = await Promise.resolve(findUserByEmail(email))
    if (existsDb) return res.status(409).json({ error: 'User already exists' })
    const user_id = randomUUID()
    const passwordHash = hashPassword(password)
    const user = {
      user_id,
      email,
      msisdn_admin,
      ...(first_name != null && { first_name: String(first_name) }),
      ...(last_name != null && { last_name: String(last_name) }),
      passwordHash,
      notification_pref: { push: true, sms: true, smsWhenNoInternet: true, smsOnNoGoZone: true, smsOnDeviation: true },
      created_at: new Date().toISOString(),
    }
    await Promise.resolve(insertUser(user))
    const token = issueToken({ sub: user_id })
    res.json({
      token,
      user: {
        user_id,
        email,
        msisdn_admin,
        ...(user.first_name != null && { first_name: user.first_name }),
        ...(user.last_name != null && { last_name: user.last_name }),
        notification_pref: user.notification_pref,
      },
    })
  } catch (e) {
    console.error('Register error:', e && e.stack ? e.stack : e)
    res.status(500).json({ error: 'Internal error during register' })
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    console.log('Login attempt:', { email, hasPassword: !!password })
    if (!email || !password) return res.status(400).json({ error: 'email, password required' })
    if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' })
    const user = await Promise.resolve(findUserByEmail(email))
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = verifyPassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = issueToken({ sub: user.user_id })
    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        msisdn_admin: user.msisdn_admin,
        ...(user.first_name != null && { first_name: user.first_name }),
        ...(user.last_name != null && { last_name: user.last_name }),
        notification_pref: user.notification_pref,
      },
    })
  } catch (e) {
    console.error('Login error:', e && e.stack ? e.stack : e)
    res.status(500).json({ error: 'Internal error during login' })
  }
})

authRouter.post('/logout', (req, res) => {
  const auth = req.headers.authorization || ''
  if (!auth) return res.json({ ok: true })
  try {
    verifyToken(auth.split(' ')[1])
  } catch (e) { void e }
  res.json({ ok: true })
})

authRouter.post('/otp/request', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'email required' })
    if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' })
    const count = trackOtpRequest(email, ip)
    if (count > 3) return res.status(429).json({ error: 'too_many_requests' })
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const hashed = hashOtp(code)
    const now = Date.now()
    const entry = {
      hash: hashed,
      attemptsLeft: 5,
      expiresAt: now + 5 * 60 * 1000,
      resendAvailableAt: now + 60 * 1000,
      createdAt: now,
    }
    setOtpEntry(email, entry)
    const payload = { ok: true, resend_after_sec: 60 }
    if (String(process.env.DEBUG_EMAIL || '') === '1') {
      payload.debug_code = code
    }
    try { await insertOtpAudit({ type: 'request', email, ip: String(ip || ''), ok: true, at: new Date().toISOString() }) } catch (e) { void e }
    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: 'internal_error' })
  }
})

authRouter.post('/otp/resend', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'email required' })
    if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' })
    const entry = getOtpEntry(email)
    if (!entry) return res.status(400).json({ error: 'no_active_otp' })
    const now = Date.now()
    if (now < entry.resendAvailableAt) {
      const left = Math.ceil((entry.resendAvailableAt - now) / 1000)
      return res.status(429).json({ error: 'resend_too_soon', retry_after_sec: left })
    }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const hashed = hashOtp(code)
    const upd = {
      ...entry,
      hash: hashed,
      attemptsLeft: 5,
      expiresAt: now + 5 * 60 * 1000,
      resendAvailableAt: now + 60 * 1000,
    }
    setOtpEntry(email, upd)
    const payload = { ok: true, resend_after_sec: 60 }
    if (String(process.env.DEBUG_EMAIL || '') === '1') {
      payload.debug_code = code
    }
    try { await insertOtpAudit({ type: 'resend', email, ok: true, at: new Date().toISOString() }) } catch (e) { void e }
    res.json(payload)
  } catch {
    res.status(500).json({ error: 'internal_error' })
  }
})

authRouter.post('/otp/verify', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    const email = String(req.body?.email || '').trim().toLowerCase()
    const code = String(req.body?.code || '').trim()
    if (!email || !code) return res.status(400).json({ error: 'email, code required' })
    if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' })
    if (!isSixDigits(code)) return res.status(400).json({ error: 'invalid_code_format' })
    const entry = getOtpEntry(email)
    if (!entry) {
      await insertOtpAudit({ type: 'verify', email, ip: String(ip || ''), ok: false, reason: 'no_entry', at: new Date().toISOString() })
      return res.status(400).json({ error: 'invalid_or_expired' })
    }
    if (entry.attemptsLeft <= 0) {
      deleteOtpEntry(email)
      await insertOtpAudit({ type: 'verify', email, ip: String(ip || ''), ok: false, reason: 'too_many_attempts', at: new Date().toISOString() })
      return res.status(400).json({ error: 'too_many_attempts' })
    }
    const ok = verifyOtp(code, entry.hash)
    if (!ok) {
      const left = entry.attemptsLeft - 1
      if (left <= 0) {
        deleteOtpEntry(email)
      } else {
        setOtpEntry(email, { ...entry, attemptsLeft: left })
      }
      await insertOtpAudit({ type: 'verify', email, ip: String(ip || ''), ok: false, reason: 'invalid_code', at: new Date().toISOString() })
      return res.status(401).json({ error: 'invalid_code', attempts_left: Math.max(0, left) })
    }
    deleteOtpEntry(email)
    let user = await Promise.resolve(findUserByEmail(email))
    if (!user) {
      const user_id = randomUUID()
      user = { user_id, email, msisdn_admin: null, created_at: new Date().toISOString(), notification_pref: { push: true, sms: true, smsWhenNoInternet: true, smsOnNoGoZone: true, smsOnDeviation: true } }
      await Promise.resolve(insertUser(user))
    }
    const token = issueToken({ sub: user.user_id })
    await insertOtpAudit({ type: 'verify', email, ip: String(ip || ''), ok: true, at: new Date().toISOString() })
    res.json({
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        msisdn_admin: user.msisdn_admin,
        notification_pref: user.notification_pref,
      },
    })
  } catch {
    res.status(500).json({ error: 'internal_error' })
  }
})

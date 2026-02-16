import { Router } from 'express'
import { users } from '../store.js'
import { randomUUID } from 'crypto'
import { hashPassword, verifyPassword } from '../utils/hash.js'
import { issueToken, verifyToken } from '../utils/token.js'

export const authRouter = Router()

authRouter.post('/register', (req, res) => {
  try {
    const { email, password, msisdn_admin, first_name, last_name } = req.body || {}
    console.log('Register attempt:', { email, hasPassword: !!password, msisdn_admin, hasFirstName: !!first_name, hasLastName: !!last_name })
    if (!email || !password || !msisdn_admin) {
      return res.status(400).json({ error: 'email, password, msisdn_admin required' })
    }
    const exists = [...users.values()].find((u) => u.email === email || u.msisdn_admin === msisdn_admin)
    if (exists) return res.status(409).json({ error: 'User already exists' })
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
    users.set(user_id, user)
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

authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {}
    console.log('Login attempt:', { email, hasPassword: !!password })
    if (!email || !password) return res.status(400).json({ error: 'email, password required' })
    const user = [...users.values()].find((u) => u.email === email)
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
  } catch {}
  res.json({ ok: true })
})

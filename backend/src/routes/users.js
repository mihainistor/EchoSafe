import { Router } from 'express'
import { users } from '../store.js'
import { requireAuth } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.use(requireAuth)

usersRouter.get('/me', (req, res) => {
  const u = users.get(req.user.user_id)
  if (!u) return res.status(404).json({ error: 'Not found' })
  res.json({
    user_id: u.user_id,
    email: u.email,
    msisdn_admin: u.msisdn_admin,
    ...(u.first_name != null && { first_name: u.first_name }),
    ...(u.last_name != null && { last_name: u.last_name }),
    notification_pref: u.notification_pref,
  })
})

usersRouter.patch('/me', (req, res) => {
  const u = users.get(req.user.user_id)
  if (!u) return res.status(404).json({ error: 'Not found' })
  const { email, msisdn_admin, notification_pref, first_name, last_name } = req.body || {}
  if (email != null) u.email = String(email)
  if (msisdn_admin != null) u.msisdn_admin = String(msisdn_admin)
  if (first_name != null) u.first_name = String(first_name)
  if (last_name != null) u.last_name = String(last_name)
  if (notification_pref && typeof notification_pref === 'object') {
    u.notification_pref = { ...u.notification_pref, ...notification_pref }
  }
  users.set(u.user_id, u)
  res.json({
    user_id: u.user_id,
    email: u.email,
    msisdn_admin: u.msisdn_admin,
    ...(u.first_name != null && { first_name: u.first_name }),
    ...(u.last_name != null && { last_name: u.last_name }),
    notification_pref: u.notification_pref,
  })
})

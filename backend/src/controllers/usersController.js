import { users } from '../store.js'
import { findUserById, updateUserBasic } from '../repositories/userRepo.js'
import { isEmail, isE164 } from '../utils/validate.js'

export async function getMe(req, res) {
  const u = (await Promise.resolve(findUserById(req.user.user_id))) || users.get(req.user.user_id)
  if (!u) return res.status(404).json({ error: 'Not found' })
  res.json({
    user_id: u.user_id,
    email: u.email,
    msisdn_admin: u.msisdn_admin,
    ...(u.first_name != null && { first_name: u.first_name }),
    ...(u.last_name != null && { last_name: u.last_name }),
    notification_pref: u.notification_pref,
  })
}

export async function patchMe(req, res) {
  const u = users.get(req.user.user_id)
  if (!u) {
    const dbu = await Promise.resolve(findUserById(req.user.user_id))
    if (!dbu) return res.status(404).json({ error: 'Not found' })
  }
  const { email, msisdn_admin, notification_pref, first_name, last_name } = req.body || {}
  if (email != null && !isEmail(String(email))) return res.status(400).json({ error: 'invalid_email' })
  if (msisdn_admin != null && !isE164(String(msisdn_admin))) return res.status(400).json({ error: 'invalid_msisdn' })
  const updated = await Promise.resolve(updateUserBasic(req.user.user_id, { email, msisdn_admin, notification_pref }))
  const merged = updated || (() => {
    const local = users.get(req.user.user_id)
    if (email != null) local.email = String(email)
    if (msisdn_admin != null) local.msisdn_admin = String(msisdn_admin)
    if (first_name != null) local.first_name = String(first_name)
    if (last_name != null) local.last_name = String(last_name)
    if (notification_pref && typeof notification_pref === 'object') {
      local.notification_pref = { ...local.notification_pref, ...notification_pref }
    }
    users.set(local.user_id, local)
    return local
  })()
  res.json({
    user_id: merged.user_id,
    email: merged.email,
    msisdn_admin: merged.msisdn_admin,
    ...(merged.first_name != null && { first_name: merged.first_name }),
    ...(merged.last_name != null && { last_name: merged.last_name }),
    notification_pref: merged.notification_pref,
  })
}

import { verifyToken } from '../utils/token.js'
import { users } from '../store.js'

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const parts = auth.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const payload = verifyToken(parts[1])
    const user = users.get(payload.sub)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    req.user = {
      user_id: user.user_id,
      email: user.email,
      msisdn_admin: user.msisdn_admin,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}

import { rateLimitHits } from '../metrics.js'
const buckets = new Map()
export function rateLimit(windowMs, max, scope = 'scope') {
  return function (req, res, next) {
    const now = Date.now()
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    const key = `${scope}:${ip}`
    const arr = buckets.get(key) || []
    const recent = arr.filter((t) => now - t < windowMs)
    recent.push(now)
    buckets.set(key, recent)
    if (recent.length > max) {
      try { rateLimitHits.inc({ scope }) } catch (e) { void e }
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)))
      return res.status(429).json({ error: 'rate_limited' })
    }
    next()
  }
}

export function isEmail(v) {
  if (typeof v !== 'string') return false
  const s = v.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
export function isE164(v) {
  if (typeof v !== 'string') return false
  const s = v.trim()
  const cleaned = s.startsWith('+') ? `+${s.slice(1).replace(/\D/g, '')}` : s.replace(/\D/g, '')
  if (/^\+?\d{8,15}$/.test(cleaned)) return true
  return false
}
export function isSixDigits(v) {
  if (typeof v !== 'string') return false
  return /^\d{6}$/.test(v.trim())
}
export function inLen(v, min, max) {
  if (typeof v !== 'string') return false
  const n = v.trim().length
  return n >= min && n <= max
}

export function isISODateString(v) {
  if (typeof v !== 'string') return false
  const s = v.trim()
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return false
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(s)
}

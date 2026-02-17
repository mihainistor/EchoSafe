import { sql } from '../db/index.js'
import { otpAudit } from '../store.js'
export async function insertOtpAudit(entry) {
  const row = {
    id: entry.id || null,
    type: entry.type || null,
    email: entry.email || null,
    ip: entry.ip || null,
    ok: entry.ok ?? null,
    reason: entry.reason || null,
    at: entry.at || new Date().toISOString(),
  }
  if (!sql) {
    otpAudit.push(row)
    return row
  }
  const res = await sql`
    insert into otp_audit(id, type, email, ip, ok, reason, at)
    values (gen_random_uuid(), ${row.type}, ${row.email}, ${row.ip}, ${row.ok}, ${row.reason}, ${row.at}::timestamptz)
    returning *
  `
  return res[0]
}

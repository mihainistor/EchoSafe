import { sql } from '../db/index.js'
import { users } from '../store.js'

export function findUserByEmail(email) {
  if (!sql) {
    return [...users.values()].find((u) => u.email === email) || null
  }
  return sql`select * from users where email = ${email} limit 1`.then((rows) => rows[0] ? mapRow(rows[0]) : null)
}

export function findUserById(user_id) {
  if (!sql) {
    return users.get(user_id) || null
  }
  return sql`select * from users where user_id = ${user_id} limit 1`.then((rows) => rows[0] ? mapRow(rows[0]) : null)
}

export function insertUser(user) {
  if (!sql) {
    users.set(user.user_id, user)
    return users.get(user.user_id)
  }
  return sql`
    insert into users (user_id, email, msisdn_admin, password_hash, notification_pref, created_at)
    values (${user.user_id}::uuid, ${user.email}, ${user.msisdn_admin}, ${user.passwordHash || null}, ${sql.json(user.notification_pref || null)}, ${user.created_at}::timestamptz)
    returning *
  `.then((rows) => mapRow(rows[0]))
}

export function updateUserPrefs(user_id, notification_pref) {
  if (!sql) {
    const u = users.get(user_id)
    if (!u) return null
    u.notification_pref = notification_pref
    users.set(user_id, u)
    return u
  }
  return sql`update users set notification_pref = ${sql.json(notification_pref || null)} where user_id = ${user_id}::uuid returning *`
    .then((rows) => rows[0] ? mapRow(rows[0]) : null)
}

export function updateUserBasic(user_id, { email, msisdn_admin, notification_pref }) {
  if (!sql) {
    const u = users.get(user_id)
    if (!u) return null
    if (email != null) u.email = String(email)
    if (msisdn_admin != null) u.msisdn_admin = String(msisdn_admin)
    if (notification_pref && typeof notification_pref === 'object') {
      u.notification_pref = { ...u.notification_pref, ...notification_pref }
    }
    users.set(user_id, u)
    return u
  }
  const sets = []
  if (email != null) sets.push(sql`email = ${email}`)
  if (msisdn_admin != null) sets.push(sql`msisdn_admin = ${msisdn_admin}`)
  if (notification_pref && typeof notification_pref === 'object') sets.push(sql`notification_pref = ${sql.json(notification_pref)}`)
  if (sets.length === 0) return findUserById(user_id)
  return sql`update users set ${sql.join(sets, sql`, `)} where user_id = ${user_id}::uuid returning *`
    .then((rows) => rows[0] ? mapRow(rows[0]) : null)
}

function mapRow(row) {
  return {
    user_id: String(row.user_id),
    email: row.email,
    msisdn_admin: row.msisdn_admin,
    passwordHash: row.password_hash,
    notification_pref: row.notification_pref ?? null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
  }
}

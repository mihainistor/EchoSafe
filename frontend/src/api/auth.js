function isDemo() {
  try {
    return localStorage.getItem('demo_mode') === '1'
  } catch {
    return false
  }
}
const API_BASE =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : ''

export async function register({ email, password, msisdn_admin, first_name, last_name }) {
  if (isDemo()) {
    return Promise.resolve({
      ok: true,
      user: { id: 'demo', email, first_name: first_name || 'Demo', last_name: last_name || 'User' },
      demo: true,
    })
  }
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, msisdn_admin, ...(first_name != null && { first_name }), ...(last_name != null && { last_name }) }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  if (json.token) localStorage.setItem('auth_token', json.token)
  return json
}

export async function login({ email, password }) {
  if (isDemo()) {
    const token = 'demo-token'
    try {
      localStorage.setItem('auth_token', token)
    } catch {}
    return Promise.resolve({ token, user: { id: 'demo', email: email || 'demo@example.com' }, demo: true })
  }
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  if (json.token) localStorage.setItem('auth_token', json.token)
  return json
}

export function getToken() {
  return localStorage.getItem('auth_token') || ''
}

export async function getMe() {
  if (isDemo()) {
    return Promise.resolve({ id: 'demo', email: 'demo@example.com', first_name: 'Demo', last_name: 'User', demo: true })
  }
  const token = getToken()
  if (!token) throw new Error('no token')
  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

export async function logout() {
  const token = getToken()
  try {
    if (token) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  } catch {}
  try {
    localStorage.removeItem('auth_token')
  } catch {}
  return { ok: true }
}

export async function patchMe(partial) {
  const token = getToken()
  if (!token) throw new Error('no token')
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(partial),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

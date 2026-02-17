/* eslint-disable no-console */
async function main() {
  const base = process.env.BASE_URL || 'http://localhost:4000'
  const email = process.env.E2E_EMAIL || 'e2e@example.com'
  const password = process.env.E2E_PASSWORD || 'Passw0rd!'
  const msisdn = process.env.E2E_MSISDN || '0711111111'
  const msisdnTarget = process.env.E2E_TARGET || '0722333444'
  const label = process.env.E2E_LABEL || 'E2E Kid'

  let regRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, msisdn_admin: msisdn }),
  })
  let token = null
  if (regRes.ok) {
    const reg = await regRes.json()
    token = reg.token
  } else if (regRes.status === 409) {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!loginRes.ok) {
      const body = await loginRes.text()
      console.error('Login failed:', loginRes.status, body)
      process.exit(1)
    }
    const login = await loginRes.json()
    token = login.token
  } else {
    const body = await regRes.text()
    console.error('Register failed:', regRes.status, body)
    process.exit(1)
  }
  console.log('TOKEN=' + token)
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` }

  const devRes = await fetch(`${base}/api/devices`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ msisdn_target: msisdnTarget, label }),
  })
  const dev = await devRes.json()
  if (!dev.device_id) {
    console.error('Create device failed:', dev)
    process.exit(1)
  }
  console.log('DEVICE_ID=' + dev.device_id)

  const devFull = await fetch(`${base}/api/devices/${dev.device_id}`, { headers: { authorization: `Bearer ${token}` } }).then((r) => r.json())
  const otp = devFull.otp_secret
  if (!otp) {
    console.error('OTP not found on device:', devFull)
    process.exit(1)
  }
  console.log('OTP=' + otp)

  const valRes = await fetch(`${base}/api/devices/${dev.device_id}/validate-otp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ otp }),
  })
  if (!valRes.ok) {
    const body = await valRes.text()
    console.error('Validate OTP failed:', valRes.status, body)
    process.exit(1)
  }

  const after = await fetch(`${base}/api/devices/${dev.device_id}`, { headers: { authorization: `Bearer ${token}` } }).then((r) => r.json())
  console.log('STATUS=' + (after.status || after.gdpr_status))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

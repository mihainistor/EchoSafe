import { orangeSmsConfig } from '../config/orange.js'
import { randomUUID } from 'crypto'

const {
  baseUrl,
  applicationKey,
  applicationKeyHeaderName,
  authorizationHeader,
  enabled,
} = orangeSmsConfig

function getHeaders(correlator) {
  const headers = {
    'Content-Type': 'application/json',
    ...(correlator && { 'x-correlator': correlator }),
  }
  if (applicationKey && applicationKeyHeaderName) {
    headers[applicationKeyHeaderName] = applicationKey
  }
  if (authorizationHeader) {
    headers.Authorization = authorizationHeader
  }
  return headers
}

export async function sendOtpSms(msisdn, otp) {
  const phoneNumber = msisdn.startsWith('+') ? msisdn : `+40${msisdn.replace(/^0/, '')}`
  const text = `EchoSafe: codul tău de activare este ${otp}. Nu îl partaja.`
  if (!enabled) {
    console.log(`[SMS:DRY] ${text} -> ${phoneNumber}`)
    return { ok: true, dryRun: true }
  }
  const correlator = randomUUID()
  const url = `${baseUrl}/messages`
  const body = {
    device: { phoneNumber },
    content: { text },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(correlator),
    body: JSON.stringify(body),
  })
  const txt = await res.text()
  if (!res.ok) {
    let msg = `Orange SMS API error: ${res.status}`
    try {
      const json = JSON.parse(txt)
      if (json.message) msg = json.message
    } catch {}
    throw new Error(msg)
  }
  return { ok: true }
}

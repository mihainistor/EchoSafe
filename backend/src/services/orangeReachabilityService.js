/**
 * Client pentru Orange Device Reachability Status API (v0.6)
 * Conform OpenAPI: RequestReachabilityStatus, ReachabilityStatusResponse
 *
 * Request:  POST /retrieve  body: { device: { phoneNumber: "+40..." } }
 * Response: { reachabilityStatus: "CONNECTED_DATA"|"CONNECTED_SMS"|"NOT_CONNECTED", lastStatusTime? }
 */

import { orangeReachabilityConfig } from '../config/orange.js'
import { orangeErrorCounter, orangeDuration } from '../metrics.js'
import { logInfo, logError } from '../utils/logger.js'
import { randomUUID } from 'crypto'

const {
  baseUrl,
  applicationKey,
  applicationKeyHeaderName,
  authorizationHeader,
} = orangeReachabilityConfig

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
  if (!headers.Authorization && !headers[applicationKeyHeaderName]) {
    throw new Error(
      'Orange API: setați ORANGE_APPLICATION_KEY și ORANGE_CLIENT_ID+ORANGE_CLIENT_SECRET (sau ORANGE_AUTHORIZATION_HEADER) în .env'
    )
  }
  return headers
}

/**
 * Returnează starea de reachability a dispozitivului (conectat la rețea prin date/SMS sau nu).
 *
 * @param {string} msisdn - Număr telefon (ex: "0722123456" sau "+40722123456")
 * @param {object} options - xCorrelator (string, opțional)
 * @returns {Promise<{ reachabilityStatus: "CONNECTED_DATA"|"CONNECTED_SMS"|"NOT_CONNECTED", lastStatusTime?: string }>}
 */
export async function retrieveDeviceReachability(msisdn, options = {}) {
  const phoneNumber = msisdn.startsWith('+') ? msisdn : `+40${msisdn.replace(/^0/, '')}`
  const url = `${baseUrl}/retrieve`

  const body = { device: { phoneNumber } }
  const correlator = options.xCorrelator || randomUUID()

  const start = process.hrtime.bigint()
  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), Number(process.env.ORANGE_TIMEOUT_MS || 10000))
  let res
  try {
    try { logInfo({ msg: 'orange_reachability_request', correlator, phoneNumber }) } catch (e) { void e }
    res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(correlator),
      body: JSON.stringify(body),
      signal: ac.signal,
    })
  } finally {
    clearTimeout(to)
  }

  const text = await res.text()
  if (!res.ok) {
    let errMessage = `Orange Reachability API error: ${res.status}`
    try {
      const json = JSON.parse(text)
      if (json.code) errMessage = `${json.code}: ${json.message || errMessage}`
      else if (json.message) errMessage = json.message
    } catch {
      if (text) errMessage += ` — ${text.slice(0, 200)}`
    }
    try { logError({ msg: 'orange_reachability_error', correlator, status: res.status, body: text.slice(0, 200) }) } catch (e) { void e }
    orangeErrorCounter.inc({ api: 'reachability', code: String(res.status) })
    const sec = Number(process.hrtime.bigint() - start) / 1e9
    orangeDuration.observe({ api: 'reachability', status: String(res.status) }, sec)
    throw new Error(errMessage)
  }

  const data = JSON.parse(text)
  if (data.reachabilityStatus == null) {
    throw new Error('Orange Reachability API: răspuns fără reachabilityStatus')
  }

  const result = {
    reachabilityStatus: data.reachabilityStatus,
    ...(data.lastStatusTime != null && { lastStatusTime: data.lastStatusTime }),
  }
  const sec = Number(process.hrtime.bigint() - start) / 1e9
  orangeDuration.observe({ api: 'reachability', status: '200' }, sec)
  try { logInfo({ msg: 'orange_reachability_ok', correlator, status: 200 }) } catch (e) { void e }
  return result
}

export { orangeReachabilityConfig }

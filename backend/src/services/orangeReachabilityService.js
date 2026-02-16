/**
 * Client pentru Orange Device Reachability Status API (v0.6)
 * Conform OpenAPI: RequestReachabilityStatus, ReachabilityStatusResponse
 *
 * Request:  POST /retrieve  body: { device: { phoneNumber: "+40..." } }
 * Response: { reachabilityStatus: "CONNECTED_DATA"|"CONNECTED_SMS"|"NOT_CONNECTED", lastStatusTime? }
 */

import { orangeReachabilityConfig } from '../config/orange.js'
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

  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(correlator),
    body: JSON.stringify(body),
  })

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
    throw new Error(errMessage)
  }

  const data = JSON.parse(text)
  if (data.reachabilityStatus == null) {
    throw new Error('Orange Reachability API: răspuns fără reachabilityStatus')
  }

  return {
    reachabilityStatus: data.reachabilityStatus,
    ...(data.lastStatusTime != null && { lastStatusTime: data.lastStatusTime }),
  }
}

export { orangeReachabilityConfig }

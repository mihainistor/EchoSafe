/**
 * Client pentru Orange Device Location Retrieval API (CAMARA v0.3)
 * Conform OpenAPI: api-1.json (RetrievalLocationRequest, Location cu area CIRCLE/POLYGON)
 *
 * Request:  POST /retrieve  body: { device: { phoneNumber: "+40..." }, maxAge?: number }
 * Response: { lastLocationTime, area: { areaType: "CIRCLE"|"POLYGON", center?, radius?, boundary? } }
 */

import { orangeLocationConfig } from '../config/orange.js'
import { orangeErrorCounter, orangeDuration } from '../metrics.js'
import { logInfo, logError } from '../utils/logger.js'
import { randomUUID } from 'crypto'

const {
  baseUrl,
  applicationKey,
  applicationKeyHeaderName,
  authorizationHeader,
} = orangeLocationConfig

/**
 * Headers: Application Key, Authorization Basic, optional x-correlator
 */
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
 * Returnează locația unui dispozitiv identificat prin MSISDN.
 * Conform spec: device.phoneNumber (E.164), maxAge opțional (secunde).
 *
 * @param {string} msisdn - Număr telefon (ex: "0722123456" sau "+40722123456")
 * @param {object} options - maxAge (secunde), xCorrelator (string)
 * @returns {Promise<{ lat, lng, accuracy?, lastLocationTime, area, ... }>}
 */
export async function retrieveDeviceLocation(msisdn, options = {}) {
  const phoneNumber = msisdn.startsWith('+') ? msisdn : `+40${msisdn.replace(/^0/, '')}`
  const url = `${baseUrl}/retrieve`

  const body = {
    device: { phoneNumber },
    ...(options.maxAge != null && { maxAge: options.maxAge }),
  }

  const correlator = options.xCorrelator || randomUUID()
  const start = process.hrtime.bigint()
  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), Number(process.env.ORANGE_TIMEOUT_MS || 10000))
  let res
  try {
    try { logInfo({ msg: 'orange_location_request', correlator, phoneNumber }) } catch (e) { void e }
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
    let errMessage = `Orange Location API error: ${res.status}`
    try {
      const json = JSON.parse(text)
      if (json.code) errMessage = `${json.code}: ${json.message || errMessage}`
      else if (json.message) errMessage = json.message
    } catch {
      if (text) errMessage += ` — ${text.slice(0, 200)}`
    }
    try { logError({ msg: 'orange_location_error', correlator, status: res.status, body: text.slice(0, 200) }) } catch (e) { void e }
    orangeErrorCounter.inc({ api: 'location', code: String(res.status) })
    const sec = Number(process.hrtime.bigint() - start) / 1e9
    orangeDuration.observe({ api: 'location', status: String(res.status) }, sec)
    throw new Error(errMessage)
  }

  const data = JSON.parse(text)

  // Spec: Location = { lastLocationTime, area: { areaType, center?, radius?, boundary? } }
  const lastLocationTime = data.lastLocationTime
  const area = data.area
  if (!area) throw new Error('Orange Location API: răspuns fără area')

  if (area.areaType === 'CIRCLE' && area.center) {
    const { latitude, longitude } = area.center
    const radius = area.radius
    const result = {
      lat: Number(latitude),
      lng: Number(longitude),
      ...(radius != null && { accuracy: Number(radius) }),
      lastLocationTime,
      area,
    }
    const sec = Number(process.hrtime.bigint() - start) / 1e9
    orangeDuration.observe({ api: 'location', status: '200' }, sec)
    try { logInfo({ msg: 'orange_location_ok', correlator, status: 200 }) } catch (e) { void e }
    return result
  }

  if (area.areaType === 'POLYGON' && Array.isArray(area.boundary) && area.boundary.length > 0) {
    const first = area.boundary[0]
    const result = {
      lat: Number(first.latitude),
      lng: Number(first.longitude),
      lastLocationTime,
      area,
    }
    const sec = Number(process.hrtime.bigint() - start) / 1e9
    orangeDuration.observe({ api: 'location', status: '200' }, sec)
    try { logInfo({ msg: 'orange_location_ok', correlator, status: 200 }) } catch (e) { void e }
    return result
  }

  const sec = Number(process.hrtime.bigint() - start) / 1e9
  orangeDuration.observe({ api: 'location', status: '200' }, sec)
  throw new Error('Orange Location API: area necunoscut sau invalid')
}

export { orangeLocationConfig }

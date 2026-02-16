/**
 * Configurare Orange API (Device Location Retrieval etc.)
 * Autentificare: Application Key în header + Authorization Basic (Client ID + Client Secret)
 */

const apiRoot = 'https://api.orange.com/camara/playground/api'
const locationBasePath = '/location-retrieval/v0.3'
const reachabilityBasePath = '/device-reachability-status/v0.6'
const smsBasePath = process.env.ORANGE_SMS_BASE_PATH || '/sms/v0'

function buildAuthorizationHeader() {
  const explicit = process.env.ORANGE_AUTHORIZATION_HEADER
  if (explicit) return explicit
  const clientId = process.env.ORANGE_CLIENT_ID
  const clientSecret = process.env.ORANGE_CLIENT_SECRET
  if (clientId && clientSecret) {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')
    return `Basic ${encoded}`
  }
  return null
}

export const orangeLocationConfig = {
  baseUrl: `${apiRoot}${locationBasePath}`,

  /** Application Key pentru apelarea API-urilor Orange */
  applicationKey: process.env.ORANGE_APPLICATION_KEY,
  /** Numele header-ului pentru Application Key (ex: apiKeyHeader, X-Application-Key) */
  applicationKeyHeaderName: process.env.ORANGE_APPLICATION_KEY_HEADER_NAME || 'apiKeyHeader',

  /** Authorization: Basic base64(client_id:client_secret) - setat din env sau construit din ORANGE_CLIENT_ID + ORANGE_CLIENT_SECRET */
  authorizationHeader: buildAuthorizationHeader(),

  /** Pentru referință: Client ID și Client Secret (folosite doar pentru a construi Authorization dacă ORANGE_AUTHORIZATION_HEADER nu e setat) */
  clientId: process.env.ORANGE_CLIENT_ID,
  clientSecret: process.env.ORANGE_CLIENT_SECRET,
}

/** Base URL pentru Device Reachability Status API (v0.6) */
export const orangeReachabilityConfig = {
  baseUrl: `${apiRoot}${reachabilityBasePath}`,
  applicationKey: process.env.ORANGE_APPLICATION_KEY,
  applicationKeyHeaderName: process.env.ORANGE_APPLICATION_KEY_HEADER_NAME || 'apiKeyHeader',
  authorizationHeader: buildAuthorizationHeader(),
}

export const orangeSmsConfig = {
  baseUrl: `${apiRoot}${smsBasePath}`,
  applicationKey: process.env.ORANGE_APPLICATION_KEY,
  applicationKeyHeaderName: process.env.ORANGE_APPLICATION_KEY_HEADER_NAME || 'apiKeyHeader',
  authorizationHeader: buildAuthorizationHeader(),
  enabled: String(process.env.ORANGE_SMS_ENABLED || '').toLowerCase() === 'true',
}

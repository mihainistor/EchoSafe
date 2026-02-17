import client from 'prom-client'
const register = new client.Registry()
client.collectDefaultMetrics({ register })
const httpReqCounter = new client.Counter({
  name: 'echosafe_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'code'],
})
const httpReqDuration = new client.Histogram({
  name: 'echosafe_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.05, 0.1, 0.2, 0.4, 0.8, 1.5, 3, 6],
})
const rateLimitHits = new client.Counter({
  name: 'echosafe_rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['scope'],
})
const orangeErrorCounter = new client.Counter({
  name: 'echosafe_orange_errors_total',
  help: 'Orange API errors',
  labelNames: ['api', 'code'],
})
const orangeDuration = new client.Histogram({
  name: 'echosafe_orange_request_duration_seconds',
  help: 'Orange API request duration',
  labelNames: ['api', 'status'],
  buckets: [0.1, 0.3, 0.6, 1, 2, 4, 8],
})
register.registerMetric(httpReqCounter)
register.registerMetric(httpReqDuration)
register.registerMetric(rateLimitHits)
register.registerMetric(orangeErrorCounter)
register.registerMetric(orangeDuration)
export { client, register, httpReqCounter, httpReqDuration, rateLimitHits, orangeErrorCounter, orangeDuration }

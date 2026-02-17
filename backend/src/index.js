import express from 'express'
import cors from 'cors'
import { devicesRouter } from './routes/devices.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { runMigrations, sql as db } from './db/index.js'
import { mountSwagger } from './docs/openapi.js'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs'
import { spawn, spawnSync } from 'child_process'
import { createRequire } from 'module'
import { register, httpReqCounter, httpReqDuration, rateLimitHits } from './metrics.js'
import { logError } from './utils/logger.js'

const app = express()
const PORT = process.env.PORT || 4000
const allowList = String(process.env.ALLOWED_ORIGINS || 'http://localhost:3006,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

if (String(process.env.NODE_ENV).toLowerCase() === 'production' && !process.env.DATABASE_URL) {
  console.error('[fatal] DATABASE_URL lipsă în producție')
  process.exit(1)
}
if (String(process.env.NODE_ENV).toLowerCase() === 'production') {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET === 'dev-secret-change-me') {
    console.error('[fatal] AUTH_SECRET lipsă sau default în producție')
    process.exit(1)
  }
}

app.disable('x-powered-by')
app.use((req, res, next) => {
  // request id simplu dacă nu e furnizat
  const rid = req.headers['x-request-id'] || Math.random().toString(36).slice(2, 10)
  req.id = String(rid)
  res.setHeader('X-Request-Id', req.id)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  next()
})
function ipRateLimit(windowMs, max, scope = 'global') {
  const hits = new Map()
  return function (req, res, next) {
    const now = Date.now()
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    const arr = hits.get(ip) || []
    const recent = arr.filter((t) => now - t < windowMs)
    recent.push(now)
    hits.set(ip, recent)
    if (recent.length > max) {
      rateLimitHits.inc({ scope })
      const oldest = recent[0]
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: 'rate_limited', retry_after_sec: retryAfter })
    }
    next()
  }
}
app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const route = (req.originalUrl || req.path || '').split('?')[0] || 'unknown'
    const code = res.statusCode
    httpReqCounter.inc({ method: req.method, route, code })
    const end = process.hrtime.bigint()
    const sec = Number(end - start) / 1e9
    httpReqDuration.observe({ method: req.method, route, code }, sec)
  })
  next()
})
app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType)
  res.end(await register.metrics())
})
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      cb(null, allowList.includes(origin))
    },
    credentials: true,
  })
)
app.options(
  '*',
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      cb(null, allowList.includes(origin))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '200kb' }))

runMigrations()

mountSwagger(app)

app.use('/api', ipRateLimit(60 * 1000, 120, 'api'))
app.use('/api/auth', ipRateLimit(60 * 1000, 15, 'auth'))
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/devices', devicesRouter)

function getBuildInfo() {
  const info = { version: '0.1.0', commit: process.env.GIT_SHA || process.env.COMMIT_SHA || 'dev' }
  try {
    if (!process.env.COMMIT_SHA && !process.env.GIT_SHA) {
      const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' })
      if (r.status === 0) info.commit = r.stdout.trim() || info.commit
    }
  } catch { /* no git */ }
  return info
}
app.get('/api/health', async (req, res) => {
  let dbStatus = 'none'
  if (process.env.DATABASE_URL) {
    try {
      if (db) await db`select 1 as ok`
      dbStatus = db ? 'ok' : 'init'
    } catch {
      dbStatus = 'down'
    }
  }
  res.json({
    status: 'ok',
    service: 'echosafe-backend',
    mode: process.env.DATABASE_URL ? 'db' : 'memory',
    db: dbStatus,
    uptime_sec: Math.floor(process.uptime()),
    build: getBuildInfo(),
  })
})
app.get('/api/ready', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({ ready: true, mode: 'memory' })
  }
  try {
    if (!db) throw new Error('no_db')
    await db`select 1 as ok`
    return res.json({ ready: true, mode: 'db' })
  } catch {
    return res.status(503).json({ ready: false })
  }
})

// Serve frontend build for demo if present (non-/api routes)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDist = path.resolve(__dirname, '../../frontend/dist')
const hasBuild = fs.existsSync(path.join(frontendDist, 'index.html'))
if (hasBuild) {
  app.use(express.static(frontendDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next()
    })
  })
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .send(
        '<!doctype html><meta charset="utf-8"><title>EchoSafe</title><style>body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:2rem;line-height:1.5}</style><h1>UI necompilat</h1><p>Rulează <code>npm run dev</code> în <strong>frontend</strong> și deschide <a href="http://localhost:3000" target="_blank">http://localhost:3000</a> (Vite alege primul port liber).</p><p>Alternativ, construiește UI-ul: <code>npm run build</code> în frontend, apoi reîncarcă această pagină.</p>'
      )
  })
}

let viteProc = null
app.all('/api/dev/start-vite', (_req, res) => {
  if (viteProc && !viteProc.killed) {
    return res.json({ status: 'already_running', url: 'http://localhost:3006' })
  }
  const frontendDir = path.resolve(__dirname, '../../frontend')
  viteProc = spawn('npx', ['vite', '--port', '3006', '--strictPort', '--host'], {
    cwd: frontendDir,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  viteProc.on('exit', () => {
    viteProc = null
  })
  return res.json({ status: 'started', url: 'http://localhost:3006' })
})

app.all('/api/dev/build-frontend', async (_req, res) => {
  try {
    const frontendDir = path.resolve(__dirname, '../../frontend')
    const requireFromFrontend = createRequire(path.join(frontendDir, 'package.json'))
    const viteEntry = requireFromFrontend.resolve('vite')
    const vite = await import(pathToFileURL(viteEntry).href)
    await vite.build({ root: frontendDir, configFile: path.join(frontendDir, 'vite.config.js') })
    return res.json({ status: 'built', dist: path.join(frontendDir, 'dist') })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

app.all('/api/dev/build-frontend-shell', (_req, res) => {
  const frontendDir = path.resolve(__dirname, '../../frontend')
  const proc = spawn('npm', ['run', 'build'], {
    cwd: frontendDir,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  proc.on('close', () => {
    // no-op; refresh in browser will pick up static files if code === 0
  })
  res.json({ status: 'started', cmd: 'npm run build', cwd: frontendDir })
})
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)
  const code = err?.status || err?.statusCode || 500
  const payload = code >= 500 ? { error: 'internal_error' } : { error: err?.message || 'error' }
  logError({ msg: 'request_error', req_id: req.id, route: req.originalUrl, code, error: String(err && err.message ? err.message : err) })
  res.status(code).json(payload)
})
app.listen(PORT, () => {
  console.log(`EchoSafe API listening on http://localhost:${PORT}`)
})

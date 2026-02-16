import express from 'express'
import cors from 'cors'
import { devicesRouter } from './routes/devices.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs'
import { spawn } from 'child_process'
import { createRequire } from 'module'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: true }))
app.options('*', cors({ origin: true }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/devices', devicesRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'echosafe-backend' })
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
  proc.on('close', (code) => {
    // no-op; refresh in browser will pick up static files if code === 0
  })
  res.json({ status: 'started', cmd: 'npm run build', cwd: frontendDir })
})
app.listen(PORT, () => {
  console.log(`EchoSafe API listening on http://localhost:${PORT}`)
})

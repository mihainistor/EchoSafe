import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'

export function mountSwagger(app) {
  const specPath = path.resolve(process.cwd(), 'backend', 'src', 'docs', 'openapi.json')
  let spec = {
    openapi: '3.0.0',
    info: { title: 'EchoSafe API', version: '0.1.0' },
    servers: [{ url: 'http://localhost:4000' }]
  }
  try {
    if (fs.existsSync(specPath)) {
      spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
    }
  } catch (e) { void e }
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec))
}

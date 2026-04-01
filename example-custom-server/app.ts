import { securityHeaders } from '@paretojs/core/node'
import express from 'express'

const app = express()

app.use(securityHeaders())

app.use((_req, res, next) => {
  res.setHeader('X-Powered-By', 'Pareto Custom Server')
  res.setHeader('X-Request-Id', crypto.randomUUID())
  next()
})

app.get('/custom-api/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'custom',
    uptime: process.uptime(),
    timestamp: Date.now(),
  })
})

app.get('/custom-api/echo', (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      host: req.headers['host'],
    },
  })
})

export default app

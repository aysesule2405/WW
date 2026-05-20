import express from 'express'
import path from 'path'
// require cors and helmet at runtime to avoid missing @types in dev setup
const cors: any = require('cors')
const helmet: any = require('helmet')
import { requestLogger } from '../core/middleware/requestLogger.middleware'
import { errorHandler } from '../core/middleware/error.middleware'
import routes from '../routes'

const createApp = () => {
  const app = express()
  app.use(helmet())

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : true // allow all in dev

  app.use(cors({ origin: allowedOrigins, credentials: true }))
  app.use(express.json({ limit: '15mb' }))
  app.use('/uploads', express.static(path.resolve(__dirname, '../../public/uploads')))
  app.use(requestLogger)

  app.use('/api/v1', routes)

  // Error handler (should be last)
  app.use(errorHandler)

  return app
}

export default createApp

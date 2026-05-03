import express from 'express'
// require cors and helmet at runtime to avoid missing @types in dev setup
const cors: any = require('cors')
const helmet: any = require('helmet')
import { requestLogger } from '../core/middleware/requestLogger.middleware'
import { errorHandler } from '../core/middleware/error.middleware'
import routes from '../routes'

const createApp = () => {
  const app = express()
  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(requestLogger)

  app.use('/api/v1', routes)

  // Error handler (should be last)
  app.use(errorHandler)

  return app
}

export default createApp

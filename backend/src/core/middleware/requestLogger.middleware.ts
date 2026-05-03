import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now()
  resOnFinish()

  function resOnFinish() {
    // delay attaching until response exists
    setImmediate(() => {
      const duration = Date.now() - start
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${req.originalUrl} - ${duration}ms`)
    })
  }

  next()
}

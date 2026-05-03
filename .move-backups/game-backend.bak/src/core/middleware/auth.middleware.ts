import { Request, Response, NextFunction } from 'express'

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Placeholder: verify JWT here and attach user to req
  next()
}

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: number
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret not configured')
    const payload: any = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload?.id
    return next()
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

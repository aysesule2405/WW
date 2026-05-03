import { Request, Response, NextFunction } from 'express'

export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  // Placeholder: Run schema validation here (e.g., with Joi or Zod)
  next()
}

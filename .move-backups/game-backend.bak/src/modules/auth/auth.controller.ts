import { Request, Response } from 'express'
import { AuthService } from './auth.service'

const authService = new AuthService()

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body || {}
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username and password are required' })
    }

    const result = await authService.register(email, username, password)
    return res.status(201).json(result)
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const result = await authService.login(email, password)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(401).json({ error: error.message })
  }
}

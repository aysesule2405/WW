import { Response } from 'express'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import achievementsService from './achievements.service'

const listCatalog = async (_req: AuthRequest, res: Response) => {
  try {
    const achievements = await achievementsService.listCatalog()
    return res.status(200).json({ achievements })
  } catch (err: any) {
    console.error('list achievement catalog error', err)
    return res.status(500).json({ error: err.message })
  }
}

const listMine = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const achievements = await achievementsService.listForUser(userId)
    return res.status(200).json({ achievements })
  } catch (err: any) {
    console.error('list achievements error', err)
    return res.status(500).json({ error: err.message })
  }
}

export default { listCatalog, listMine }

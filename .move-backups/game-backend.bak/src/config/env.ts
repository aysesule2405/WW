import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const PORT = Number(process.env.PORT || 4000)
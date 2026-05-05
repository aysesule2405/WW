import path from 'path'
import dotenv from 'dotenv'
import createApp from './app'
import { connectMongo } from '../config/mongodb'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const port = process.env.PORT || 4000

async function main() {
  await connectMongo()
  const app = createApp()
  app.listen(Number(port), () => {
    console.log(`game-backend server listening on http://localhost:${port}`)
  })
}

main().catch((err) => {
  console.error('[server] Failed to start:', err)
  process.exit(1)
})

import path from 'path'
import dotenv from 'dotenv'
import createApp from './app'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const port = process.env.PORT || 4000

const app = createApp()

app.listen(Number(port), () => {
  // eslint-disable-next-line no-console
  console.log(`game-backend server listening on http://localhost:${port}`)
})

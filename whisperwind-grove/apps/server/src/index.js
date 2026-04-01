import express from 'express'
import cors from 'cors'
import path from 'path'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Example API endpoint
app.get('/api/greeting', (req, res) => {
  res.json({ message: 'Hello from server' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

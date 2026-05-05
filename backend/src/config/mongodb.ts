import mongoose from 'mongoose'

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables')
  }

  mongoose.connection.on('disconnected', () =>
    console.warn('[MongoDB] Disconnected — will retry automatically')
  )
  mongoose.connection.on('error', (err) =>
    console.error('[MongoDB] Connection error:', err.message)
  )

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  console.log(`[MongoDB] Connected to ${mongoose.connection.host}`)
}

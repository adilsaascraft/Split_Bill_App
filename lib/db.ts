import dns from 'node:dns'
import mongoose from 'mongoose'

dns.setServers(['8.8.8.8', '1.1.1.1'])

console.log('🌐 Node DNS servers:', dns.getServers())

dns.promises
  .resolveSrv('_mongodb._tcp.cluster0.g29gkhy.mongodb.net')
  .then((records) => {
    console.log('✅ SRV DNS resolution works:', records)
  })
  .catch((error) => {
    console.error('❌ SRV DNS resolution failed:', error)
  })

// Fix Node.js SRV DNS resolution on networks where the default DNS
// resolver refuses MongoDB Atlas SRV queries.
dns.setServers(['8.8.8.8', '1.1.1.1'])

function getMongoUri(): string {
  const uri = process.env.MONGO_URI

  if (!uri) {
    throw new Error('❌ MONGO_URI is not defined')
  }

  return uri
}

const MONGO_URI = getMongoUri()

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
}

global.mongooseCache = cached

export async function connectDB(): Promise<typeof mongoose> {
  console.log('➡️ connectDB() called')

  if (cached.conn) {
    console.log('✅ Using existing MongoDB connection')
    return cached.conn
  }

  if (!cached.promise) {
    console.log('🔄 Connecting to MongoDB...')

    cached.promise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        console.log('✅ MongoDB Connected')
        return connection
      })
      .catch((error) => {
        cached.promise = null

        console.error('❌ MongoDB Connection Error:', error)

        throw error
      })
  }

  cached.conn = await cached.promise

  console.log('✅ connectDB() finished')

  return cached.conn
}

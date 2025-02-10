import { MongoClient, MongoClientOptions } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options: MongoClientOptions = {}

// Create a global variable outside of scope
let globalClient: Promise<MongoClient> | undefined = undefined

export async function getMongoClient(): Promise<MongoClient> {
  if (!globalClient) {
    const client = new MongoClient(uri, options)
    globalClient = client.connect()
  }
  return globalClient
}

export default getMongoClient
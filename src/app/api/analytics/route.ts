import { NextResponse } from 'next/server'
import { getMongoClient } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = await getMongoClient()
    const db = client.db('website-analytics')
    const collection = db.collection('pageviews')
    
    // Get all pageviews
    const pageviews = await collection.find({}).toArray()

    return NextResponse.json({
      totalVisits: pageviews.length,
      pageviews: pageviews
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { getMongoClient } from '@/lib/mongodb'

interface TrackingEvent {
  cookieId: string;
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  eventType: 'pageview';
}

export async function POST(request: Request) {
  try {
    const data: TrackingEvent = await request.json()
    const client = await getMongoClient()
    const db = client.db('website-analytics')
    const collection = db.collection('pageviews')
    
    await collection.insertOne(data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface TrackingEvent {
  cookieId: string;
  timestamp: string;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  eventType: 'pageview' | 'subscribe';
  email?: string;
}

export async function POST(request: Request) {
  try {
    const data: TrackingEvent = await request.json()
    const filePath = path.join(process.cwd(), 'tracking-events.json')
    
    let events = []
    try {
      const fileContent = await fs.readFile(filePath, 'utf8')
      events = JSON.parse(fileContent)
    } catch (error) {
      // File doesn't exist yet, will create new
    }

    events.push(data)
    await fs.writeFile(filePath, JSON.stringify(events, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
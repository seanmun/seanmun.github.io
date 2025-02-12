import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log('Received tracking data:', data);
    
    // Add to Firestore
    const docRef = await db.collection('pageviews').add({
      cookieId: data.cookieId,
      timestamp: new Date(data.timestamp),
      eventType: data.eventType,
      geolocation: data.geolocation || null,
      createdAt: new Date()
    });

    console.log('Document written with ID: ', docRef.id);
    
    return NextResponse.json({ success: true, docId: docRef.id });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
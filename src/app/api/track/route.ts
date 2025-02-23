// src/app/api/track/route.ts
// BACKUP FILE - Currently using direct Firebase client approach instead of API route
// If client-side tracking fails, we can revert to using this API route
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { CollectionReference, DocumentData } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const pageviewsCollection = db.collection('pageviews') as CollectionReference<DocumentData>;
    
    await pageviewsCollection.add({
      ...data,
      createdAt: new Date()
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in track route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
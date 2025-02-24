// src/lib/track-utils.ts
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type TrackEvent = {
  cookieId: string;
  eventType: 'pageview';
  timestamp?: Date;  // Make it optional since we'll use serverTimestamp
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export async function trackEvent(event: TrackEvent) {
  try {
    console.log('Attempting to track event:', event); // Debug log
    await addDoc(collection(db, 'pageviews'), {
      ...event,
      timestamp: serverTimestamp(),
      createdAt: new Date(),
    });
    console.log('Successfully tracked event'); // Debug log
    return { success: true };
  } catch (error) {
    console.error('Error tracking event:', error);
    return { success: false, error };
  }
}
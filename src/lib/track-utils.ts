// src/lib/track-utils.ts
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export type TrackEvent = {
  cookieId: string;
  timestamp: Date;
  eventType: 'pageview';
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}

export async function trackEvent(event: TrackEvent) {
  try {
    const pageviewsRef = collection(db, 'pageviews');
    await addDoc(pageviewsRef, {
      ...event,
      createdAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error tracking event:', error);
    return { success: false, error };
  }
}
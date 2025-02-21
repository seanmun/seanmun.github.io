// src/lib/track-utils.ts
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
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    const data = await response.json();
    return { success: data.success };
  } catch (error) {
    console.error('Error tracking event:', error);
    return { success: false, error };
  }
}
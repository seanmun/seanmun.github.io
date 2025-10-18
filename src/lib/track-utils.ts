// src/lib/track-utils.ts
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type TrackEvent = {
  cookieId: string;
  eventType: 'pageview' | 'project_click' | 'modal_open' | 'link_click';
  timestamp?: Date;  // Make it optional since we'll use serverTimestamp
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  projectName?: string;
  modalName?: string;
  linkName?: string;
  linkUrl?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintosh/i.test(userAgent));

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
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

// Helper function to track modal opens
export async function trackModalOpen(cookieId: string, modalName: string) {
  if (!cookieId) return;

  try {
    await trackEvent({
      cookieId,
      eventType: 'modal_open',
      modalName,
      deviceType: getDeviceType(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error tracking modal open:', err);
  }
}

// Helper function to track link clicks (fire and forget - non-blocking)
export function trackLinkClick(cookieId: string, linkName: string, linkUrl: string) {
  // Disabled for now to prevent mobile click-through issues
  return;

  // if (!cookieId) return;

  // // Fire and forget - don't block navigation
  // trackEvent({
  //   cookieId,
  //   eventType: 'link_click',
  //   linkName,
  //   linkUrl,
  //   deviceType: getDeviceType(),
  //   userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  //   timestamp: new Date()
  // }).catch(err => {
  //   console.error('Error tracking link click:', err);
  // });
}
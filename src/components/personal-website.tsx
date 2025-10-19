'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent, TrackEvent, getDeviceType, trackModalOpen, trackLinkClick } from '@/lib/track-utils';
import { X } from "lucide-react";
import { projects } from '@/data/projects';
import { ModernLayout } from './layouts/ModernLayout';

interface PersonalWebsiteProps {
  galleryImages: string[]
}

import { OrdinalFrameModal } from './modals/OrdinalFrameModal';
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';
import { maintenanceConfig } from '../config/maintenance';
import { AmberModal } from './modals/AmberModal';
import { HinkieBotModal } from './modals/HinkieBotModal';
import { MaintenanceOverlay } from './MaintenanceOverlay';
import { ResumeModal } from './modals/ResumeModal';
import { CertsModal } from './modals/CertsModal';
import { AIModal } from './modals/AIModal';

import Image from 'next/image';
import { AccessibilityMenu } from './AccessibilityMenu';

const shuffleArray = (array: string[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const PersonalWebsite = ({ galleryImages }: PersonalWebsiteProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [activeLink, setActiveLink] = useState('');
  const [error, setError] = useState('');
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [cookieId, setCookieId] = useState('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCertsModalOpen, setIsCertsModalOpen] = useState(false);
  const [isResumeModalOpen, setResumeModalOpen] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(maintenanceConfig.isEnabled);
  const [isOrdinalFrameModalOpen, setIsOrdinalFrameModalOpen] = useState(false);
  const [isAmberModalOpen, setAmberModalOpen] = useState(false);
  const [isHinkieBotModalOpen, setIsHinkieBotModalOpen] = useState(false);

  // Helper function to update URL
  const updateURL = (section: string | null) => {
    const url = new URL(window.location.href);
    if (section) {
      url.searchParams.set('section', section);
    } else {
      url.searchParams.delete('section');
    }
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Handle URL parameters on page load
  useEffect(() => {
    const section = searchParams.get('section');
    if (section) {
      switch (section) {
        case 'resume':
          setResumeModalOpen(true);
          break;
        case 'skills':
          setIsCertsModalOpen(true);
          break;
        case 'ai':
          setIsAIModalOpen(true);
          break;
        case 'privacy':
          setIsPrivacyModalOpen(true);
          break;
        case 'amber':
          setAmberModalOpen(true);
          break;
        case 'ordinal':
          setIsOrdinalFrameModalOpen(true);
          break;
      }
    }
  }, [searchParams]);

  // First useEffect for maintenance mode
  useEffect(() => {
    const hasMaintenanceAccess = sessionStorage.getItem('maintenanceAccess') === 'true';
    if (hasMaintenanceAccess) {
      setIsMaintenanceMode(false);
    }
  }, []);

  // Add this handler function
  const handleMaintenancePassword = () => {
    setIsMaintenanceMode(false);
    sessionStorage.setItem('maintenanceAccess', 'true');
  };

  // Second useEffect for visitor ID
  useEffect(() => {
    const existingId = localStorage.getItem('visitorId');
    if (existingId) {
      setCookieId(existingId);
    } else {
      const newId = Math.random().toString(36).substring(2);
      localStorage.setItem('visitorId', newId);
      setCookieId(newId);
    }
  }, []);

  const handleImageClick = (imageSrc: string) => {
    setFullscreenImage(imageSrc);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const { settings } = useAccessibilitySettings();

  // Gallery effect
  useEffect(() => {
    setIsVisible(true);
    setShuffledImages(shuffleArray([...galleryImages]));
    
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % galleryImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [galleryImages, galleryImages.length]);

  useEffect(() => {
    const trackPageview = async () => {
      try {
        const eventData: TrackEvent = {
          cookieId,
          timestamp: new Date(),
          eventType: 'pageview',
          deviceType: getDeviceType(),
          userAgent: navigator.userAgent
        };

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000
            });
          });

          eventData.geolocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch {
          console.log('Geolocation not available or denied');
        }

        await trackEvent(eventData);
      } catch (err) {
        console.error('Error tracking event:', err);
      }
    };

    if (cookieId) {
      const hasTracked = sessionStorage.getItem('hasTrackedPageview');
      if (!hasTracked) {
        trackPageview();
        sessionStorage.setItem('hasTrackedPageview', 'true');
      }
    }
  }, [cookieId]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_PROJECTS_PASSWORD) {
      setIsModalOpen(false);
      setPassword('');
      setError('');
      window.open(activeLink, '_blank');
    } else {
      setError('Incorrect password');
    }
  };

  const handleProjectClick = (
    e: React.MouseEvent,
    project: typeof projects[number]
  ) => {
    e.preventDefault();

    if (project.requiresPassword) {
      setActiveLink(project.link || '');
      setIsModalOpen(true);
      setError('');
      setPassword('');
    } else if (project.triggerAmberModal) {
      setAmberModalOpen(true);
      updateURL('amber');
    } else if (project.triggerOrdinalFrameModal) {
      setIsOrdinalFrameModalOpen(true);
      updateURL('ordinal');
    } else if (project.triggerHinkieBotModal) {
      setIsHinkieBotModalOpen(true);
      updateURL('hinkie');
    } else {
      window.open(project.link, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors" style={{
        backgroundColor: settings.theme === 'amber' ? 'var(--bg-primary)' : ''
      }}>
        <AccessibilityMenu />

        {/* Amber Mode Modal */}
        <AmberModal
          isOpen={isAmberModalOpen}
          onClose={() => {
            setAmberModalOpen(false);
            updateURL(null);
          }}
        />

        <OrdinalFrameModal
          isOpen={isOrdinalFrameModalOpen}
          onClose={() => {
            setIsOrdinalFrameModalOpen(false);
            updateURL(null);
          }}
          settings={settings}
        />

        {/* Resume Modal */}
        <ResumeModal
          isOpen={isResumeModalOpen}
          onClose={() => {
            setResumeModalOpen(false);
            updateURL(null);
          }}
          settings={settings}
        />

        {/* Certifications Modal */}
        <CertsModal
          isOpen={isCertsModalOpen}
          onClose={() => {
            setIsCertsModalOpen(false);
            updateURL(null);
          }}
          settings={settings}
        />

        <HinkieBotModal
          isOpen={isHinkieBotModalOpen}
          onClose={() => {
            setIsHinkieBotModalOpen(false);
            updateURL(null);
          }}
          settings={settings}
        />

        {/* Wrap all content that should be behind maintenance overlay */}
        <div className="relative">
          {isMaintenanceMode && maintenanceConfig.isEnabled && (
            <MaintenanceOverlay onPasswordSuccess={handleMaintenancePassword} />
          )}

          {/* Modern Layout - Default home page */}
          <ModernLayout
            cookieId={cookieId}
            shuffledImages={shuffledImages}
            activeSlide={activeSlide}
            isVisible={isVisible}
            handleImageClick={handleImageClick}
            handleProjectClick={handleProjectClick}
            trackLinkClick={trackLinkClick}
            trackModalOpen={trackModalOpen}
            setResumeModalOpen={setResumeModalOpen}
            setIsCertsModalOpen={setIsCertsModalOpen}
            setIsAIModalOpen={setIsAIModalOpen}
            setIsPrivacyModalOpen={setIsPrivacyModalOpen}
            updateURL={updateURL}
          />
        </div>

        {/* AI Modal */}
        <AIModal 
          isOpen={isAIModalOpen} 
          onClose={() => {
            setIsAIModalOpen(false);
            updateURL(null);
          }} 
          settings={settings} 
        />

        {/* Privacy Modal */}
        {isPrivacyModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className={`max-w-2xl w-full max-h-[80vh] m-4 rounded-lg overflow-hidden
      ${settings.theme === 'amber'
        ? 'bg-amber-50'
        : 'bg-white dark:bg-gray-800'
      }`}>
      <div className={`sticky top-0 flex justify-between items-center p-4 border-b
        ${settings.theme === 'amber'
          ? 'bg-amber-50 border-amber-100'
          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }`}>
        <h3 className={`text-xl font-semibold
          ${settings.theme === 'amber'
            ? 'text-amber-900'
            : 'text-gray-900 dark:text-white'
          }`}>
          Privacy Policy
        </h3>
        <button
          onClick={() => {
            setIsPrivacyModalOpen(false);
            updateURL(null);
          }}
          className={`p-2 rounded-full transition-colors
            ${settings.theme === 'amber'
              ? 'hover:bg-amber-100 text-amber-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className={`p-4 overflow-y-auto max-h-[60vh]
        ${settings.theme === 'amber'
          ? 'bg-amber-50'
          : 'bg-white dark:bg-gray-800'
        }`}>
        <div className={`text-sm space-y-4 ${
          settings.theme === 'amber'
            ? 'text-amber-900'
            : 'text-gray-600 dark:text-gray-300'
        }`}>
          <p>Last updated: January 13, 2025</p>

          <section className="space-y-2">
            <h4 className={`text-lg font-medium
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              Overview
            </h4>
            <p>
              This privacy policy explains how seanmun.com collects and uses personal information when you visit this website.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className={`text-lg font-medium
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              Information Collected
            </h4>
            <p>Collection and process for the following types of information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Accessibility preferences (stored locally on your device)</li>
              <li>Basic analytics data (page view counts, traffic sources)</li>
              <li>Email addresses (when voluntarily provided)</li>
              <li>General usage statistics to improve user experience</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={`text-lg font-medium
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              How Your Information Is Used
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>To remember your accessibility preferences</li>
              <li>To analyze website traffic and improve UX</li>
              <li>To respond to inquiries and communication requests</li>
              <li>To maintain and improve website functionality</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className={`text-lg font-medium
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              Cookies
            </h4>
            <p>
              Cookies used to store your accessibility preferences and analyze website traffic. These cookies are necessary for the website to function properly and provide you with a better experience.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className={`text-lg font-medium
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              Experimental
            </h4>
            <p>
              This is all for experiments and getting used to playing with this sort of data.  
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
        <div 
        className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
        onClick={closeFullscreen}
        >
        <div className="relative w-full h-full p-4 flex items-center justify-center">
        <div 
        className="relative max-w-[600px] max-h-[80vh]"
        onClick={e => e.stopPropagation()}
        >
        <Image
        src={fullscreenImage}
        alt="Fullscreen view"
        width={600}
        height={600}
        quality={75}
        className="max-w-full max-h-full object-contain"
        />
        </div>
        </div>
        </div>
        )}

      {/* Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Enter Password</h3>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                placeholder="Password"
              />
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                    type="submit"
                    className={`px-4 py-2 ${
                      settings.theme === 'amber'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white rounded`}
                  >
                    Submit
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalWebsite;
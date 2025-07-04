'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent, TrackEvent } from '@/lib/track-utils';
import { 
    Github, Linkedin, FileText, Zap, Trophy, Box, 
    Beef, Bot, ShieldCheck, X, Medal, Activity, Sun, Key, Banknote 
} from "lucide-react";
import { projects } from '@/data/projects';

interface PersonalWebsiteProps {
  galleryImages: string[]
}

import { OrdinalFrameModal } from './modals/OrdinalFrameModal';
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';
import { maintenanceConfig } from '../config/maintenance';
import dynamic from 'next/dynamic'
import { AmberModal } from './modals/AmberModal';

// Icon mapping object
const iconMap = {
  Zap,
  Trophy, 
  Box,
  Beef,
  Bot,
  Activity,
  Sun,
  Key,
  Banknote,
  Medal
};

// Helper function to render icons
const renderIcon = (iconName: string) => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent className="w-12 h-12 text-blue-600" /> : null;
};

// Overlay Modules
const MaintenanceOverlay = dynamic(
  () => import('./MaintenanceOverlay').then(mod => mod.MaintenanceOverlay), 
  { ssr: false }
)
const ResumeModal = dynamic(() => 
  import('./modals/ResumeModal').then(mod => mod.ResumeModal), 
  { ssr: false }
)
const CertsModal = dynamic(() => 
  import('./modals/CertsModal').then(mod => mod.CertsModal), 
  { ssr: false }
)
const AIModal = dynamic(() => 
  import('./modals/AIModal').then(mod => mod.AIModal), 
  { ssr: false }
)

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

  // Third useEffect for gallery
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
          eventType: 'pageview'
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
    } else {
      window.open(project.link, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors" style={{ 
        backgroundColor: settings.theme === 'amber' ? 'var(--bg-primary)' : ''
      }}>
        <AccessibilityMenu />    
      <div className="max-w-4xl mx-auto p-4">
{/* Bio Section */}
<div className="mb-6">
  <div className="flex flex-col sm:flex-row gap-4 items-start">
  <div className="relative w-40 h-40 flex-shrink-0">
  {/* Animated blobs */}
  <div className="absolute w-48 h-48 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    <div 
      className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-r from-blue-400 via-blue-500 to-green-400 dark:from-blue-600 dark:via-blue-700 dark:to-green-600 amber-gradient-1"
      style={{ 
        animation: 'blob 7s infinite', 
        borderRadius: '60% 40% 70% 30% / 60% 30% 70% 40%'
      }}
    ></div>
    <div 
      className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-r from-green-400 via-blue-500 to-cyan-400 dark:from-green-600 dark:via-blue-700 dark:to-cyan-600 amber-gradient-2"
      style={{ 
        animation: 'blob 7s infinite 2s', 
        borderRadius: '70% 30% 50% 50% / 30% 60% 40% 70%'
      }}
    ></div>
  </div>
  {/* Profile image */}
  <div 
    className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-800 amber-bg"
    style={{ animation: 'blobShape 20s infinite', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
      >
        <Image
      src="/profile/smunley2019.png"
      alt="Profile"
      width={160}
      height={160}
      className="w-full h-full object-cover"
      priority
      quality={75}
    />
  </div>
</div>
    <div>
      <h1 className="text-3xl font-bold mb-2 leading-relaxed dark:text-white">
        Sean Munley
      </h1>
        {/* Add current position and employer */}

      <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4 max-w-xl">
        <span className="text-gray-600 dark:text-gray-200 font-medium">
          CRM strategist, developer, and marketer
        </span>{' '}
        with over a decade of experience delivering innovative solutions to improve marketing performance. I specialize in crafting data-driven strategies, building interactive email experiences, and optimizing enterprise CRM systems. With a focus on automation and AI-driven personalization, I leverage technology to create scalable, high-impact marketing solutions that drive engagement and results. Beyond my work, I enjoy building apps and bots as a hobby—sometimes to entertain myself, sometimes to amuse my friends.
      </p>

      {/* Navigation Icons */}
      <nav className="flex gap-4 items-center">
        <div className="flex gap-2">
          <a
            href="https://github.com/seanmun"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="GitHub Profile"
          >
            <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
          </a>
          <a
            href="https://www.linkedin.com/in/seanmunley/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="LinkedIn Profile"
          >
            <Linkedin className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
          </a>
          
          <div className="group relative">
            <button
              onClick={() => {
                setResumeModalOpen(true);
                updateURL('resume');
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View Resume"
            >
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Resume
            </div>
          </div>

          <div className="group relative">
            <button
              onClick={() => {
                setIsCertsModalOpen(true);
                updateURL('skills');
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View Certifications"
            >
              <ShieldCheck className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Skills
            </div>
          </div>

          <div className="group relative">
            <button
              onClick={() => {
                setIsAIModalOpen(true);
                updateURL('ai');
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View AI Integration Details"
            >
              <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              AI Philosophy
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</div>

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

        {/* Wrap all content that should be behind maintenance overlay */}
        <div className="relative">
          {isMaintenanceMode && maintenanceConfig.isEnabled && (
            <MaintenanceOverlay onPasswordSuccess={handleMaintenancePassword} />
          )}

          {/* Projects Section - Two Columns */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0">
                      {renderIcon(project.iconName)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 dark:text-white">{project.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{project.description}</p>
                      
                      {/* Tech Stack Tags */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.techStack.map((tech, techIndex) => (
                          <span 
                            key={techIndex}
                            className="px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors tech-tag"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      
                      <a
                        href={project.link}
                        onClick={(e) => handleProjectClick(e, project)}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                        aria-label={project.ariaLabel}
                      >
                        View Project →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Two Column Layout for Gallery and Playlist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{minHeight: "0"}}>
          {/* Gallery Column */}
          <div>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Mood</h2>
            <div className={`relative overflow-hidden rounded-lg transition-opacity duration-500 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <div
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {shuffledImages.map((image, index) => (
                  <div key={index} className="relative w-full aspect-square flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                    {/* Blurred background */}
                    <div 
                      className="absolute inset-0 blur-xl opacity-50"
                      style={{
                        backgroundImage: `url(${image})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                      }}
                    ></div>
                   {/* Main image container with hover effects */}
                <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={() => handleImageClick(image)}
                >
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                {/* Main image */}
                <Image
                src={image}
                alt={`Slide ${index + 1}`}
                width={800}
                height={800}
                quality={75}
                className="max-w-full max-h-full object-contain transform transition-transform duration-300 group-hover:scale-105"
                />
                </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Playlist Column */}
          <div>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Vibes</h2>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                title="Spotify playlist"
                src="https://open.spotify.com/embed/album/4fcZBukqygltK48rGGzylj?utm_source=generator&theme=0"
                width="100%"
                height="425"
                loading="lazy"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>

        <footer className="border-t border-gray-100 dark:border-gray-800 py-6 mt-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>&copy; 2025 seanmun.com</span>
                <span className="px-2">•</span>
                <span className="flex items-center gap-1">
                  Designed and built by Sean Munley
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    setIsPrivacyModalOpen(true);
                    updateURL('privacy');
                  }}
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </button>
                <a 
                  href="https://github.com/seanmun" 
                  target="_blank" 
                  aria-label="Visit Sean's GitHub Profile"
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.linkedin.com/in/seanmunley/" 
                  target="_blank" 
                  aria-label="Visit Sean's LinkedIn"
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </footer>
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
  </div>
  );
};

export default PersonalWebsite;
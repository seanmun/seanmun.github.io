'use client';

import React, { useState, useEffect } from 'react';
import { 
    GithubIcon, LinkedinIcon, FileTextIcon, ZapIcon, TrophyIcon, CodesandboxIcon, 
    BeefIcon, CloudIcon, BotIcon, CodeIcon, ShieldCheckIcon, XIcon } from "lucide-react";

    interface EventData {
      cookieId: string;
      timestamp: string;
      eventType: 'pageview';
      geolocation?: {
        latitude: number;
        longitude: number;
      };
    }
    

    interface PersonalWebsiteProps {
  galleryImages: string[]
}
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';
import { maintenanceConfig } from '../config/maintenance';
import { MaintenanceOverlay } from './MaintenanceOverlay';

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


  // Add this effect to check session storage
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


  useEffect(() => {
    // Move localStorage logic to useEffect
    const existingId = localStorage.getItem('visitorId');
    if (existingId) {
      setCookieId(existingId);
    } else {
      const newId = Math.random().toString(36).substring(2);
      localStorage.setItem('visitorId', newId);
      setCookieId(newId);
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleImageClick = (imageSrc: string) => {
    setFullscreenImage(imageSrc);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

    const { settings } = useAccessibilitySettings();  // Add this line
  const projects = [
    {
      title: "Kinetic.email",
      description: "This project is a comprehensive portfolio showcasing my specialized kinetic email designs for CRM programs, tailored for various clients, audiences, and initiatives.",
      icon: <ZapIcon className="w-12 h-12 text-blue-600" />,
      link: "#",
      requiresPassword: true
    },
    {
      title: "Telegram Bot",
      description: "@Sam_Hinkie_bot serves as a league information hub and interactive companion for my fantasy basketball league. Built with Python and deployed on Railway, this bot interfaces with Telegram's API to handle commands, mentions, and provide responses to league members.",
      icon: <BotIcon className="w-12 h-12 text-blue-600" />,
      link: "https://github.com/seanmun/HinkieBot",
      requiresPassword: false
    },
    {
      title: "DraftDayTrades.com",
      description: "Interactive draft prediction platform that turns NFL and NBA drafts into engaging pick-by-pick contests. Players make picks in real-time, earning points based on accuracy, while a live leaderboard tracks confidence pool rankings and results.",
      icon: <TrophyIcon className="w-12 h-12 text-blue-600" />,
      link: "https://draftdaytrades.com/",
      requiresPassword: false
    },
    {
      title: "1 Pixel Health",
      description: "Explore 300,000 years of human dietary evolution through an interactive horizontal scroll where each pixel represents one year, showcasing the transition from natural diets to modern preservative-laden and seed oil-rich foods.",
      icon: <BeefIcon className="w-12 h-12 text-blue-600" />,
      link: "https://seanmun.com/1-pixel-health/",
      requiresPassword: false
    },
    {
      title: "OrdinalFrame",
      description: "A Raspberry Pi-powered digital art frame that dynamically displays Bitcoin Ordinals, turning blockchain inscriptions into ever-evolving wall decor.",
      icon: <CodesandboxIcon className="w-12 h-12 text-blue-600" />,
      link: "#",
      requiresPassword: true
    },
    {
      title: "Salesforce Munley Cloud (SFMC)",
      description: "SFMC playground I've pieced together to share the treasure trove of tips and tools I've unearthed over the years in the Salesforce Marketing Cloud universe.",
      icon: <CloudIcon className="w-12 h-12 text-blue-600" />,
      link: "#",
      requiresPassword: true
    }
  ];

   
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

  const handleProjectClick = (e: React.MouseEvent, link: string, requiresPassword: boolean) => {
    e.preventDefault();
    if (requiresPassword) {
      setActiveLink(link);
      setIsModalOpen(true);
      setError('');
      setPassword('');
    } else {
      window.open(link, '_blank');
    }
  };


  // First useEffect for maintenance mode
useEffect(() => {
  const hasMaintenanceAccess = sessionStorage.getItem('maintenanceAccess') === 'true';
  if (hasMaintenanceAccess) {
    setIsMaintenanceMode(false);
  }
}, []);

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

// Third useEffect for gallery
useEffect(() => {
  setIsVisible(true);
  setShuffledImages(shuffleArray([...galleryImages]));
  
  const interval = setInterval(() => {
    setActiveSlide((prev) => (prev + 1) % galleryImages.length);
  }, 5000);

  return () => clearInterval(interval);
}, [galleryImages, galleryImages.length]);

// Fourth useEffect for tracking
useEffect(() => {
  const trackEvent = async () => {
    try {
      let eventData: EventData = {
        cookieId,
        timestamp: new Date().toISOString(),
        eventType: 'pageview' as const
      };

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000
          });
        });
        
        eventData = {
          ...eventData,
          geolocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        };
      } catch {
        console.log('Geolocation not available or denied');
      }

      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  };

  if (cookieId) {
    const hasTracked = sessionStorage.getItem('hasTrackedPageview');
    if (!hasTracked) {
      trackEvent();
      sessionStorage.setItem('hasTrackedPageview', 'true');
    }
  }
}, [cookieId]);

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
    />
  </div>
</div>
    <div>
      <h1 className="text-3xl font-bold mb-2 leading-relaxed dark:text-white">
        Sean Munley
      </h1>
        {/* Add current position and employer */}

      <p className="text-base leading-relaxed text-gray-700 dark:text-gray-400 mb-4 max-w-xl">
        <span className="text-gray-600 dark:text-gray-300 font-medium">
          CRM strategist, developer, and marketer
        </span>{' '}
        with over a decade of experience delivering innovative solutions to improve marketing performance. I specialize in crafting data-driven strategies, building interactive email experiences, and optimizing enterprise CRM systems. Whether it&#39;s developing AMP-powered emails, designing patient journey strategies, or implementing scalable frameworks, I turn complex challenges into impactful results.
      </p>
      <nav aria-label="Social links">
        <div className="flex gap-4">
          {/* Social links remain the same but with improved aria-labels */}
          <div className="relative group">
            <a 
              href="https://github.com/seanmun" 
              target='_blank'
              rel="noopener noreferrer"
              aria-label="Visit Sean's GitHub Profile"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <GithubIcon className="w-5 h-5" />
            </a>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              GitHub
            </div>
          </div>
          
          <div className="relative group">
            <a 
              href="https://www.linkedin.com/in/sean-munley/" 
              target='_blank'
              rel="noopener noreferrer"
              aria-label="Connect with Sean on LinkedIn"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <LinkedinIcon className="w-5 h-5" />
            </a>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              LinkedIn
            </div>
          </div>

           {/* Add Certifications Button */}
          <div className="relative group">
            <button 
              onClick={() => setIsCertsModalOpen(true)}
              aria-label="View Certifications and Skills"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <ShieldCheckIcon className="w-5 h-5" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Certs
            </div>
          </div>
          
          <div className="relative group">
            <button 
              onClick={() => setResumeModalOpen(true)}
              aria-label="View Resume Summary"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <FileTextIcon className="w-5 h-5" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Resume
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</div>

{/* Resume Modal */}
{isResumeModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
    <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
      {/* Sticky header with close button */}
      <div className={`sticky top-0 rounded-t-lg flex justify-between items-center p-4 border-b
        ${settings.theme === 'amber'
          ? 'bg-amber-50 border-amber-100'
          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }`}>
        <h3 className={`text-xl font-semibold
          ${settings.theme === 'amber'
            ? 'text-amber-900'
            : 'text-gray-900 dark:text-white'
          }`}>
          Professional Experience
        </h3>
        <button
          onClick={() => setResumeModalOpen(false)}
          className={`p-2 rounded-full transition-colors
            ${settings.theme === 'amber'
              ? 'text-amber-600 hover:bg-amber-100'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          aria-label="Close modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className={`p-4 overflow-y-auto max-h-[60vh] md:max-h-[70vh]
        ${settings.theme === 'amber'
          ? 'bg-amber-50'
          : 'bg-white dark:bg-gray-800'
        }`}>
        <div className="space-y-6">
          {/* Career Summary */}
          <section>
            <h4 className={`text-lg font-medium mb-4
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              CAREER SUMMARY
            </h4>
            
            <div className="space-y-6">
              {/* Digitas Health */}
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium">
                      <a 
                        href="https://www.digitashealth.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:underline ${
                          settings.theme === 'amber'
                            ? 'text-amber-700 hover:text-amber-900'
                            : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                        }`}
                      >
                        DIGITAS HEALTH
                      </a>
                    </h5>
                    <p className={`text-sm ${
                      settings.theme === 'amber'
                        ? 'text-amber-600'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>Philadelphia, PA</p>
                  </div>
                  <span className={`text-sm ${
                    settings.theme === 'amber'
                      ? 'text-amber-600'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>2013 April – Present</span>
                </div>
                <ul className={`list-disc pl-5 space-y-1 ${
                  settings.theme === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  <li>Vice President/Director, CRM Innovation (Promotion, October 2019)</li>
                  <li>Director, Marketing Operations (Promotion, July 2015)</li>
                  <li>Manager, Marketing Operations</li>
                </ul>
              </div>

              {/* Elsevier */}
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium">
                      <a 
                        href="https://www.elsevier.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`hover:underline ${
                          settings.theme === 'amber'
                            ? 'text-amber-700 hover:text-amber-900'
                            : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                        }`}
                      >
                        ELSEVIER
                      </a>
                    </h5>
                    <p className={`text-sm ${
                      settings.theme === 'amber'
                        ? 'text-amber-600'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>Philadelphia, PA</p>
                  </div>
                  <span className={`text-sm ${
                    settings.theme === 'amber'
                      ? 'text-amber-600'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>2008 – 2013 April</span>
                </div>
                <ul className={`list-disc pl-5 space-y-1 ${
                  settings.theme === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  <li>Customer Marketing Manager (Promotion, September 2012)</li>
                  <li>Manager, Customer Analytics (Promotion, August 2010)</li>
                  <li>Direct Marketing Analyst</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Education */}
          <section>
            <h4 className={`text-lg font-medium mb-4
              ${settings.theme === 'amber'
                ? 'text-amber-900'
                : 'text-gray-800 dark:text-gray-200'
              }`}>
              EDUCATION
            </h4>
            <div className="flex justify-between items-start">
              <div>
                <h5 className={`font-medium ${
                  settings.theme === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>TEMPLE UNIVERSITY</h5>
                <p className={`text-sm ${
                  settings.theme === 'amber'
                    ? 'text-amber-600'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>Philadelphia, PA</p>
                <p className={
                  settings.theme === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-600 dark:text-gray-400'
                }>Bachelor of Business Administration</p>
                <p className={
                  settings.theme === 'amber'
                    ? 'text-amber-800'
                    : 'text-gray-600 dark:text-gray-400'
                }>Major: Marketing</p>
              </div>
              <span className={`text-sm ${
                settings.theme === 'amber'
                  ? 'text-amber-600'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>2005 – 2008</span>
            </div>
          </section>

          {/* Contact Section */}
          <div className={`mt-8 p-4 rounded-lg ${
            settings.theme === 'amber'
              ? 'bg-amber-100'
              : 'bg-gray-50 dark:bg-gray-700'
          }`}>
            <p className={`text-sm mb-2 ${
              settings.theme === 'amber'
                ? 'text-amber-800'
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              For a detailed resume including full work history and responsibilities, please get in touch:
            </p>
            <a 
              href="mailto:sean.munley@protonmail.com"
              className={`text-sm inline-flex items-center ${
                settings.theme === 'amber'
                  ? 'text-amber-700 hover:text-amber-900'
                  : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              } transition-colors`}
            >
              sean.munley@protonmail.com →
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* Certifications Modal */}
{isCertsModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
    <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
      {/* Sticky header with close button */}
      <div className={`sticky top-0 rounded-t-lg flex justify-between items-center p-4 border-b
        ${settings.theme === 'amber'
          ? 'bg-amber-50 border-amber-100'
          : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }`}>
        <h3 className={`text-xl font-semibold
          ${settings.theme === 'amber'
            ? 'text-amber-900'
            : 'text-gray-900 dark:text-white'
          }`}>
          Certifications & Skills
        </h3>
        <button
          onClick={() => setIsCertsModalOpen(false)}
          className={`p-2 rounded-full transition-colors
            ${settings.theme === 'amber'
              ? 'text-amber-600 hover:bg-amber-100'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          aria-label="Close modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className={`p-4 space-y-6 overflow-y-auto max-h-[60vh] md:max-h-[70vh]
        ${settings.theme === 'amber'
          ? 'bg-amber-50'
          : 'bg-white dark:bg-gray-800'
        }`}>
        <div>
          <h4 className={`text-lg font-medium mb-2
            ${settings.theme === 'amber'
              ? 'text-amber-900'
              : 'text-gray-800 dark:text-gray-200'
            }`}>
            Certification
          </h4>
          <p className={`${settings.theme === 'amber' ? 'text-amber-800' : 'text-gray-600 dark:text-gray-400'}`}>
            University of Penn LPS Full Stack Coding Boot Camp <span className="text-gray-500 dark:text-gray-500">- July 2019</span>
          </p>
        </div>

        <div>
          <h4 className={`text-lg font-medium mb-2
            ${settings.theme === 'amber'
              ? 'text-amber-900'
              : 'text-gray-800 dark:text-gray-200'
            }`}>
            Dev Proficiencies
          </h4>
          <p className="flex flex-wrap gap-2">
            {['HTML', 'CSS', 'SQL', 'AMP', 'AMPscript', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'Handlebars', 'Python'
            ].map((skill) => (
              <span 
                key={skill} 
                className={`px-2 py-1 rounded text-sm
                  ${settings.theme === 'amber'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
              >
                {skill}
              </span>
            ))}
          </p>
        </div>

        <div>
          <h4 className={`text-lg font-medium mb-2
            ${settings.theme === 'amber'
              ? 'text-amber-900'
              : 'text-gray-800 dark:text-gray-200'
            }`}>
            Marketing Tools
          </h4>
          <p className="flex flex-wrap gap-2">
            {[
              'Shopify', 'Salesforce', 'SFMC', 'Data Cloud', 'Pardot', 
              'Veeva', 'Eloqua', 'Iterable', 'Marketo', 'Power BI'
            ].map((tool) => (
              <span 
                key={tool} 
                className={`px-2 py-1 rounded text-sm
                  ${settings.theme === 'amber'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
              >
                {tool}
              </span>
            ))}
          </p>
        </div>

        <div>
          <h4 className={`text-lg font-medium mb-2
            ${settings.theme === 'amber'
              ? 'text-amber-900'
              : 'text-gray-800 dark:text-gray-200'
            }`}>
            Project Management Tools
          </h4>
          <p className="flex flex-wrap gap-2">
            {[
              'JIRA', 'Notion', 'Monday.com', 'Workfront'
            ].map((tool) => (
              <span 
                key={tool} 
                className={`px-2 py-1 rounded text-sm
                  ${settings.theme === 'amber'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
              >
                {tool}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  </div>
)}

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
                    {project.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 dark:text-white">{project.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{project.description}</p>
                    
                    <a href={project.link}
                      onClick={(e) => handleProjectClick(e, project.link, project.requiresPassword)}
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                    >
                      View Project →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

    

        {/* Mood and Vibes sections remain the same */}
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
                width={800}  // Set appropriate size
                height={800}
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
            <h2 className="text-xl font-bold mb-4 dark:text-white">Vibe</h2>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src="https://open.spotify.com/embed/album/4A9NpSjSaA2cJss3ksEFVE?utm_source=generator&theme=0"
                width="100%"
                height="477"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-6 mt-8">
  <div className="max-w-4xl mx-auto px-4">
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>&copy; 2025 seanmun.com</span>
        <span className="px-2">•</span>
        <span className="flex items-center gap-1">
          Designed and built by Sean Munley  {' '}
          <div className="relative group">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              aria-label="Learn about the tech stack"
            >
              <CodeIcon className="w-4 h-4" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Build Details
            </div>
          </div>
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => setIsPrivacyModalOpen(true)}
          className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        >
          Privacy Policy
        </button>
        <a 
          href="https://github.com/seanmun" 
          target="_blank" 
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <GithubIcon className="w-4 h-4" />
        </a>
        <a 
          href="https://www.linkedin.com/in/sean-munley/" 
          target="_blank" 
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <LinkedinIcon className="w-4 h-4" />
        </a>
      </div>
    </div>
  </div>
</footer>
</div>

{/* AI Development Modal */}
{isAIModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
  <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
    {/* Sticky header with close button */}
    <div className={`sticky top-0 rounded-t-lg flex justify-between items-center p-4 border-b
      ${settings.theme === 'amber'
        ? 'bg-amber-50 border-amber-100'
        : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
      }`}>
      <h3 className={`text-xl font-semibold
        ${settings.theme === 'amber'
          ? 'text-amber-900'
          : 'text-gray-900 dark:text-white'
        }`}>
        Embracing AI in Development
      </h3>
      <button
        onClick={() => setIsAIModalOpen(false)}
        className={`p-2 rounded-full transition-colors
          ${settings.theme === 'amber'
            ? 'text-amber-600 hover:bg-amber-100'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        aria-label="Close modal"
      >
        <XIcon className="w-6 h-6" />
      </button>
    </div>

      {/* Scrollable content */}
      {/* Scrollable content */}
      <div className={`p-4 space-y-4 overflow-y-auto max-h-[60vh] md:max-h-[70vh]
        ${settings.theme === 'amber'
          ? 'bg-amber-50'
          : 'bg-white dark:bg-gray-800'
        }`}>
        <div className={`space-y-4
          ${settings.theme === 'amber'
            ? 'text-amber-900'
            : 'text-gray-600 dark:text-gray-400'
          }`}>
          {/* Content stays the same */}
          <p>
            While I&rsquo;m experienced in multiple programming languages, I&rsquo;ve embraced AI to accelerate development and innovation. This approach has transformed how I build solutions, allowing me to focus on creative problem-solving rather than getting caught up in framework complexities.
          </p>

          <div className="my-6 flex justify-center">
            <Image
              src="/profile/silencememe.jpg"
              alt="Silence Meme"
              width={400}
              height={300}
              className="rounded-lg max-w-full h-auto"
            />
          </div>

          <p>
            We&rsquo;re entering an era where the ability to conceptualize and direct AI tools is becoming as valuable as traditional coding skills. Success increasingly belongs to those who can effectively leverage these new technologies.
          </p>

          <p>
            This site demonstrates this approach in action, built using various AI platforms including Claude, Venice, Grok, ChatGPT, and Gemini. I continuously explore and integrate new AI tools to enhance development capabilities.
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{/* Privacy Policy Modal */}
{isPrivacyModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
    <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
      {/* Sticky header with close button */}
      <div className={`sticky top-0 rounded-t-lg flex justify-between items-center p-4 border-b
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
          onClick={() => setIsPrivacyModalOpen(false)}
          className={`p-2 rounded-full transition-colors
            ${settings.theme === 'amber'
              ? 'text-amber-600 hover:bg-amber-100'
              : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          aria-label="Close modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className={`p-4 overflow-y-auto max-h-[60vh] md:max-h-[70vh]
        ${settings.theme === 'amber'
          ? 'bg-amber-50'
          : 'bg-white dark:bg-gray-800'
        }`}>
        <div className={`text-sm space-y-4 ${
          settings.theme === 'amber'
            ? 'text-amber-900'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          <p>Last updated: January 11, 2025</p>

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
        className="relative max-w-[600px] max-h-[80vh]"  // Changed to 600px
        onClick={e => e.stopPropagation()}
        >
        <Image
        src={fullscreenImage}
        alt="Fullscreen view"
        width={600}  // Changed to 600
        height={600}  // Changed to 600
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
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
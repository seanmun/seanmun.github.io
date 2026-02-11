'use client';
import React, { useState, useEffect } from 'react';
import { trackEvent, getDeviceType, trackModalOpen } from '@/lib/track-utils';
import { projects } from '@/data/projects';
import { Windows98Layout } from './layouts/Windows98Layout';
import { Window98 } from './ui/Window98';
import { ProjectModal } from './modals/ProjectModal';
import { ResumeModal } from './modals/ResumeModal';
import { CertsModal } from './modals/CertsModal';
import { AIModal } from './modals/AIModal';
import { Project } from '@/data/projects';
import { AccessibilityMenu } from './AccessibilityMenu';
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';
import Image from 'next/image';

interface Windows98WebsiteProps {
  galleryImages: string[]
}

const shuffleArray = (array: string[]) => {
  const shuffled = [...array];
  let currentIndex = shuffled.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  return shuffled;
};

const Windows98Website = ({ galleryImages }: Windows98WebsiteProps) => {
  const { settings } = useAccessibilitySettings();

  const [cookieId, setCookieId] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isCertsModalOpen, setIsCertsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [shuffledImages, setShuffledImages] = useState<string[]>([]);

  // Initialize visitor tracking
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

  // Shuffle images on mount
  useEffect(() => {
    setShuffledImages(shuffleArray(galleryImages));
  }, [galleryImages]);

  // Track pageview
  useEffect(() => {
    if (cookieId) {
      trackEvent({
        cookieId,
        eventType: 'pageview',
        deviceType: getDeviceType(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: new Date()
      });
    }
  }, [cookieId]);

  const handleProjectClick = (project: Project) => {
    if (project.modalContent || project.isLive === false) {
      setSelectedProject(project);
      setIsProjectModalOpen(true);
      trackModalOpen(cookieId, project.title);
      return;
    }

    if (project.link) {
      window.open(project.link, '_blank');
    }
  };

  return (
    <Windows98Layout>
      <AccessibilityMenu />
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* About Me Window */}
        <Window98 title="About Me" width="w-full" height="340px">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-3">
              <Image
                src="/profile/smunley2019.png"
                alt="Profile"
                width={64}
                height={64}
                className="rounded"
                style={{ imageRendering: 'auto' }}
              />
              <div>
                <h2 className="font-bold text-base">Sean Munley</h2>
                <p className="text-xs">CRM Strategist, Developer & Marketer</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed">
              CRM strategist, developer, and marketer with over a decade of experience delivering innovative solutions to improve marketing performance. I specialize in crafting data-driven strategies, building interactive email experiences, and optimizing enterprise CRM systems. Beyond my work, I enjoy <strong>vibe coding</strong> apps, agents, bots and devices as a hobby.
            </p>
          </div>
        </Window98>

        {/* Projects Window */}
        <Window98 title="My Projects" width="w-full" height="400px" className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {projects.filter(p => p.status === 'Prod' || p.status === 'MVP').slice(0, 6).map((project, idx) => (
              <button
                key={idx}
                onClick={() => handleProjectClick(project)}
                className="p-2 text-left hover:bg-blue-100 border border-gray-300"
                style={{
                  backgroundColor: 'var(--win98-white)',
                  fontSize: '11px'
                }}
              >
                <div className="font-bold mb-1">{project.title}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{project.description}</div>
                {project.status && (
                  <div className="mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded">
                      {project.status}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Window98>

        {/* Contact Window */}
        <Window98 title="Contact.exe" width="w-full" height="300px">
          <div className="space-y-3 text-xs">
            <div>
              <strong>Email:</strong>
              <br />
              <a href="mailto:sean.munley@protonmail.com" className="text-blue-600 hover:text-purple-600 underline">
                sean.munley@protonmail.com
              </a>
            </div>
            <div>
              <strong>LinkedIn:</strong>
              <br />
              <a
                href="https://www.linkedin.com/in/sean-munley/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-purple-600 underline"
              >
                linkedin.com/in/sean-munley
              </a>
            </div>
            <div>
              <strong>GitHub:</strong>
              <br />
              <a
                href="https://github.com/seanmun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-purple-600 underline"
              >
                github.com/seanmun
              </a>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setIsResumeModalOpen(true);
                  trackModalOpen(cookieId, 'Resume');
                }}
                className="w-full text-left px-2 py-1 text-xs"
                style={{
                  backgroundColor: '#c0c0c0',
                  border: '2px solid',
                  borderColor: '#ffffff #000000 #000000 #ffffff',
                  boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080'
                }}
              >
                📄 View Resume
              </button>
              <button
                onClick={() => {
                  setIsCertsModalOpen(true);
                  trackModalOpen(cookieId, 'Certifications');
                }}
                className="w-full text-left px-2 py-1 text-xs"
                style={{
                  backgroundColor: '#c0c0c0',
                  border: '2px solid',
                  borderColor: '#ffffff #000000 #000000 #ffffff',
                  boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080'
                }}
              >
                🛡️ Certifications
              </button>
              <button
                onClick={() => {
                  setIsAIModalOpen(true);
                  trackModalOpen(cookieId, 'AI Projects');
                }}
                className="w-full text-left px-2 py-1 text-xs"
                style={{
                  backgroundColor: '#c0c0c0',
                  border: '2px solid',
                  borderColor: '#ffffff #000000 #000000 #ffffff',
                  boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080'
                }}
              >
                🤖 AI Projects
              </button>
            </div>
          </div>
        </Window98>

        {/* Gallery Window */}
        <Window98 title="My Pictures" width="w-full" height="350px" className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-1">
            {shuffledImages.slice(0, 6).map((img, idx) => (
              <div key={idx} className="relative aspect-square bg-gray-100">
                <Image
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100px, 150px"
                />
              </div>
            ))}
          </div>
        </Window98>

      </div>

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setSelectedProject(null);
          }}
          project={selectedProject}
        />
      )}

      {/* Resume Modal */}
      <ResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        settings={settings}
      />

      {/* Certifications Modal */}
      <CertsModal
        isOpen={isCertsModalOpen}
        onClose={() => setIsCertsModalOpen(false)}
        settings={settings}
      />

      {/* AI Projects Modal */}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        settings={settings}
      />
    </Windows98Layout>
  );
};

export default Windows98Website;

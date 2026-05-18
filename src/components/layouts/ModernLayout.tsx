'use client';
import React from 'react';
import Image from 'next/image';
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['900'],
});
import {
  Github,
  Linkedin,
  FileText,
  Bot,
  ShieldCheck,
  Zap,
  Trophy,
  Box,
  Beef,
  Activity,
  Sun,
  Key,
  Banknote,
  Medal,
  DollarSign,
  Rocket,
  Mic,
  LandPlot
} from "lucide-react";
import { projects } from '@/data/projects';
import { SeesawCard } from '@/components/ui/SeesawCard';
import { BandReveal } from '@/components/ui/BandReveal';

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
  Medal,
  DollarSign,
  Rocket,
  Mic,
  LandPlot
};

// Helper function to render icons
const renderIcon = (iconName: string) => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent className="w-12 h-12 text-blue-600" /> : null;
};

interface ModernLayoutProps {
  cookieId: string;
  shuffledImages: string[];
  activeSlide: number;
  isVisible: boolean;
  handleImageClick: (image: string) => void;
  handleProjectClick: (e: React.MouseEvent, project: typeof projects[number]) => void;
  trackLinkClick: (cookieId: string, linkName: string, linkUrl: string) => void;
  trackModalOpen: (cookieId: string, modalName: string) => void;
  setResumeModalOpen: (open: boolean) => void;
  setIsCertsModalOpen: (open: boolean) => void;
  setIsAIModalOpen: (open: boolean) => void;
  setIsPrivacyModalOpen: (open: boolean) => void;
  updateURL: (section: string | null) => void;
}

export function ModernLayout({
  cookieId,
  shuffledImages,
  activeSlide,
  isVisible,
  handleImageClick,
  handleProjectClick,
  trackLinkClick,
  trackModalOpen,
  setResumeModalOpen,
  setIsCertsModalOpen,
  setIsAIModalOpen,
  setIsPrivacyModalOpen,
  updateURL,
}: ModernLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Bio Section */}
      <div className="mb-6 spring-active">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="relative w-40 h-40 flex-shrink-0 sm:mt-3">
            {/* Animated blobs (ambient halo — visible throughout) */}
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
            {/* Profile image — band reveal materializes inside the blob clip */}
            <div
              className="relative w-full h-full overflow-hidden bg-white dark:bg-gray-800 amber-bg"
              style={{ animation: 'blobShape 20s infinite', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
            >
              <BandReveal sessionKey="hero-avatar-reveal" numBands={6} className="w-full h-full">
                <Image
                  src="/profile/smunley2019.png"
                  alt="Profile"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  priority
                  quality={75}
                />
              </BandReveal>
            </div>
          </div>
          <div>
            <h1 className={`hero-spring-2 text-5xl font-black mb-2 leading-relaxed tracking-wide ${orbitron.className}`}>
              <span className="name-bright bg-gradient-to-r bg-clip-text text-transparent">SeanMun</span><span className="name-dull bg-gradient-to-r bg-clip-text text-transparent">ley</span>
            </h1>

            <p className="hero-spring-3 text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 mb-3">
              CRM strategist · developer · marketer
            </p>

            <p className="hero-spring-4 text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4 max-w-xl">
              Decade-plus designing data-driven CRM systems, interactive email experiences, and AI-driven solutions for enterprise marketing teams.
            </p>

            {/* Navigation Icons */}
            <nav className="hero-spring-5 flex gap-2 items-start">
              <a
                href="https://github.com/seanmun"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick(cookieId, 'GitHub Profile', 'https://github.com/seanmun')}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="GitHub Profile"
              >
                <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">GitHub</span>
              </a>

              <a
                href="https://www.linkedin.com/in/sean-munley/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick(cookieId, 'LinkedIn Profile', 'https://www.linkedin.com/in/sean-munley/')}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">LinkedIn</span>
              </a>

              <button
                onClick={() => {
                  trackModalOpen(cookieId, 'Resume');
                  setResumeModalOpen(true);
                  updateURL('resume');
                }}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="View Resume"
              >
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Resume</span>
              </button>

              <button
                onClick={() => {
                  trackModalOpen(cookieId, 'Certifications');
                  setIsCertsModalOpen(true);
                  updateURL('skills');
                }}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="View Certifications"
              >
                <ShieldCheck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Skills</span>
              </button>

              <button
                onClick={() => {
                  trackModalOpen(cookieId, 'AI Philosophy');
                  setIsAIModalOpen(true);
                  updateURL('ai');
                }}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="View AI Integration Details"
              >
                <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">AI</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Projects Section - Two Columns */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-1 dark:text-white">Projects</h2>
        <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-4 max-w-xl">
          Apps, agents, bots, and devices I vibe code — sometimes to entertain myself, sometimes to amuse my friends.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project, index) => (
            <SeesawCard
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
            </SeesawCard>
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
              src="https://open.spotify.com/embed/album/0MzU9pXhacv2QkVjAhDVtd?utm_source=generator&theme=0"
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
              <span>&copy; 2026 seanmun.com</span>
              <span className="px-2">•</span>
              <span className="flex items-center gap-1">
                Designed and built by Sean Munley
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  trackModalOpen(cookieId, 'Privacy Policy');
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
                rel="noopener noreferrer"
                onClick={() => trackLinkClick(cookieId, 'GitHub Footer', 'https://github.com/seanmun')}
                aria-label="Visit Sean's GitHub Profile"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/sean-munley/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick(cookieId, 'LinkedIn Footer', 'https://www.linkedin.com/in/sean-munley/')}
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
  );
}

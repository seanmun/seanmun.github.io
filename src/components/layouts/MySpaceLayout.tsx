'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Github, Linkedin, FileText, ShieldCheck, Mail } from "lucide-react";
import { projects } from '@/data/projects';

interface MySpaceLayoutProps {
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

export function MySpaceLayout({
  cookieId,
  shuffledImages,
  handleImageClick,
  handleProjectClick,
  trackLinkClick,
  trackModalOpen,
  setResumeModalOpen,
  setIsCertsModalOpen,
  setIsPrivacyModalOpen,
  setIsAIModalOpen,
  updateURL,
}: MySpaceLayoutProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: 'Verdana, Geneva, sans-serif',
        backgroundImage: 'url(/myspace/s.png)',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'top left',
        backgroundSize: '160px 160px'
      }}
    >
      {/* Dark Blue Banner with Logo */}
      <div className="w-full" style={{
        background: 'linear-gradient(to bottom, #1e3a8a, #1e40af)',
        borderBottom: '2px solid #1e3a8a',
        padding: '8px 20px'
      }}>
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <h1 className="text-white font-bold text-xl" style={{ fontFamily: 'Arial, sans-serif' }}>
            seanmun.com
          </h1>
          <span className="text-white text-xl">|</span>
          <Link href="/" className="text-white text-sm hover:underline cursor-pointer">
            Home
          </Link>
        </div>
      </div>

      {/* Classic MySpace Navigation Bar */}
      <div className="w-full" style={{
        background: 'linear-gradient(to bottom, #87CEEB, #5DADE2)',
        borderBottom: '2px solid #4A90D9',
        padding: '10px 20px'
      }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 text-white text-xs items-center overflow-hidden whitespace-nowrap">
            <Link href="/" className="hover:underline cursor-pointer flex-shrink-0">Browse</Link>
            <span className="flex-shrink-0">|</span>
            <span className="hover:underline cursor-pointer flex-shrink-0">Invite</span>
            <span className="flex-shrink-0">|</span>
            <span className="hover:underline cursor-pointer flex-shrink-0">Blog</span>
            <span className="flex-shrink-0">|</span>
            <span className="hover:underline cursor-pointer flex-shrink-0">Mail</span>
            <span className="flex-shrink-0">|</span>
            {projects.map((project, idx) => (
              <React.Fragment key={idx}>
                <a
                  href={project.link}
                  onClick={(e) => handleProjectClick(e, project)}
                  className="hover:underline cursor-pointer flex-shrink-0"
                >
                  {project.title}
                </a>
                {idx < projects.length - 1 && <span className="flex-shrink-0">|</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-4">

          {/* Left Sidebar */}
          <div className="space-y-4">
            {/* Profile Section */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="text-white px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#6699CC' }}>
                Sean
              </div>
              <div className="p-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex justify-center md:justify-start">
                    <Image
                      src="/profile/smunley2019.png"
                      alt="Profile"
                      width={180}
                      height={180}
                      className="border-2 border-gray-400"
                      priority
                    />
                  </div>
                  <div className="flex-1 text-xs space-y-1 text-center md:text-left">
                    <div><strong>Male</strong></div>
                    <div><strong>41 years old</strong></div>
                    <div><strong>Philadelphia, PENNSYLVANIA</strong></div>
                    <div><strong>United States</strong></div>
                  </div>
                </div>
                <div className="text-xs mt-3">
                  <div><strong>Last Login:</strong></div>
                  <div>12/11/2007</div>
                </div>
                <div className="text-xs mt-2">
                  <div><strong>Mood:</strong></div>
                  <div>vibing ✨</div>
                </div>
                <div className="text-xs mt-2">
                  <div><strong>View My:</strong> <a href="#photos" className="text-blue-600 hover:underline">Pics</a></div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="text-white px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#6699CC' }}>
                Contacting Sean
              </div>
              <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2">
                <a
                  href="https://github.com/seanmun"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLinkClick(cookieId, 'GitHub MySpace', 'https://github.com/seanmun')}
                  className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <Github className="w-4 h-4" style={{ color: '#CC6600' }} /> GitHub
                </a>
                <button
                  onClick={() => {
                    trackModalOpen(cookieId, 'AI Philosophy');
                    setIsAIModalOpen(true);
                    updateURL('ai');
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <FileText className="w-4 h-4" style={{ color: '#CC6600' }} /> AI POV
                </button>
                <a
                  href="https://www.linkedin.com/in/seanmunley/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLinkClick(cookieId, 'LinkedIn MySpace', 'https://www.linkedin.com/in/seanmunley/')}
                  className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <Linkedin className="w-4 h-4" style={{ color: '#CC6600' }} /> LinkedIn
                </a>
                <button
                  onClick={() => {
                    trackModalOpen(cookieId, 'Resume');
                    setResumeModalOpen(true);
                    updateURL('resume');
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <FileText className="w-4 h-4" style={{ color: '#CC6600' }} /> View Resume
                </button>
                <a
                  href="mailto:sean.munley@protonmail.com"
                  className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <Mail className="w-4 h-4" style={{ color: '#CC6600' }} /> Send Message
                </a>
                <button
                  onClick={() => {
                    trackModalOpen(cookieId, 'Certifications');
                    setIsCertsModalOpen(true);
                    updateURL('skills');
                  }}
                  className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <ShieldCheck className="w-4 h-4" style={{ color: '#CC6600' }} /> Skills & Certs
                </button>
              </div>
            </div>

            {/* Music Section */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="text-white px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#6699CC' }}>
                Music
              </div>
              <div className="p-3">
                <iframe
                  title="Spotify playlist"
                  src="https://open.spotify.com/embed/album/4fcZBukqygltK48rGGzylj?utm_source=generator&theme=0"
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="encrypted-media"
                  style={{ border: '1px solid #ccc' }}
                ></iframe>
              </div>
            </div>

            {/* URL Section */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="text-white px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#6699CC' }}>
                MySpace URL:
              </div>
              <div className="p-3">
                <input
                  type="text"
                  value="seanmun.com"
                  readOnly
                  className="w-full px-2 py-1 text-xs border border-gray-400 bg-white"
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
            </div>

            {/* Photos Section */}
            <div id="photos" className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="text-white px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#6699CC' }}>
                Sean&apos;s Photos
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {shuffledImages.slice(0, 6).map((image, index) => (
                    <div
                      key={index}
                      onClick={() => handleImageClick(image)}
                      className="cursor-pointer border-2 border-gray-400 hover:border-blue-600 transition-colors"
                    >
                      <Image
                        src={image}
                        alt={`Photo ${index + 1}`}
                        width={150}
                        height={150}
                        className="w-full h-24 object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  [<a href="#" className="text-blue-600 hover:underline">view all</a>]
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="space-y-4">

            {/* Status Section */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#FFEDD5', color: '#CC6600' }}>
                Sean&apos;s Latest Status
              </div>
              <div className="p-3 text-xs italic text-gray-700">
                Sean is pushing the limits of vibe coding
              </div>
            </div>

            {/* Latest Blog Entry / Featured Project */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#FFEDD5', color: '#CC6600' }}>
                Sean&apos;s Latest Blog Entry <span className="font-normal text-sm">[Subscribe to this Blog]</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold mb-2">{projects[0].title}</h3>
                <p className="text-sm mb-3">{projects[0].description}</p>
                <a
                  href={projects[0].link}
                  onClick={(e) => handleProjectClick(e, projects[0])}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Project →
                </a>
                <div className="text-xs text-gray-500 mt-2">
                  [<a href="#" className="text-blue-600 hover:underline">view more</a>]
                </div>
              </div>
            </div>

            {/* About Me / Blurbs */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#FFEDD5', color: '#CC6600' }}>
                About me:
              </div>
              <div className="p-4 text-sm leading-relaxed">
                <p className="mb-3">
                  I&apos;m a <strong>CRM strategist, developer, and marketer</strong> with over a decade of experience
                  delivering innovative solutions to improve marketing performance.
                </p>
                <p className="mb-3">
                  I specialize in crafting data-driven strategies, building interactive email experiences,
                  and optimizing enterprise CRM systems. With a focus on automation and AI-driven personalization,
                  I leverage technology to create scalable, high-impact marketing solutions that drive engagement and results.
                </p>
                <p>
                  Beyond my work, I enjoy <strong>vibe coding</strong> apps, agents, bots and devices as a hobby—sometimes
                  to entertain myself, sometimes to amuse my friends.
                </p>
              </div>
            </div>

            {/* Interests - Projects */}
            <div className="bg-white border-2 border-gray-400" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              <div className="px-3 py-2 font-bold border-b-2 border-gray-400" style={{ backgroundColor: '#FFEDD5', color: '#CC6600' }}>
                Sean&apos;s Interests
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="font-bold text-orange-400 mb-2">General</h4>
                  <p className="text-sm">
                    Full-stack development, CRM automation, AI integration, email marketing,
                    blockchain technology, interactive experiences, vibe coding
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-bold text-orange-400 mb-2">Projects</h4>
                  <div className="space-y-3">
                    {projects.slice(1, 6).map((project, index) => (
                      <div key={index} className="text-sm">
                        <a
                          href={project.link}
                          onClick={(e) => handleProjectClick(e, project)}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          {project.title}
                        </a>
                        <p className="text-xs text-gray-700 mt-1">{project.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-white text-center py-4 mt-8 text-xs" style={{ backgroundColor: '#6699CC' }}>
        <p>&copy; 2025 seanmun.com • <span className="cursor-pointer hover:underline" onClick={() => {
          trackModalOpen(cookieId, 'Privacy Policy');
          setIsPrivacyModalOpen(true);
          updateURL('privacy');
        }}>Privacy</span> • Designed by Sean Munley</p>
      </div>
    </div>
  );
}

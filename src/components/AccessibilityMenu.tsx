import { useState, useEffect, useRef } from 'react';
import { Settings2Icon, SunIcon, MoonIcon, FlameIcon, TypeIcon, AlignVerticalJustifyCenter, InfoIcon, XIcon } from "lucide-react";
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';
import Image from 'next/image';

export function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { settings, setSettings } = useAccessibilitySettings();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  function updateSettings(key: keyof typeof settings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed top-4 right-4 z-50" ref={menuRef}>
        <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Accessibility Settings"
        aria-expanded={isOpen}
        >
        <Settings2Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />  {/* Added text color classes */}
        </button>

        {isOpen && (
  <div 
    className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 transition-all"  // Changed from w-64 to w-80
    role="menu"
    aria-label="Accessibility options"
  >
          <h3 className="text-lg font-semibold mb-4 dark:text-white" id="accessibility-title">
            Accessibility Settings
          </h3>
          
         {/* Font Size */}
<div className="mb-4">
  <label className="flex items-center gap-2 text-sm mb-2 text-gray-700 dark:text-gray-300" id="font-size-label">
    <TypeIcon className="w-4 h-4" />
    Font Size
  </label>
  <div className="flex gap-2" role="radiogroup" aria-labelledby="font-size-label">
    {['small', 'medium', 'large'].map((size) => (
      <button
        key={size}
        onClick={() => updateSettings('fontSize', size)}
        className={`px-3 py-1 rounded transition-colors ${
          settings.fontSize === size 
            ? settings.theme === 'amber'
              ? 'bg-amber-500 text-white'
              : 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
        role="radio"
        aria-checked={settings.fontSize === size}
      >
        {size.charAt(0).toUpperCase() + size.slice(1)}
      </button>
    ))}
  </div>
</div>

{/* Line Height */}
<div className="mb-4">
  <label className="flex items-center gap-2 text-sm mb-2 text-gray-700 dark:text-gray-300" id="line-height-label">
    <AlignVerticalJustifyCenter className="w-4 h-4" />
    Line Spacing
  </label>
  <div className="flex gap-2" role="radiogroup" aria-labelledby="line-height-label">
    {['normal', 'relaxed', 'loose'].map((height) => (
      <button
        key={height}
        onClick={() => updateSettings('lineHeight', height)}
        className={`px-3 py-1 rounded transition-colors ${
          settings.lineHeight === height 
            ? settings.theme === 'amber'
              ? 'bg-amber-500 text-white'
              : 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
        role="radio"
        aria-checked={settings.lineHeight === height}
      >
        {height.charAt(0).toUpperCase() + height.slice(1)}
      </button>
    ))}
  </div>
</div>


{/* Theme Toggle */}
<div className="mb-4">
<label className="flex items-center gap-2 text-sm mb-2 text-gray-700 dark:text-gray-300" id="theme-label">
  Theme
  <button
    onClick={() => setIsInfoModalOpen(true)}
    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
    aria-label="Learn about theme modes"
  >
    <InfoIcon className="w-4 h-4" />
  </button>
</label>

{/* Info Modal for Amber Mode */}
{isInfoModalOpen && (
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
          About Amber Mode
        </h3>
        <button
          onClick={() => setIsInfoModalOpen(false)}
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
      <div className={`p-4 overflow-y-auto max-h-[70vh] md:max-h-[80vh]
        ${settings.theme === 'amber'
          ? 'bg-amber-50'
          : 'bg-white dark:bg-gray-800'
        }`}>
        <div className={`text-sm space-y-4 ${
          settings.theme === 'amber'
            ? 'text-amber-900'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          <p className="font-medium text-base">The Science Behind Amber Mode</p>
          
          <p>Amber mode significantly reduces blue light exposure from your screen. Scientific studies have demonstrated that blue light (especially in the 450-490nm range) suppresses melatonin production by up to 200% more than other light wavelengths.</p>
          
          <div className="my-6 space-y-6">
            <p className="font-medium text-base">Light Spectrum Analysis</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Blue Light Spectrum (Light Mode) */}
              <div className="space-y-2">
                <div className="relative aspect-w-16 aspect-h-9 h-40 rounded-lg overflow-hidden">
                  <Image 
                    src="/Accessibility/Light.jpg" 
                    alt="Light mode spectrum showing high blue light emission" 
                    width={300}
                    height={169}
                    className="object-cover"
                    priority
                    quality={85}
                  />
                </div>
                <p className="text-xs text-center font-medium">
                  Light Mode: High blue light emission
                </p>
              </div>
              
              {/* Dark Mode Spectrum */}
              <div className="space-y-2">
                <div className="relative aspect-w-16 aspect-h-9 h-40 rounded-lg overflow-hidden">
                  <Image 
                    src="/Accessibility/Dark.jpg" 
                    alt="Dark mode spectrum showing reduced but still present blue light" 
                    width={300}
                    height={169}
                    className="object-cover"
                    priority
                    quality={85}
                  />
                </div>
                <p className="text-xs text-center font-medium">
                  Dark Mode: Reduced but still present blue light
                </p>
              </div>
              
              {/* Amber Mode Spectrum */}
              <div className="space-y-2">
                <div className="relative aspect-w-16 aspect-h-9 h-40 rounded-lg overflow-hidden">
                  <Image 
                    src="/Accessibility/Amber.jpg" 
                    alt="Amber mode spectrum showing minimal blue light emission" 
                    width={300}
                    height={169}
                    className="object-cover"
                    priority
                    quality={85}
                  />
                </div>
                <p className="text-xs text-center font-medium">
                  Amber Mode: Minimal blue light emission
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-lg my-4">
            <p className="font-medium">Health benefits of reducing blue light exposure:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Better sleep quality and faster onset of sleep</li>
              <li>Reduced eye strain during nighttime reading</li>
              <li>Supports natural circadian rhythm maintenance</li>
              <li>May help prevent digital eye strain headaches</li>
            </ul>
          </div>
          
          <p className="font-medium">When to use Amber mode:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>1-2 hours before bedtime</li>
            <li>When working in low-light environments</li>
            <li>During extended reading or screen sessions</li>
            <li>If you experience eye fatigue or headaches from screen use</li>
          </ul>
          
          <p className="flex items-center gap-2 mt-4">
            Inspired by
            <a 
              href="https://daylightcomputer.com/" 
              target='_blank'
              rel="noopener noreferrer"
              className={`inline-flex items-center ${
                settings.theme === 'amber'
                  ? 'text-amber-700 hover:text-amber-900'
                  : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
              } transition-colors`}
            >
              Daylight Computer Co. →
            </a>
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsInfoModalOpen(false)}
            className={`px-4 py-2 rounded transition-colors ${
              settings.theme === 'amber'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
          >
            Try Amber Mode
          </button>
        </div>
      </div>
    </div>
  </div>
)}

  <div className="flex gap-2" role="radiogroup" aria-labelledby="theme-label">
    <button
      onClick={() => updateSettings('theme', 'light')}
      className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
        settings.theme === 'light' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
      role="radio"
      aria-checked={settings.theme === 'light'}
    >
      <SunIcon className="w-4 h-4" /> Light
    </button>
    <button
      onClick={() => updateSettings('theme', 'dark')}
      className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
        settings.theme === 'dark' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}
      role="radio"
      aria-checked={settings.theme === 'dark'}
    >
      <MoonIcon className="w-4 h-4" /> Dark
    </button>
    <button
  onClick={() => updateSettings('theme', 'amber')}
  className={`flex items-center gap-1 px-3 py-1 rounded transition-colors ${
    settings.theme === 'amber' 
      ? 'bg-amber-500 text-white' // Changed from bg-blue-500
      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }`}
  role="radio"
  aria-checked={settings.theme === 'amber'}
>
  <FlameIcon className="w-4 h-4" /> Amber
</button>
  </div>
</div>
        </div>
      )}
    </div>
  );
}
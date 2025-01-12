import { useState, useEffect, useRef } from 'react';
import { Settings2Icon, SunIcon, MoonIcon, FlameIcon, TypeIcon, AlignVerticalJustifyCenter, InfoIcon } from "lucide-react";
import { useAccessibilitySettings } from '../hooks/useAccessibilitySettings';

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

{/* Info Modal */}
{isInfoModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg mx-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Amber Mode Concept</h3>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
        <p>Amber mode is designed to reduce exposure to blue light, which has been shown to disrupt circadian rhythms and affect sleep quality.</p>
        <p>Scientific research indicates that blue light suppresses the production of melatonin, our sleep hormone, more than any other wavelength. By using amber tones, we can minimize this effect while maintaining readability.</p>
        <p>When to use Amber mode:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>During evening hours</li>
          <li>When working in low-light conditions</li>
          <li>To reduce eye strain during long reading sessions</li>
        </ul>
        <p>Inspired by  
            <a 
              href="https://daylightcomputer.com/" 
              target='_blank'
              rel="noopener noreferrer"
              aria-label="Visit Sean's GitHub Profile"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            > Daylight Computer Co.
            </a>
            </p>
      </div>
      <div className="mt-6 flex justify-end">
              <button
          onClick={() => setIsInfoModalOpen(false)}
          className={`px-4 py-2 ${
            settings.theme === 'amber' 
              ? 'bg-amber-600 hover:bg-amber-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white rounded`}
        >
          Got it
        </button>
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
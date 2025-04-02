// ✅ Step 1: Move the modal JSX to a shared component.
// Create this as components/modals/AmberModal.tsx

'use client';
import React from 'react';
import { XIcon } from 'lucide-react';
import Image from 'next/image';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';

interface AmberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmberModal: React.FC<AmberModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useAccessibilitySettings();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-4 md:my-8">
        <div className={`sticky top-0 rounded-t-lg flex justify-between items-center p-4 border-b ${
          settings.theme === 'amber'
            ? 'bg-amber-50 border-amber-100'
            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }`}>
          <h3 className={`text-xl font-semibold ${
            settings.theme === 'amber' ? 'text-amber-900' : 'text-gray-900 dark:text-white'
          }`}>
            About Amber Mode
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              settings.theme === 'amber'
                ? 'text-amber-600 hover:bg-amber-100'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className={`p-4 overflow-y-auto max-h-[70vh] md:max-h-[80vh] ${
          settings.theme === 'amber' ? 'bg-amber-50' : 'bg-white dark:bg-gray-800'
        }`}>
          <div className={`text-sm space-y-4 ${
            settings.theme === 'amber' ? 'text-amber-900' : 'text-gray-600 dark:text-gray-400'
          }`}>
            <p className="font-medium text-base">The Science Behind Amber Mode</p>
            <p>
              Amber mode significantly reduces blue light exposure from your screen. Scientific studies have
              demonstrated that blue light (especially in the 450-490nm range) suppresses melatonin production by up to
              200% more than other light wavelengths.
            </p>

            <div className="my-6 space-y-6">
              <p className="font-medium text-base">Light Spectrum Analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Light', 'Dark', 'Amber'].map((type) => (
                  <div key={type} className="space-y-2">
                    <div className="relative aspect-w-16 aspect-h-9 h-40 rounded-lg overflow-hidden">
                      <Image
                        src={`/Accessibility/${type}.jpg`}
                        alt={`${type} mode spectrum`}
                        width={300}
                        height={169}
                        className="object-cover"
                        priority
                        quality={85}
                      />
                    </div>
                    <p className="text-xs text-center font-medium">{type} Mode: Spectrum analysis</p>
                  </div>
                ))}
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
              <li>1–2 hours before bedtime</li>
              <li>When working in low-light environments</li>
              <li>During extended reading or screen sessions</li>
              <li>If you experience eye fatigue or headaches from screen use</li>
            </ul>

            <p className="flex items-center gap-2 mt-4">
              Inspired by{' '}
              <a
                href="https://daylightcomputer.com/"
                target="_blank"
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
              onClick={onClose}
              className={`px-4 py-2 rounded transition-colors ${
                settings.theme === 'amber'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'normal' | 'relaxed' | 'loose';
  theme: 'light' | 'dark' | 'amber';
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  lineHeight: 'normal',
  theme: 'light'
};

export function useAccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // First, check if there are stored settings
    const stored = localStorage.getItem('accessibilitySettings');
    
    if (stored) {
      // If user has previously set preferences, use those
      setSettings(JSON.parse(stored));
    } else {
      // If no stored preferences, check system preference for dark mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSettings(prev => ({
        ...prev,
        theme: prefersDark ? 'dark' : 'light'
      }));
    }
    
    // Add listener for system theme changes (only matters if no stored preference)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('accessibilitySettings')) {
        setSettings(prev => ({
          ...prev,
          theme: e.matches ? 'dark' : 'light'
        }));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    setIsInitialized(true);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      // Only store settings when they're explicitly changed by the user
      if (settings !== defaultSettings) {
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
      }
      
      // Theme classes
      document.documentElement.classList.remove('light', 'dark', 'amber');
      document.documentElement.classList.add(settings.theme);
      document.documentElement.setAttribute('data-theme', settings.theme);
      
      // Font size
      document.documentElement.style.fontSize = {
        small: '14px',
        medium: '16px',
        large: '18px'
      }[settings.fontSize];

      // Line height classes - add and remove from body
      document.body.classList.remove('line-height-normal', 'line-height-relaxed', 'line-height-loose');
      document.body.classList.add(`line-height-${settings.lineHeight}`);
    }
  }, [settings, isInitialized]);

  return { settings, setSettings, isInitialized };
}
// Theme configuration system
// This file centralizes all theme definitions for easy management and scaling

export type ThemeName = 'light' | 'dark' | 'amber' | 'myspace';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  description: string;
  category: 'mode' | 'theme'; // Modes are color schemes, Themes are layouts
  icon: string; // Lucide icon name
  colors: {
    // Background colors
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;

    // Text colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;

    // Accent colors
    accent: string;
    accentHover: string;
    accentActive: string;

    // UI elements
    border: string;
    borderHover: string;
    iconColor: string;

    // Special elements (optional)
    link?: string;
    linkHover?: string;
    success?: string;
    warning?: string;
    error?: string;
  };

  // Optional custom CSS for radical theme changes
  customCSS?: string;

  // Optional font customizations
  fonts?: {
    primary?: string;
    heading?: string;
    mono?: string;
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  light: {
    id: 'light',
    name: 'Light',
    description: 'Clean, bright theme for daytime use',
    category: 'mode',
    icon: 'Sun',
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      bgHover: '#e5e7eb',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textTertiary: '#6b7280',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentActive: '#1d4ed8',
      border: '#e5e7eb',
      borderHover: '#d1d5db',
      iconColor: '#3b82f6',
      link: '#2563eb',
      linkHover: '#1d4ed8',
    }
  },

  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes in low light',
    category: 'mode',
    icon: 'Moon',
    colors: {
      bgPrimary: '#111827',
      bgSecondary: '#1f2937',
      bgTertiary: '#374151',
      bgHover: '#4b5563',
      textPrimary: '#f9fafb',
      textSecondary: '#d1d5db',
      textTertiary: '#9ca3af',
      accent: '#3b82f6',
      accentHover: '#60a5fa',
      accentActive: '#93c5fd',
      border: '#374151',
      borderHover: '#4b5563',
      iconColor: '#60a5fa',
      link: '#60a5fa',
      linkHover: '#93c5fd',
    }
  },

  amber: {
    id: 'amber',
    name: 'Amber',
    description: 'Reduces blue light for better sleep',
    category: 'mode',
    icon: 'Flame',
    colors: {
      bgPrimary: '#fec984',
      bgSecondary: '#fddcbf',
      bgTertiary: '#FFD7B3',
      bgHover: '#ffc999',
      textPrimary: '#361900',
      textSecondary: '#482a15',
      textTertiary: '#5c3a21',
      accent: '#CC4400',
      accentHover: '#783101',
      accentActive: '#5a2501',
      border: '#ffc999',
      borderHover: '#ffb77a',
      iconColor: '#e46611',
      link: '#CC4400',
      linkHover: '#783101',
    }
  },

  myspace: {
    id: 'myspace',
    name: 'MySpace',
    description: 'Classic early 2000s social media aesthetic',
    category: 'theme',
    icon: 'Users',
    colors: {
      // MySpace classic colors
      bgPrimary: '#0066CC',      // Classic MySpace blue
      bgSecondary: '#6699CC',    // Lighter blue for content areas
      bgTertiary: '#FFFFFF',     // White content boxes
      bgHover: '#5588BB',        // Hover state
      textPrimary: '#000000',    // Black text on white
      textSecondary: '#333333',  // Dark gray
      textTertiary: '#666666',   // Medium gray
      accent: '#FF6600',         // MySpace orange
      accentHover: '#FF8833',    // Lighter orange
      accentActive: '#CC5500',   // Darker orange
      border: '#CCCCCC',         // Light gray borders
      borderHover: '#999999',    // Darker borders on hover
      iconColor: '#FF6600',      // Orange icons
      link: '#0066CC',           // Blue links
      linkHover: '#003366',      // Dark blue on hover
    },
    fonts: {
      primary: 'Verdana, Geneva, sans-serif',
      heading: 'Arial, Helvetica, sans-serif',
    },
    customCSS: `
      /* MySpace-specific styles */
      [data-theme='myspace'] body {
        font-family: Verdana, Geneva, sans-serif !important;
      }

      [data-theme='myspace'] h1,
      [data-theme='myspace'] h2,
      [data-theme='myspace'] h3 {
        font-family: Arial, Helvetica, sans-serif !important;
        font-weight: bold;
      }

      /* Table-like layout borders */
      [data-theme='myspace'] .project-card {
        border: 2px solid #CCCCCC;
        box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      }

      /* Classic gradient header */
      [data-theme='myspace'] .header-section {
        background: linear-gradient(to bottom, #0066CC, #003366);
      }

      /* Blink-style animations for links (optional) */
      [data-theme='myspace'] .blink-text {
        animation: blink 1.5s infinite;
      }

      @keyframes blink {
        0%, 50%, 100% { opacity: 1; }
        25%, 75% { opacity: 0.5; }
      }
    `
  }
};

// Helper function to get theme by ID
export function getTheme(id: ThemeName): ThemeConfig {
  return themes[id];
}

// Get all available themes as array
export function getAllThemes(): ThemeConfig[] {
  return Object.values(themes);
}

// Type guard for theme names
export function isValidTheme(value: string): value is ThemeName {
  return value in themes;
}

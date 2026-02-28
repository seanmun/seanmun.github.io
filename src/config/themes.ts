// Theme configuration system
// This file centralizes all theme definitions for easy management and scaling

export type ThemeName = 'light' | 'dark' | 'amber' | 'default' | 'myspace' | 'windows98' | 'ecosystem';

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

  default: {
    id: 'default',
    name: 'Default',
    description: 'Professional portfolio layout',
    category: 'theme',
    icon: 'Layout',
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

  myspace: {
    id: 'myspace',
    name: 'MySpace',
    description: 'Classic early 2000s social media aesthetic',
    category: 'theme',
    icon: 'Users',
    colors: {
      // Minimal colors - MySpaceLayout handles its own styling
      bgPrimary: '#ffffff',
      bgSecondary: '#ffffff',
      bgTertiary: '#ffffff',
      bgHover: '#f5f5f5',
      textPrimary: '#000000',
      textSecondary: '#333333',
      textTertiary: '#666666',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentActive: '#1d4ed8',
      border: '#e5e7eb',
      borderHover: '#d1d5db',
      iconColor: '#3b82f6',
      link: '#2563eb',
      linkHover: '#1d4ed8',
    },
    fonts: {
      primary: 'Verdana, Geneva, sans-serif',
      heading: 'Arial, Helvetica, sans-serif',
    }
  },

  windows98: {
    id: 'windows98',
    name: 'Windows 98',
    description: 'Nostalgic Windows 98 desktop experience',
    category: 'theme',
    icon: 'Box',
    colors: {
      bgPrimary: '#008080',
      bgSecondary: '#c0c0c0',
      bgTertiary: '#ffffff',
      bgHover: '#d4d0c8',
      textPrimary: '#000000',
      textSecondary: '#000000',
      textTertiary: '#808080',
      accent: '#000080',
      accentHover: '#0000a0',
      accentActive: '#000060',
      border: '#808080',
      borderHover: '#000000',
      iconColor: '#000080',
      link: '#0000ff',
      linkHover: '#ff00ff',
    },
    fonts: {
      primary: 'Tahoma, "MS Sans Serif", Arial, sans-serif',
      heading: 'Tahoma, Arial, sans-serif',
    }
  },

  ecosystem: {
    id: 'ecosystem',
    name: 'Ecosystem',
    description: '3D project connections graph',
    category: 'theme',
    icon: 'Network',
    colors: {
      bgPrimary: '#050a18',
      bgSecondary: '#0f172a',
      bgTertiary: '#1e293b',
      bgHover: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textTertiary: '#64748b',
      accent: '#3b82f6',
      accentHover: '#60a5fa',
      accentActive: '#93c5fd',
      border: '#1e293b',
      borderHover: '#334155',
      iconColor: '#60a5fa',
      link: '#60a5fa',
      linkHover: '#93c5fd',
    }
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

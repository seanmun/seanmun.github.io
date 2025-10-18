# Theme System Guide

This guide explains how to add new themes to the website.

## Architecture Overview

The theme system uses:
- **Centralized configuration** in `/src/config/themes.ts`
- **CSS custom properties** in `/src/app/globals.css`
- **Type-safe TypeScript** definitions
- **Automatic UI updates** via the AccessibilityMenu

## Adding a New Theme

### Step 1: Update the Theme Configuration

Edit `/src/config/themes.ts`:

```typescript
// 1. Add your theme name to the ThemeName type
export type ThemeName = 'light' | 'dark' | 'amber' | 'myspace' | 'YOUR_THEME';

// 2. Add your theme to the themes object
export const themes: Record<ThemeName, ThemeConfig> = {
  // ... existing themes

  your_theme: {
    id: 'your_theme',
    name: 'Your Theme Name',
    description: 'Brief description shown on hover',
    icon: 'IconName', // Lucide icon name (must be imported in AccessibilityMenu)
    colors: {
      // Required colors
      bgPrimary: '#000000',      // Main background
      bgSecondary: '#111111',    // Card/section backgrounds
      bgTertiary: '#222222',     // Tertiary elements
      bgHover: '#333333',        // Hover states
      textPrimary: '#ffffff',    // Main text
      textSecondary: '#cccccc',  // Secondary text
      textTertiary: '#999999',   // Tertiary text
      accent: '#ff0000',         // Primary accent (buttons, etc)
      accentHover: '#cc0000',    // Accent hover state
      accentActive: '#aa0000',   // Accent active state
      border: '#444444',         // Border color
      borderHover: '#555555',    // Border hover
      iconColor: '#ff0000',      // Icon color
      link: '#0000ff',           // Link color
      linkHover: '#0000cc',      // Link hover
    },

    // Optional: Custom fonts
    fonts: {
      primary: 'Your Font, fallback, sans-serif',
      heading: 'Your Heading Font, fallback, sans-serif',
    },

    // Optional: Custom CSS for radical changes
    customCSS: `
      [data-theme='your_theme'] .special-element {
        /* Custom styles */
      }
    `
  }
};
```

### Step 2: Add CSS Variables

Edit `/src/app/globals.css`:

```css
/* Your Theme */
[data-theme='your_theme'] {
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --bg-tertiary: #222222;
  --bg-hover: #333333;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-tertiary: #999999;
  --accent: #ff0000;
  --accent-hover: #cc0000;
  --accent-active: #aa0000;
  --border: #444444;
  --border-hover: #555555;
  --icon-color: #ff0000;
  --link-color: #0000ff;
  --link-hover: #0000cc;
}
```

### Step 3: Add Theme-Specific Styles (Optional)

If your theme needs radical changes, add them to `/src/app/globals.css`:

```css
/* Your Theme Specifics */
[data-theme='your_theme'] body {
  font-family: 'Your Font', sans-serif !important;
}

[data-theme='your_theme'] .rounded-lg {
  border-radius: 20px !important; /* Override default rounding */
}

[data-theme='your_theme'] h1 {
  text-transform: uppercase;
  letter-spacing: 2px;
}
```

### Step 4: Update useAccessibilitySettings Hook

Edit `/src/hooks/useAccessibilitySettings.ts`:

```typescript
// Add your theme to the classList.remove() call
document.documentElement.classList.remove('light', 'dark', 'amber', 'myspace', 'your_theme');
```

### Step 5: Add Icon to AccessibilityMenu (If New)

Edit `/src/components/AccessibilityMenu.tsx`:

```typescript
// 1. Import the icon
import {
  Settings2Icon, SunIcon, MoonIcon, FlameIcon, UsersIcon,
  YourIcon // Add your icon here
} from "lucide-react";

// 2. Add to icon mapping
const themeIcons = {
  Sun: SunIcon,
  Moon: MoonIcon,
  Flame: FlameIcon,
  Users: UsersIcon,
  YourIconName: YourIcon, // Map icon name to component
};
```

### Step 6: Test Your Theme

1. Start the development server: `npm run dev`
2. Open the accessibility menu (gear icon)
3. Select your new theme
4. Verify all colors, fonts, and styles look correct
5. Test on mobile devices

## Theme Examples

### Minimalist Theme
```typescript
minimalist: {
  id: 'minimalist',
  name: 'Minimalist',
  description: 'Clean, minimal black and white',
  icon: 'Minimize2',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#fafafa',
    bgTertiary: '#f5f5f5',
    bgHover: '#eeeeee',
    textPrimary: '#000000',
    textSecondary: '#333333',
    textTertiary: '#666666',
    accent: '#000000',
    accentHover: '#333333',
    accentActive: '#555555',
    border: '#dddddd',
    borderHover: '#cccccc',
    iconColor: '#000000',
    link: '#000000',
    linkHover: '#555555',
  }
}
```

### Retro Terminal Theme
```typescript
terminal: {
  id: 'terminal',
  name: 'Terminal',
  description: 'Classic green terminal aesthetic',
  icon: 'Terminal',
  colors: {
    bgPrimary: '#000000',
    bgSecondary: '#001100',
    bgTertiary: '#002200',
    bgHover: '#003300',
    textPrimary: '#00ff00',
    textSecondary: '#00cc00',
    textTertiary: '#009900',
    accent: '#00ff00',
    accentHover: '#00cc00',
    accentActive: '#009900',
    border: '#00ff00',
    borderHover: '#00cc00',
    iconColor: '#00ff00',
    link: '#00ff00',
    linkHover: '#00cc00',
  },
  fonts: {
    primary: 'Courier New, monospace',
    heading: 'Courier New, monospace',
  }
}
```

## CSS Variables Reference

All themes have access to these CSS variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `--bg-primary` | Main page background | `#ffffff` |
| `--bg-secondary` | Cards, sections | `#f9fafb` |
| `--bg-tertiary` | Tech tags, tertiary elements | `#f3f4f6` |
| `--bg-hover` | Hover states | `#e5e7eb` |
| `--text-primary` | Main text | `#111827` |
| `--text-secondary` | Secondary text | `#4b5563` |
| `--text-tertiary` | Tertiary text | `#6b7280` |
| `--accent` | Primary buttons, accents | `#3b82f6` |
| `--accent-hover` | Accent hover | `#2563eb` |
| `--accent-active` | Accent active/pressed | `#1d4ed8` |
| `--border` | Border color | `#e5e7eb` |
| `--border-hover` | Border hover | `#d1d5db` |
| `--icon-color` | Icon color | `#3b82f6` |
| `--link-color` | Link color | `#2563eb` |
| `--link-hover` | Link hover | `#1d4ed8` |

## Tips for Creating Themes

1. **Start with colors**: Pick your color palette first
2. **Ensure contrast**: Use a contrast checker for accessibility
3. **Test thoroughly**: Check all UI elements in your theme
4. **Consider fonts**: Custom fonts can dramatically change the feel
5. **Use customCSS sparingly**: Only for truly unique styling needs
6. **Mobile testing**: Always test on mobile devices

## Troubleshooting

### Theme not appearing in menu
- Check that you've added it to the `ThemeName` type
- Verify the icon is imported in `AccessibilityMenu.tsx`
- Ensure the theme object is in the `themes` record

### Colors not applying
- Confirm CSS variables are defined in `globals.css`
- Check browser DevTools for CSS variable values
- Verify the `data-theme` attribute is set correctly

### Theme persists after switching
- Clear localStorage: `localStorage.removeItem('accessibilitySettings')`
- Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)

## Future Enhancements

Potential improvements to the theme system:
- [ ] Theme preview images
- [ ] User-customizable themes
- [ ] Theme import/export
- [ ] Time-based automatic theme switching
- [ ] Per-component theme overrides

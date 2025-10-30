# Project Modal System Guide

## Overview

This guide explains how to use the new unified project modal system to create consistent, theme-aware project detail modals.

## Quick Start

To add a modal for any project, simply add the `modalContent` property to your project in `src/data/projects.ts`:

```typescript
{
  title: "Your Project",
  description: "Short description for the card",
  // ... other required fields
  isLive: false, // Set to false to show modal instead of linking directly
  modalContent: {
    overview: "Detailed overview of your project...",
    images: [
      {
        src: "/projects/your-image.jpg",
        alt: "Description of image",
        caption: "Optional caption for the image"
      }
    ],
    keyFeatures: [
      "Feature 1",
      "Feature 2"
    ],
    technicalDetails: "Technical stack and implementation details...",
    plannedFeatures: ["Future feature 1", "Future feature 2"],
    callToAction: {
      primary: { label: "View on GitHub", url: "https://github.com/..." },
      secondary: { label: "Get in touch", url: "mailto:..." }
    },
    specialSections: [
      {
        title: "Special Section Title",
        content: "Content for this highlighted section",
        image: { src: "/path/to/image.jpg", alt: "Alt text" },
        highlightColor: "green" // Options: green, blue, amber, purple
      }
    ]
  }
}
```

## Key Features

### 1. **Automatic Theme Support**
The modal automatically adapts to all themes (light, dark, amber, myspace) with proper color schemes and styling.

### 2. **Image Carousel**
- Supports multiple images with automatic carousel
- Navigation arrows and dot indicators
- Optional captions for each image
- Graceful error handling if images fail to load

### 3. **Flexible Content Sections**
All sections are optional:
- `overview` - Main project description
- `images` - Array of project images
- `keyFeatures` - Bulleted list of features
- `technicalDetails` - Technical stack description
- `plannedFeatures` - Future roadmap items
- `specialSections` - Highlighted content boxes with custom colors

### 4. **Call-to-Action Buttons**
- Primary and secondary CTA buttons
- Displayed at top and bottom of modal for easy access
- Automatic icon selection (GitHub, email, etc.)

### 5. **isLive Flag**
Use the `isLive: false` flag for projects that aren't ready to link directly:
- Shows modal instead of opening link
- If no `modalContent` is provided, uses project description as fallback
- Great for MVP/Dev projects

## Examples

### Minimal Modal (Using Default Content)
```typescript
{
  title: "Simple Project",
  description: "This will be used as modal content",
  isLive: false, // Shows modal with description
  link: "https://github.com/yourrepo",
  // No modalContent needed - uses description + link
}
```

### Full-Featured Modal
```typescript
{
  title: "OrdinalFrame",
  isLive: false,
  modalContent: {
    images: [
      { src: "/projects/img1.jpg", alt: "Image 1", caption: "Caption 1" },
      { src: "/projects/img2.jpg", alt: "Image 2", caption: "Caption 2" }
    ],
    overview: "Full project overview...",
    keyFeatures: ["Feature 1", "Feature 2", "Feature 3"],
    technicalDetails: "Built with X, Y, Z...",
    plannedFeatures: ["Future 1", "Future 2"],
    callToAction: {
      primary: { label: "View on GitHub", url: "https://..." },
      secondary: { label: "Contact", url: "mailto:..." }
    },
    specialSections: [
      {
        title: "✅ Founder Approved",
        content: "Special recognition or awards",
        image: { src: "/projects/award.jpg", alt: "Award" },
        highlightColor: "green"
      }
    ]
  }
}
```

## Theme Colors

### Highlight Colors
Available highlight colors for `specialSections`:
- `green` - Success, approval, achievements
- `blue` - Information, technical details
- `amber` - Warnings, important notes
- `purple` - Creative, premium features

### Automatic Theme Adaptation
The modal automatically adjusts for each theme:
- **Light Theme**: Clean white background with gray accents
- **Dark Theme**: Dark backgrounds with light text
- **Amber Theme**: Warm amber tones throughout
- **MySpace Theme**: Retro styling maintained

## Migration Path

### Current System
Projects can use either:
1. **Old custom modals** - `triggerOrdinalFrameModal`, `triggerHinkieBotModal`, etc.
2. **New unified modal** - `modalContent` property
3. **Direct links** - No modal, opens in new tab

### Recommended Approach
1. For new projects: Use `modalContent` from the start
2. For existing projects: Gradually migrate to `modalContent`
3. Legacy modals still work but should be phased out

## File Structure

```
src/
├── data/
│   └── projects.ts           # Project data with modalContent
├── components/
│   └── modals/
│       ├── ProjectModal.tsx  # Unified modal component
│       ├── OrdinalFrameModal.tsx  # Legacy (will migrate)
│       └── HinkieBotModal.tsx     # Legacy (will migrate)
└── components/
    └── personal-website.tsx  # Handles modal triggering
```

## Best Practices

1. **Images**: Keep images optimized (< 500KB each)
2. **Descriptions**: Keep overview concise (2-3 paragraphs max)
3. **Features**: Use 3-6 key features for readability
4. **CTAs**: Always include at least one CTA button
5. **Special Sections**: Use sparingly (1-2 per modal)

## Troubleshooting

### Modal not showing?
- Check that `modalContent` is defined OR `isLive: false` is set
- Verify project data structure matches interface

### Images not loading?
- Check image paths are correct (relative to `public/`)
- Images fail gracefully - modal still displays

### Theme colors wrong?
- ProjectModal automatically detects theme
- No manual theme configuration needed

## Future Enhancements

Planned improvements:
- [ ] Video support in carousel
- [ ] Embed support (YouTube, etc.)
- [ ] Interactive demos/previews
- [ ] Social sharing buttons
- [ ] Analytics tracking per modal

# Project Page Guide

Every project in `src/data/projects.ts` gets a card on the home page and a
feature page at `/projects/<slug>`. The sitemap and each page's Open Graph
card are generated from the same entry, so adding a project is one edit.

## The card

| Field | What it does |
| --- | --- |
| `title`, `slug`, `description`, `iconName` | Card text, URL, and a lucide icon name |
| `status` | `Dev`, `MVP` or `Prod` badge |
| `techStack` | Chips on the card and the page header |
| `link` | Where the primary button goes when there's no `callToAction` |
| `repos` | github.com/seanmun repos whose commits count toward the project's stats |
| `showGitStats: false` | Hides the commit line (still counts toward site totals) |
| `comingSoonApps` | `['ios', 'android']` adds "Coming soon" store badges |

Renaming a slug? Add a permanent redirect for the old one in `next.config.ts`.

## The page: `modalContent`

```ts
modalContent: {
  heroMedia: { type: 'image', src: '/media/<slug>/hero.jpg', width: 1600, height: 1000, alt: '...' },
  overview: 'One paragraph, shown under the hero.',
  detailSections: [
    {
      heading: 'Section title',
      body: 'Opening paragraph.',
      media: [/* shown after the opening paragraph */],
      bullets: ['...'],
      footer: 'Closing paragraph after the bullets.',
    },
  ],
  technicalDetails: 'Shown as "Technical Stack".',
  callToAction: {
    primary: { label: 'Visit the site', url: 'https://...' },
    secondary: { label: 'Work with me', url: '/#work-with-me' },
  },
}
```

Also available: `roster` (a card per bot, used by Agent Army), `images` (a
carousel), `keyFeatures`, `plannedFeatures` and `specialSections`.

## Media

`media` entries are `ProjectMedia`:

- `type: 'image'` — set `width` and `height` so the layout doesn't jump.
- `type: 'video'` — a silent loop that plays only while on screen. Give it a
  `poster`, and optionally `srcMobile` / `posterMobile` for a vertical cut.
- `type: 'diagram'` — an interactive component, picked by `diagram`.

Two or more media in one section sit side by side on desktop.

Keep files in `public/media/<slug>/`: JPEG around 1600px wide, H.264 MP4 with
`+faststart` and no audio, ideally under 1.5 MB each.

## Before publishing

The repo and the site are public. Never put client data on a page: real
partner names, contacts, deal amounts, private links or anyone's phone and
email. Render screenshots with sample data instead (see the comment above the
Rocket Pool Tour entry).

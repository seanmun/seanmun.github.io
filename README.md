# Sean Munley Portfolio

A modern, accessible personal portfolio website built with Next.js, React, and Tailwind CSS.

## Features

- 🌓 Light/Dark/Amber theme modes
- ♿ Comprehensive accessibility controls
    - Adjustable font sizes
    - Line height customization
    - Theme preferences
- 📱 Fully responsive design
- 🖼️ Dynamic image gallery
- 🎵 Spotify integration
- 🔒 Password-protected content
- 🛠️ Maintenance mode feature
- 📊 Server-side visitor analytics with a private dashboard at /dashboard
- 📈 Live GitHub commit stats on the project cards

## Environment variables

| Variable | Used for |
| --- | --- |
| `GITHUB_TOKEN` | Read-only token for the commit stats on project cards |
| `DASHBOARD_PASSWORD` | Server-checked password for /dashboard (never `NEXT_PUBLIC`) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Admin SDK credentials for reading and writing analytics |
| `RESEND_API_KEY` | Contact form delivery |

Firestore rules are checked in at `firestore.rules` — all client access is denied,
since the browser never talks to the database directly.

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 18
- TypeScript
- Tailwind CSS
- Recharts (analytics dashboard)
- Firebase Admin (server-side analytics storage)
- Resend (contact form delivery)
- Lucide Icons

## Local Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


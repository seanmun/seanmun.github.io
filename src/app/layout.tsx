import type { Metadata } from 'next'
import './globals.css'
import { ClickTracker } from '@/components/ClickTracker'

export const metadata: Metadata = {
  title: 'Sean Munley | Product Builder & AI Consultant',
  description: 'I turn wild ideas into working products — sites, apps, AI systems, and devices. A decade of enterprise CRM and martech expertise, available for consulting and builds.',
  metadataBase: new URL('https://seanmun.com'),
  openGraph: {
    title: 'Sean Munley | Product Builder & AI Consultant',
    description: 'I turn wild ideas into working products — sites, apps, AI systems, and devices. Available for consulting and builds.',
    url: 'https://seanmun.com',
    siteName: 'Sean Munley',
    locale: 'en-US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sean Munley | Product Builder & AI Consultant',
    description: 'I turn wild ideas into working products — sites, apps, AI systems, and devices.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  keywords: ['AI Consulting', 'Product Development', 'MVP Development', 'AI Integration', 'RAG Systems', 'CRM Strategy', 'Digital Marketing', 'Marketing Automation', 'Email Marketing', 'Marketing Technology', 'DevOps', 'Data Management', 'Performance Optimization', 'Kinetic Email', 'AMP4Email', 'SFMC', 'Salesforce Marketing Cloud',
    'Salesforce Trailblazer', 'Eloqua', 'Iterable', 'Sean Munley', '@Seanmun', "Email AI"
  ],
  authors: [{ name: 'Sean Munley' }],
  creator: 'Sean Munley',
  publisher: 'Sean Munley',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Runs before first paint so the page starts in the visitor's
              // theme instead of flashing light first. Mirrors
              // useAccessibilitySettings exactly — same storage key, same
              // dark-device default, same font sizes.
              (function() {
                var root = document.documentElement;
                var theme = 'default';
                var fontSize = null;
                try {
                  var stored = localStorage.getItem('accessibilitySettings');
                  if (stored) {
                    var settings = JSON.parse(stored);
                    theme = settings.theme || 'default';
                    fontSize = settings.fontSize || null;
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    theme = 'dark';
                  }
                  // MySpace, Windows 98 and Ecosystem are pages as much as
                  // themes: they only apply on their own route
                  var pageThemes = { myspace: '/myspace', windows98: '/windows98', ecosystem: '/ecosystem' };
                  if (pageThemes[theme] && location.pathname !== pageThemes[theme]) theme = 'default';
                } catch (e) {
                  theme = 'default';
                }
                root.classList.add(theme);
                root.setAttribute('data-theme', theme);
                if (fontSize) root.style.fontSize = { small: '15px', medium: '16px', large: '19px' }[fontSize] || '';
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ClickTracker />
      </body>
    </html>
  )
}
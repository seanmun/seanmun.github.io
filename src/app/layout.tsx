import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sean Munley | CRM Strategist',
  description: 'Digital marketing strategist and developer, specializing in CRM and marketing performance optimization through improvements to devops, data management, testing, and reporting insights.',
  metadataBase: new URL('https://seanmun.com'),
  openGraph: {
    title: 'Sean Munley | CRM Strategist',
    description: 'Digital marketing strategist and developer, specializing in CRM and marketing performance optimization',
    url: 'https://seanmun.com',
    siteName: 'Sean Munley',
    images: [
      {
        url: '/profile/smunley2019.png',
        width: 800,
        height: 600,
        alt: 'Sean Munley',
      },
    ],
    locale: 'en-US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sean Munley | CRM Strategist',
    description: 'Digital marketing strategist and developer',
    images: ['/profile/smunley2019.png'],
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
  keywords: ['CRM Strategy', 'Digital Marketing', 'Marketing Automation', 'Email Marketing', 'Marketing Technology', 'DevOps', 'Data Management', 'Performance Optimization', 'Kinetic Email', 'AMP4Email', 'SFMC', 'Salesforce Marketing Cloud', 
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
              (function() {
                try {
                  const stored = localStorage.getItem('accessibility-settings');
                  if (stored) {
                    const settings = JSON.parse(stored);
                    const theme = settings.theme || 'default';

                    // Apply theme class
                    document.documentElement.classList.add(theme);

                    // Apply data-theme attribute
                    document.documentElement.setAttribute('data-theme', theme);

                    // Apply font size
                    if (settings.fontSize) {
                      document.documentElement.classList.add('text-' + settings.fontSize);
                    }

                    // Apply line height
                    if (settings.lineHeight) {
                      document.documentElement.classList.add('leading-' + settings.lineHeight);
                    }
                  } else {
                    // Default theme
                    document.documentElement.classList.add('default');
                    document.documentElement.setAttribute('data-theme', 'default');
                  }
                } catch (e) {
                  // Fallback to default
                  document.documentElement.classList.add('default');
                  document.documentElement.setAttribute('data-theme', 'default');
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
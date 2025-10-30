// File: src/data/projects.ts
// Purpose: Project data with status and tech stack information

// Type definitions for project structure
export interface ProjectImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface ProjectCallToAction {
  primary?: { label: string; url: string };
  secondary?: { label: string; url: string };
}

export interface ProjectModalContent {
  images?: ProjectImage[];
  overview?: string;
  keyFeatures?: string[];
  technicalDetails?: string;
  plannedFeatures?: string[];
  callToAction?: ProjectCallToAction;
  specialSections?: {
    title: string;
    content: string;
    image?: ProjectImage;
    highlightColor?: 'green' | 'blue' | 'amber' | 'purple';
  }[];
}

export interface Project {
  title: string;
  description: string;
  iconName: string;
  link: string;
  ariaLabel: string;
  requiresPassword: boolean;
  status: 'Dev' | 'MVP' | 'Prod';
  techStack: string[];
  isLive?: boolean; // If false, show modal instead of linking directly
  triggerAmberModal?: boolean;
  triggerOrdinalFrameModal?: boolean;
  triggerHinkieBotModal?: boolean;
  modalContent?: ProjectModalContent;
}

export const projects: Project[] = [
  {
    title: "Kinetic.email",
    description: "An open source resource hub and showcase for interactive kinetic HTML emails that push the boundaries of traditional email design. Features an AI Playground powered by Claude API where users can prompt a specialized AI to generate custom kinetic email modules. The site serves as both an educational tool for email developers and an innovation playground with real-world examples and cutting-edge concepts.",
    iconName: "Zap",
    link: "https://www.kinetic.email/",
    ariaLabel: "View Kinetic.email website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["Claude API", "React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS", "Vercel"]
  },
  {
    title: "Money Never Sleeps",
    description: "A sophisticated fantasy basketball dynasty league platform that brings real NBA salary cap management to fantasy sports. Navigate actual NBA cap rules with apron thresholds, manage keeper contracts with advancing rounds, and make strategic financial decisions with real monetary consequences. Track live blockchain investments where penalties and fees fuel a prize pool—sweat your matchups and your portfolio, because money never sleeps.",
    iconName: "DollarSign",
    link: "https://mns-dusky.vercel.app/",
    ariaLabel: "View Money Never Sleeps website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Firebase", "Tailwind CSS", "Alchemy API", "Telegram API", "Vercel"],
    modalContent: {
      images: [
        {
          src: "/projects/mns-home.png",
          alt: "Money Never Sleeps home screen",
          caption: "Home screen login state showing main platform components"
        },
        {
          src: "/projects/mns-prize.png",
          alt: "Prize pool with blockchain stats",
          caption: "Live prize pool with real-time stats from Ethereum blockchain"
        },
        {
          src: "/projects/mns-teamPage.png",
          alt: "Team page overview",
          caption: "Team page showing total salary, fees, players and watch list"
        },
        {
          src: "/projects/mns-draft.png",
          alt: "Live draft tool",
          caption: "Interactive live draft tool for league draft day"
        },
        {
          src: "/projects/mns-freeAgents.png",
          alt: "Free agent tool",
          caption: "Free agent acquisition tool complementing the draft system"
        },
        {
          src: "/projects/mns-inbox.png",
          alt: "Daily Sam Hinkie quotes inbox",
          caption: "Daily Sam Hinkie inspired quotes - future home for trades and wagers"
        },
        {
          src: "/projects/mns-rules.png",
          alt: "League rules reference",
          caption: "Comprehensive league rules for members navigating complex regulations"
        }
      ],
      overview: "Money Never Sleeps is a cutting-edge fantasy basketball dynasty league platform that merges real NBA salary cap mechanics with blockchain-backed financial consequences. League members navigate authentic cap rules, manage multi-year keeper contracts, and make strategic decisions that affect both their fantasy roster and real-world prize pool funded by blockchain investments.",
      keyFeatures: [
        "Real NBA salary cap rules with apron thresholds and luxury tax calculations",
        "Multi-year keeper contracts with advancing draft round costs",
        "Live blockchain investment tracking via Alchemy API",
        "Automated penalty and fee collection that fuels the prize pool",
        "Real-time league standings and matchup tracking",
        "Telegram bot integration for notifications and updates",
        "Financial dashboard showing both fantasy performance and portfolio value",
        "Dynasty league management with long-term roster building strategy"
      ],
      technicalDetails: "Built with Next.js and TypeScript for type-safe development. Firebase powers real-time database syncing for league data and matchup tracking. Alchemy API provides blockchain integration for tracking cryptocurrency investments that fund the prize pool. Telegram API delivers instant notifications for league events, trades, and financial updates. Deployed on Vercel for optimal performance and global CDN distribution.",
      plannedFeatures: [
        "Advanced analytics dashboard with historical cap space trends",
        "Trade analyzer with cap implications calculator",
        "Mock draft simulator with keeper contract integration",
        "Mobile app for iOS and Android",
        "Multi-league support for commissioners managing multiple leagues",
        "Integration with additional blockchain networks for diverse investment options"
      ],
      callToAction: {
        primary: {
          label: "View Live Site",
          url: "https://mns-dusky.vercel.app/"
        },
        secondary: {
          label: "Get in touch",
          url: "mailto:sean.munley@protonmail.com"
        }
      }
    }
  },
  {
    title: "Amber Mode",
    description: "Amber Mode is a custom screen theme designed to reduce blue light exposure and support healthy circadian rhythms. By shifting to warm amber tones, it minimizes melatonin disruption during evening use while maintaining readability and visual comfort. Try it yourself using the accessibility settings menu above!",
    iconName: "Sun",
    link: "",
    ariaLabel: "Amber Mode modal",
    requiresPassword: false,
    triggerAmberModal: true,
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Tailwind CSS"]
  },
  {
    title: "TrustThePick.com",
    description: "Trust The Pick is a secure NBA-style lottery simulator for fantasy sports leagues that uses a multi-verification system to ensure fairness and transparency. It recreates the excitement of the official NBA draft lottery with animated ball drawings, while giving league commissioners confidence through downloadable combination assignments and verifiable results.",
    iconName: "Key",
    link: "https://trustthepick.com/",
    ariaLabel: "View Trust The Pick website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"]
  },
  {
    title: "DraftDayTrades.com",
    description: "Draft Day Trades lets sports fans create confidence-based draft prediction pools for NFL, NBA, WNBA, NHL, and MLB drafts. Users predict which players will be drafted at each position and assign strategic confidence points to their picks. The platform features real-time leaderboards and scoring during draft night, creating a competitive experience for friends to enjoy together.",
    iconName: "Trophy",
    link: "https://draftdaytrades.com/",
    ariaLabel: "View Draft Day Trades website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Firebase", "Tailwind CSS", "Vercel"]
  },
  {
    title: "OrdinalFrame",
    description: "Bitcoin Ordinals deserve better than a browser tab. OrdinalFrame turns a Raspberry Pi and Waveshare touchscreen into a living art display that showcases your Ordinals directly from the blockchain. The custom hardware pulls inscriptions in real-time with no screenshots or compromises, all wrapped in a custom gold frame.",
    iconName: "Box",
    link: "https://github.com/seanmun/ordinalframe",
    ariaLabel: "View Ordinal Frame project details",
    requiresPassword: false,
    isLive: false, // Not publicly launched yet - show modal
    status: "MVP",
    techStack: ["Python", "React", "Raspberry Pi", "JavaScript"],
    modalContent: {
      images: [
        {
          src: "/projects/ordinalframe-display.jpg",
          alt: "OrdinalFrame displaying Bitcoin Ordinals",
          caption: "OrdinalFrame in action, showcasing Bitcoin Ordinals"
        },
        {
          src: "/projects/ordinalframe-setup.jpg",
          alt: "OrdinalFrame hardware setup",
          caption: "The complete hardware setup with Raspberry Pi"
        },
        {
          src: "/projects/ordinalframe-back.jpg",
          alt: "OrdinalFrame back panel",
          caption: "Custom frame housing and back panel design"
        }
      ],
      overview: "OrdinalFrame transforms a Raspberry Pi into a dynamic digital art frame that showcases Bitcoin Ordinals - unique digital artifacts inscribed directly onto the Bitcoin blockchain. This project bridges the gap between blockchain technology and physical art display.",
      keyFeatures: [
        "Automatic rotation through Bitcoin Ordinal collections",
        "Raspberry Pi-powered with high-resolution display",
        "Real-time fetching of Ordinals from the Bitcoin blockchain",
        "Support for various Ordinal formats (images, text, inscriptions)",
        "Remote configuration and collection management",
        "Energy-efficient operation for continuous display"
      ],
      technicalDetails: "Built on Raspberry Pi hardware with Python scripts for blockchain integration. Uses Bitcoin blockchain and Ordinals indexers APIs with a custom rendering engine for various media types. Features local caching with automatic updates for optimal performance.",
      plannedFeatures: [
        "Bitcoin message signature verification to authenticate ownership of displayed Ordinals",
        "Multi-wallet support to display Ordinals from multiple Bitcoin wallets",
        "Collection-based selection to curate and cycle through specific Ordinal collections",
        "Advanced display modes with slideshow timing, transitions, and viewing preferences",
        "Custom frame design - physical frame design has been commissioned for a polished presentation",
        "3D blueprint creation for complete DIY blueprint for 3D printing the frame enclosure"
      ],
      callToAction: {
        primary: {
          label: "View on GitHub",
          url: "https://github.com/seanmun/ordinalframe"
        },
        secondary: {
          label: "Get in touch",
          url: "mailto:sean.munley@protonmail.com"
        }
      },
      specialSections: [
        {
          title: "✅ Founder Approved",
          content: "Udi Wertheimer is the co-founder of Taproot Wizards and Quantum Cats—Bitcoin Ordinals projects that blend art, community, and a push for OP_CAT activation to expand Bitcoin's capabilities.",
          image: {
            src: "/projects/udi.jpg",
            alt: "Quantum Cats founder tweet approval"
          },
          highlightColor: "green"
        }
      ]
    }
  },
  {
    title: "RumbleRaffle.com",
    description: "RumbleRaffle.com lets friends create Royal Rumble gaming leagues with randomly assigned entrant numbers and real-time elimination tracking. Features automated number distribution and a live event tracker for an authentic WWE Royal Rumble experience where the last man standing wins.",
    iconName: "Medal",
    link: "https://www.rumbleraffle.com/",
    ariaLabel: "View Rumble Raffle website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "Typescript", "Next.js", "Express.js", "PostgreSQL", "Node.js", "Vercel"]
  },
  {
    title: "Human-Diet.com",
    description: "Explore 300,000 years of human dietary evolution through an interactive horizontal scroll where each pixel represents one year, showcasing the transition from natural diets to modern preservative-laden and seed oil-rich foods.",
    iconName: "Beef",
    link: "https://www.human-diet.com/",
    ariaLabel: "View 1 pixel health project page",
    requiresPassword: false,
    status: "Prod",
    techStack: ["HTML/CSS", "JavaScript", "Vercel"]
  },
  {
    title: "Fantasy League Bot",
    description: "The @Sam_Hinkie_bot serves as a league information hub and interactive companion for my fantasy basketball league. Built with Python and deployed on Railway, this bot interfaces with Telegram's API to handle commands, mentions, and provide responses to league members.",
    iconName: "Bot",
    link: "https://github.com/seanmun",
    ariaLabel: "View Hinkie Bot details",
    requiresPassword: false,
    isLive: false,
    status: "Prod",
    techStack: ["Python", "Telegram API", "Railway", "GitHub"],
    modalContent: {
      images: [
        {
          src: "/projects/start.png",
          alt: "Fantasy League Bot welcome screen",
          caption: "Bot welcome screen showing available commands"
        },
        {
          src: "/projects/standings.png",
          alt: "Live league standings",
          caption: "Real-time league standings and statistics"
        },
        {
          src: "/projects/matchup.png",
          alt: "Weekly matchup information",
          caption: "Detailed weekly matchup breakdowns"
        },
        {
          src: "/projects/player.png",
          alt: "Player statistics lookup",
          caption: "Player stats and information on demand"
        },
        {
          src: "/projects/rules.png",
          alt: "League rules display",
          caption: "Quick access to league rules and settings"
        },
        {
          src: "/projects/responds.png",
          alt: "Bot interaction examples",
          caption: "Interactive responses to player queries"
        }
      ],
      overview: "The @Sam_Hinkie_bot is an interactive Telegram bot that serves as the digital commissioner and information hub for my fantasy basketball dynasty league. Named after the legendary NBA executive known for his analytics-driven approach, this bot brings automation and real-time information to league management.",
      keyFeatures: [
        "Real-time league standings and statistics",
        "Automated transaction notifications and updates",
        "Custom commands for league rules and information",
        "Interactive responses to player mentions and queries",
        "Integration with league database for live data",
        "Scheduled reminders for important league deadlines"
      ],
      technicalDetails: "Built with Python and deployed on Railway for 24/7 uptime. Integrates with Telegram's Bot API for message handling and uses webhooks for real-time updates. Connected to the league's database to provide accurate, up-to-date information to all league members.",
      callToAction: {
        primary: {
          label: "View on GitHub",
          url: "https://github.com/seanmun"
        },
        secondary: {
          label: "Get in touch",
          url: "mailto:sean.munley@protonmail.com"
        }
      }
    }
  },
  {
    title: "A.I.bert Bot",
    description: "A.I.bert is a AI-powered personal data assistant. Used to log sleep, diet, activity, mood, and physical features in a simple Telegram chat, while A.I.bert analyzes trends to help optimize my health and routines.",
    iconName: "Activity",
    link: "https://github.com/seanmun",
    ariaLabel: "View Telegram bot repo",
    requiresPassword: true,
    status: "MVP",
    techStack: ["Python", "Venice Token API", "Telegram API", "Railway"]
  },
  {
    title: "Cross-Chain Portfolio Tracker",
    description: "A privacy-first, real-time dashboard for tracking crypto holdings across Bitcoin, Ethereum, Pulsechain, Base, Solana, and more. Users simply enter their wallet addresses—no sign-in or wallet connection required. The app pulls token balances, NFTs, and Ordinals, then calculates total USD value using decentralized price feeds like Uniswap, 0x, and PulseX.",
    iconName: "Banknote",
    link: "https://github.com/seanmun",
    ariaLabel: "View Telegram bot repo",
    requiresPassword: true,
    status: "Dev",
    techStack: ["React", "Next.js", "TypeScript", "Alchemy API", "Web3"]
  }
];

// Tech Stack categories for reference
export const techStackCategories = {
  "Frontend Frameworks": ["React", "Next.js", "Vue.js", "Angular", "Svelte"],
  "Languages": ["TypeScript", "JavaScript", "Python", "HTML/CSS"],
  "Backend/Runtime": ["Node.js", "Express.js", "FastAPI", "Flask"],
  "Databases & Storage": ["Firebase", "Supabase", "MongoDB", "PostgreSQL"],
  "Hosting/Deployment": ["Vercel", "Netlify", "Railway", "AWS", "Heroku"],
  "AI/ML APIs": ["OpenAI API", "Claude API", "Gemini API" , "Venice Token API"],
  "Styling/UI": ["Tailwind CSS", "CSS Modules", "Material UI"],
  "Tools/Services": ["Telegram API", "Stripe API", "GitHub", "Web3", "Raspberry Pi"]
};

// Status configuration
export const statusConfig = {
  "Dev": {
    label: "In Development",
    colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  "MVP": {
    label: "MVP",
    colorClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  },
  "Prod": {
    label: "Production",
    colorClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  }
};
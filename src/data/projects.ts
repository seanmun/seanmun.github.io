// File: src/data/projects.ts
// Purpose: Project data with status and tech stack information

export const projects = [
  {
    title: "Kinetic.email",
    description: "An open source resource hub and showcase for interactive kinetic HTML emails that push the boundaries of traditional email design. This site serves as both an educational tool for email developers and a playground for innovation, demonstrating real-world use cases, implementation techniques, and cutting-edge concepts.",
    iconName: "Zap",
    link: "https://www.kinetic.email/",
    ariaLabel: "View Kinetic.email website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["Claude API", "React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS", "Vercel"]
  },
  {
    title: "Amber Mode",
    description: "Amber Mode is a custom screen theme I designed to reduce blue light exposure and support healthy circadian rhythms. By shifting to warm amber tones, it helps minimize melatonin disruption during evening use while maintaining readability and visual comfort.",
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
    description: "Draft Day Trades is a web application that lets sports fans create and join confidence-based draft prediction pools, where users select which players will be drafted at each position and assign strategic confidence points to their picks. Built with React, Next.js, TypeScript, and Firebase, the platform features real-time leaderboards and scoring during draft night, creating a competitive and engaging experience for friends to enjoy major sporting drafts together.",
    iconName: "Trophy",
    link: "https://draftdaytrades.com/",
    ariaLabel: "View Draft Day Trades website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Firebase", "Tailwind CSS", "Vercel"]
  },
  {
    title: "OrdinalFrame",
    description: "Bitcoin Ordinals deserve better than a browser tab. OrdinalFrame turns a Raspberry Pi and Waveshare touchscreen into a living art display that hangs on your wall. It runs custom Python + React code to pull your Ordinals straight from the blockchain — no screenshots, no compromises. All wrapped up in a custom gold frame.",
    iconName: "Box",
    link: "#",
    ariaLabel: "View Ordinal Frame project details",
    requiresPassword: false,
    triggerOrdinalFrameModal: true,
    status: "MVP",
    techStack: ["Python", "React", "Raspberry Pi", "JavaScript"]
  },
  {
    title: "RumbleRaffle.com",
    description: "RumbleRaffle.com lets friends create Royal Rumble gambling leagues, randomly assign entrant numbers, and track eliminations in real-time. Built with Next.js, Express.js, and TypeScript, it features automated number distribution and a live event tracker, deployed via Vercel.",
    iconName: "Medal",
    link: "https://www.rumbleraffle.com/",
    ariaLabel: "View Rumble Raffle website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["Next.js", "Express.js", "TypeScript", "Node.js", "Vercel"]
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
    link: "https://github.com/seanmun/HinkieBot",
    ariaLabel: "View Telegram bot repo",
    requiresPassword: false,
    status: "Prod",
    techStack: ["Python", "Telegram API", "Railway", "GitHub"]
  },
  {
    title: "A.I.bert Bot",
    description: "A.I.bert is a AI-powered personal data assistant. Used to log sleep, diet, activity, mood, and physical features in a simple Telegram chat, while A.I.bert analyzes trends to help optimize my health and routines.",
    iconName: "Activity",
    link: "https://github.com/seanmun",
    ariaLabel: "View Telegram bot repo",
    requiresPassword: true,
    status: "MVP",
    techStack: ["Python", "OpenAI API", "Telegram API", "Railway"]
  },
  {
    title: "Cross-Chain Portfolio Tracker",
    description: "A privacy-first, real-time dashboard for tracking crypto holdings across Ethereum, Bitcoin, Pulsechain, Base, Solana, and more. Users simply enter their wallet addresses—no sign-in or wallet connection required. The app pulls token balances, NFTs, and Ordinals, then calculates total USD value using decentralized price feeds like Uniswap, 0x, and PulseX.",
    iconName: "Banknote",
    link: "https://github.com/seanmun",
    ariaLabel: "View Telegram bot repo",
    requiresPassword: true,
    status: "Dev",
    techStack: ["React", "Next.js", "TypeScript", "Web3"]
  }
];

// Tech Stack categories for reference
export const techStackCategories = {
  "Frontend Frameworks": ["React", "Next.js", "Vue.js", "Angular", "Svelte"],
  "Languages": ["TypeScript", "JavaScript", "Python", "HTML/CSS"],
  "Backend/Runtime": ["Node.js", "Express.js", "FastAPI", "Flask"],
  "Databases & Storage": ["Firebase", "Supabase", "MongoDB", "PostgreSQL"],
  "Hosting/Deployment": ["Vercel", "Netlify", "Railway", "AWS", "Heroku"],
  "AI/ML APIs": ["OpenAI API", "Claude API", "Gemini API"],
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
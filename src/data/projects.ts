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

// A titled block of case-study prose: paragraph(s), optional bullet list,
// optional closing paragraph after the bullets
export interface ProjectDetailSection {
  heading: string;
  body?: string;
  bullets?: string[];
  footer?: string;
}

export interface ProjectModalContent {
  images?: ProjectImage[];
  overview?: string;
  detailSections?: ProjectDetailSection[];
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
  slug: string; // URL segment for the project feature page: /projects/[slug]
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
    slug: "kinetic-email",
    description: "AI-powered platform for building interactive emails — learn the techniques, generate production-ready code, and track engagement inside the inbox. Describe an email in plain English and get two parallel production builds (kinetic HTML and AMP4Email) from a staged multi-model Claude pipeline, backed by developer curricula, multi-tenant brand workspaces, and real-time in-email analytics.",
    iconName: "Zap",
    link: "https://www.kinetic.email/",
    ariaLabel: "View Kinetic.email website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "TypeScript", "Vite", "Tailwind CSS", "Supabase", "Convex", "Claude API", "OpenAI API", "Pinecone", "Mailgun", "Vercel"],
    // Planned imagery (shoot at 1440px+, GIFs for anything interactive):
    //  1. Landing page hero with the live interactive demo email mid-action
    //  2. Playground: prompt on left, iOS Mail simulator preview on right
    //  3. Same email side-by-side: Kinetic (Apple Mail) vs AMP (Gmail)
    //  4. Learning module with Monaco editor + live preview
    //  5. Brand Builder: colors, tone, style-theory picker
    //  6. Arc campaign canvas with a multi-email flow
    //  7. Real-time tracking dashboard (GIF: phone tap -> live event)
    //  8. System architecture diagram (make in Excalidraw/Figma)
    //  9. Generation pipeline diagram with model annotations
    // 10. Spritz reader GIF during generation
    // 11. Station admin: RAG library or token economy config (optional)
    modalContent: {
      overview: "AI-powered platform for building interactive emails — learn the techniques, generate production-ready code, and track engagement inside the inbox. Email is the highest-ROI channel in marketing, but 99% of emails are static brochures. Kinetic.email exists to change that.",
      detailSections: [
        {
          heading: "The Problem",
          body: "Interactive (\"kinetic\") email — tabs, carousels, surveys, and carts that work inside the inbox — has existed for a decade, but almost nobody ships it:",
          bullets: [
            "It's hard. Interactivity in email relies on CSS :checked hacks and AMP4Email, with a compatibility matrix that varies by client — and zero JavaScript allowed.",
            "There's no tooling. ESPs don't generate it, templates don't exist for it, and testing it requires sending to a dozen real inboxes.",
            "Nobody teaches it. The knowledge lives in scattered blog posts and the heads of a few hundred email developers."
          ],
          footer: "Kinetic.email solves all three: an education platform that teaches the techniques, an AI generation engine that writes the code, and a workspace where teams manage brands, campaigns, and real engagement analytics."
        },
        {
          heading: "Describe an email → get two production builds",
          body: "The AI Playground takes a plain-English prompt (or a saved brand profile) and generates two parallel builds of the same email: Kinetic HTML — CSS :checked interactivity for Apple Mail and iOS Mail, with Yahoo/AOL hacks, MSO conditionals, and graceful static fallback for everything else — and AMP4Email, using amp-carousel, amp-form, and amp-bind for dynamic content in Gmail and Yahoo. Both builds share a single design blueprint (palette, typography, spacing, button styles), so the visual experience is identical no matter which client opens it. They ship together as a tri-part MIME bundle — one send, and every inbox gets the best experience it supports."
        },
        {
          heading: "Learn the craft",
          body: "Six developer modules (the checkbox hack, kinetic lightswitch, tabbed elements, tracking, and more) plus marketing and coding curricula — with in-browser code editors, progress tracking, and badges. The education layer isn't a side feature: it feeds the token economy, and educated users become the platform's advocates."
        },
        {
          heading: "Manage brands and campaigns",
          body: "Multi-tenant workspaces built for teams:",
          bullets: [
            "Brand Builder — colors, fonts, tone, logo, product catalog (manual + CSV/Shopify import), CAN-SPAM details, and one of eight \"style theories\" (editorial-minimal, bold-brutalist, luxe-premium…) that steer how the AI constructs the email, not just what colors it uses",
            "Projects & Emails — versioned email management with test sends via Mailgun",
            "Arc — a visual campaign canvas (React Flow) for composing email journeys, shareable with clients via tokenized links",
            "Brand sharing — invite collaborators with owner/member permissions enforced at the database level"
          ]
        },
        {
          heading: "Track engagement inside the email",
          body: "Kinetic emails report interaction without JavaScript: when a :checked selector fires, a CSS background-image tracking pixel loads. AMP versions submit real forms. Both stream into a real-time Convex database — see which tab a subscriber opened, which carousel slide they stopped on, which survey answer they picked, all without a single click-through."
        },
        {
          heading: "The generation pipeline",
          body: "Email generation is a staged, multi-model pipeline — not a single prompt:",
          bullets: [
            "Brief builder (Claude Haiku) turns the user prompt + brand config into a structured brief: audience, copy, component pairings, palette",
            "Design blueprint (Haiku) emits binding design tokens both builds must obey",
            "RAG retrieval runs hybrid search over a Pinecone dual-index (1,536- and 3,072-dimension OpenAI embeddings) of proven kinetic/AMP examples and technique write-ups, with technique detection, metadata filtering, and Claude re-ranking to pick the top 7 references",
            "Parallel generators (Claude Sonnet) produce kinetic HTML and AMP4Email concurrently from the same brief",
            "Dual QA validators (Haiku) — a 30-check validator for kinetic, 24-check for AMP plus the official amphtml-validator; both must pass",
            "Curator (Haiku) scores the pair on design, content, interactivity, and uniqueness before approval"
          ],
          footer: "The model split is deliberate: Sonnet where code quality matters, Haiku everywhere speed and cost matter. Cheap models validate the expensive model's work."
        },
        {
          heading: "Waiting is a feature",
          body: "Generation takes a minute-plus, so instead of a spinner, the UI speed-reads the email's copy blueprint back to the user with a Spritz-style RSVP reader (~450 words per minute) while the code generates. Users review the copy in the time it takes Claude to write the code."
        },
        {
          heading: "Engineering details",
          bullets: [
            "Multi-tenancy at the database layer: every Supabase table runs Row-Level Security — permissions are Postgres policies, not application code — with SECURITY DEFINER helpers to safely cross tenant boundaries and 100+ numbered SQL migrations tracking the schema's evolution",
            "Analytics rebuilt from primitives: email clients strip all scripts, so CSS state changes load tracking pixels for kinetic and hidden form fields carry AMP events; everything validates sendId/userId pairs server-side and flags mismatches as suspicious",
            "Growth loop: a token economy gates AI generation — users earn tokens by signing up, completing courses, and referring friends, so every earn action either educates a user or acquires one; all rewards and costs are tunable live from an admin panel without deploys"
          ]
        }
      ],
      technicalDetails: "React 19, TypeScript, Vite, Tailwind, React Flow, and Monaco Editor on the front end; Vercel serverless functions for the API; Claude Sonnet + Haiku for generation and QA with OpenAI embeddings and Pinecone powering RAG; Supabase (Postgres + RLS + OAuth/magic link) for data and auth; Convex for real-time in-email event tracking; Mailgun for tri-part MIME delivery (plain + HTML + AMP). Solo-built: product, design, frontend, backend, prompt engineering, and the database schema.",
      callToAction: {
        primary: {
          label: "Try the AI Playground",
          url: "https://www.kinetic.email/"
        },
        secondary: {
          label: "Get in touch",
          url: "mailto:sean.munley@protonmail.com"
        }
      }
    }
  },
  {
    title: "Money Never Sleeps",
    slug: "money-never-sleeps",
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
    title: "To Posterity",
    slug: "to-posterity",
    description: "A voice-first legacy platform that turns spoken stories into polished memoirs, podcast audio, and structured metadata — with zero writing required. The name is drawn from Petrarch's 1350 letter Ad Posteros, and every recording is framed as a sealed letter to readers centuries from now. An end-to-end AI pipeline handles transcription (Deepgram), narrative enhancement (Claude), and narration with optional voice cloning (ElevenLabs). Designed around the \"Bumper Test\" for older adults — radical simplicity, zero tech skills required.",
    iconName: "Mic",
    link: "https://toposterity.ai",
    ariaLabel: "View To Posterity website",
    requiresPassword: false,
    status: "Dev",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Supabase", "Deepgram", "Claude API", "ElevenLabs", "Zustand", "Vercel"]
  },
  {
    title: "Buddy Cup",
    slug: "buddy-cup",
    description: "A multi-tenant Ryder-Cup-style platform that brings real match-play scoring to the buddy golf trip. Navigate actual match-play math with handicap strokes auto-allocated by stroke index, dormie tracking, and closeouts (3&2, 4&3) computed the moment the deciding hole posts. Manage your entire trip from one phone — courses, players, tee times, matchups, even the welcome dinner. Snap a scorecard photo and AI reads par and stroke index for all 18 holes. The team feed runs hot with score posts, trash talk, and photos, while team and individual leaderboards update the second a putt drops. Defend the cup.",
    iconName: "LandPlot",
    link: "https://www.buddycup.golf/",
    ariaLabel: "View Buddy Cup website",
    requiresPassword: false,
    status: "MVP",
    techStack: ["React", "Next.js", "TypeScript", "Drizzle ORM", "Neon Postgres", "Clerk Auth", "Anthropic Claude API", "Tailwind CSS", "Vercel"]
  },
  {
    title: "Rocket Pool Tour",
    slug: "rocket-pool-tour",
    description: "A website for the Rocket Pool Tour — a next-generation professional billiards league founded by World Champion Rodney 'Rocket' Morris. The RPT introduces Rocket Run-Out©, a fast-paced, offense-driven game format that brings a modern, data-rich approach to a classic sport. The site pairs a back-end CRM for investor relations with a front-end marketing and educational hub for the league and its upcoming events. Expected launch Q2 2026.",
    iconName: "Rocket",
    link: "https://therocketpooltour.com/",
    ariaLabel: "View Rocket Pool Tour website",
    requiresPassword: false,
    status: "Dev",
    techStack: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"]
  },
  {
    title: "Amber Mode",
    slug: "amber-mode",
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
    title: "OrdinalFrame",
    slug: "ordinalframe",
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
    slug: "rumbleraffle",
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
    slug: "human-diet",
    description: "Explore 300,000 years of human dietary evolution through an interactive horizontal scroll where each pixel represents one year, showcasing the transition from natural diets to modern preservative-laden and seed oil-rich foods.",
    iconName: "Beef",
    link: "https://www.human-diet.com/",
    ariaLabel: "View 1 pixel health project page",
    requiresPassword: false,
    status: "Prod",
    techStack: ["HTML/CSS", "JavaScript", "Vercel"]
  },
  {
    title: "TrustThePick.com",
    slug: "trustthepick",
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
    slug: "draftdaytrades",
    description: "Draft Day Trades lets sports fans create confidence-based draft prediction pools for NFL, NBA, WNBA, NHL, and MLB drafts. Users predict which players will be drafted at each position and assign strategic confidence points to their picks. The platform features real-time leaderboards and scoring during draft night, creating a competitive experience for friends to enjoy together.",
    iconName: "Trophy",
    link: "https://draftdaytrades.com/",
    ariaLabel: "View Draft Day Trades website",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Firebase", "Tailwind CSS", "Vercel"]
  },
  {
    title: "Fantasy League Bot",
    slug: "fantasy-league-bot",
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
    title: "A.I.bert E.",
    slug: "aibert-bot",
    description: "A self-hosted, AI-native personal health data lake you operate entirely through a text message. Tell A.I.bert about meals, sleep, and moods in plain English — or send selfies, lab PDFs, and smart-ring data — and Claude structures it all into a private time-series on a Raspberry Pi, then answers questions like \"what actually makes me feel worse?\" with evidence.",
    iconName: "Activity",
    link: "https://github.com/seanmun",
    ariaLabel: "View A.I.bert project details",
    requiresPassword: true,
    status: "MVP",
    techStack: ["TypeScript", "Node.js", "SQLite", "Drizzle ORM", "grammy", "Claude API", "Oura API", "Bluetooth", "Raspberry Pi"],
    modalContent: {
      overview: "A.I.bert E. — powered by LifeLog — is a self-hosted, AI-native personal health data lake you operate entirely through a text message. The point isn't logging: it's answers a spreadsheet could never give you.",
      detailSections: [
        {
          heading: "The idea",
          body: "Most health apps make you do the work: open the app, tap through forms, pick categories, then hand your most sensitive data to a company that stores, mines, or sells it. I wanted the opposite — a system where I just talk, an AI does the structuring, and every byte lives on hardware I own. So I built A.I.bert, a personal assistant that lives in a Telegram chat. I message it in plain English — \"wore red light glasses before bed,\" \"45 min shoulder workout at gym,\" \"took melatonin and collagen\" — and it turns the mess of daily life into clean, structured, timestamped health data.",
          footer: "Send a selfie and computer vision tracks facial changes over time. Send a lab PDF and it extracts every biomarker with reference ranges. A smart ring feeds sleep and steps automatically. Then, on demand, it analyzes everything across time to answer the questions I actually care about — like what's driving my episodic facial bloating, treated as a delayed-onset, dose-and-recovery problem rather than a same-day one."
        },
        {
          heading: "How it works",
          body: "One process runs three subsystems over a single SQLite database:",
          bullets: [
            "Ingest — a Telegram bot handles text, photos, and documents: an LLM parses free text into structured entries (food, sleep, mood, routines, environment), a vision model scores selfies for puffiness, skin tone, and appearance trends, and a document model turns bloodwork into a biomarker time-series",
            "Wearables — automatic ingestion from an Oura ring (OAuth cloud pull with refresh-token rotation) and a COLMi R02 (offline, open-source, Bluetooth — the ring is read directly, no vendor app, no cloud)",
            "Analysis — an on-demand correlation engine (Claude Opus with adaptive thinking) builds timelines, looks back days for triggers, compares good weeks vs. bad weeks, and proposes elimination tests — always citing dates and separating correlation from causation"
          ],
          footer: "A core architectural rule ties it together: capture everything raw before processing. Every inbound message and file is stored verbatim first; the structured layer is derived and always rebuildable. Lose nothing."
        },
        {
          heading: "What it shows",
          body: "The build is a study in pragmatic engineering decisions:",
          bullets: [
            "A flexible schema — typed JSON shapes for common data, free-form for novel things, so logging something new never requires a migration",
            "Idempotent wearable syncs keyed by day",
            "Graceful degradation — an unparseable message is still stored, and the user is told it's safe",
            "A provider-agnostic wearable layer that ingests whichever ring synced most recently"
          ],
          footer: "When Anthropic's API deprecated a sampling parameter mid-project, I diagnosed the failure, upgraded the SDK, and moved the analysis engine to adaptive thinking — turning a breakage into an upgrade."
        },
        {
          heading: "The vision",
          body: "A.I.bert is one instance of a bigger thesis: you should own your data, and AI should do the tedious part of using it. The roadmap is a genuinely personal, private \"quantified self\" that gets smarter the longer it runs — a system that quietly collects for years, runs entirely in your home, never touches the cloud, and can answer \"what actually makes me feel worse?\" with evidence.",
          footer: "Built on one principle: capture everything, lose nothing, and never give it away."
        }
      ],
      technicalDetails: "TypeScript (strict) and Node.js with SQLite + Drizzle ORM for storage; grammy for the Telegram bot; Anthropic Claude for parsing, vision, document extraction, and correlation analysis; Oura API v2 and an open-source COLMi R02 Bluetooth client for wearables; Hono for the OAuth callback; Zod for validation — all self-hosted on a Raspberry Pi.",
      callToAction: {
        secondary: {
          label: "Get in touch",
          url: "mailto:sean.munley@protonmail.com"
        }
      }
    }
  },
  {
    title: "Cross-Chain Portfolio Tracker",
    slug: "cross-chain-portfolio-tracker",
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
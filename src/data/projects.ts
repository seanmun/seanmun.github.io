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

// One bot/agent on a multi-tenant roster page (e.g. Agent Army): rendered
// as its own card with a header and case-study sections
export interface ProjectRosterBot {
  name: string;
  tagline: string;
  iconName: string;
  status?: 'Dev' | 'MVP' | 'Prod';
  images?: ProjectImage[];
  sections: ProjectDetailSection[];
}

export interface ProjectModalContent {
  images?: ProjectImage[];
  overview?: string;
  detailSections?: ProjectDetailSection[];
  roster?: ProjectRosterBot[];
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
    title: "Agent Army",
    slug: "agent-army",
    description: "A growing fleet of Telegram bots and agents, each with one job it does relentlessly: Hinkie runs my fantasy basketball league and channels the Process, A.I.bert turns text messages into a private self-hosted health data lake, and ITYSL Bot drops the perfect sketch clip into any chat. Chat interfaces, real infrastructure, always on duty.",
    iconName: "Bot",
    link: "",
    ariaLabel: "View Agent Army project details",
    requiresPassword: false,
    status: "Prod",
    techStack: ["Python", "TypeScript", "Node.js", "Telegram API", "Claude API", "SQLite", "Railway", "Raspberry Pi"],
    modalContent: {
      overview: "One card, many agents. Agent Army is the collection of bots I build, deploy, and keep on duty \u2014 each with a single job, its own infrastructure, and a personality earned in a group chat.",
      detailSections: [
        {
          heading: "Why an army",
          body: "Bots are the purest form of turning an idea into a working product: a chat interface, a job to do, and no UI to build. Every recruit below runs 24/7 \u2014 some in the cloud on Railway, some on a Raspberry Pi in my house \u2014 and each one taught me something different about building agents people actually use every day."
        }
      ],
      roster: [
        {
          name: "Sam Hinkie Bot",
          tagline: "Digital commissioner and information hub for a fantasy basketball dynasty league",
          iconName: "Trophy",
          status: "Prod",
          images: [
            { src: "/projects/start.png", alt: "Fantasy League Bot welcome screen", caption: "Bot welcome screen showing available commands" },
            { src: "/projects/standings.png", alt: "Live league standings", caption: "Real-time league standings and statistics" },
            { src: "/projects/matchup.png", alt: "Weekly matchup information", caption: "Detailed weekly matchup breakdowns" },
            { src: "/projects/player.png", alt: "Player statistics lookup", caption: "Player stats and information on demand" },
            { src: "/projects/rules.png", alt: "League rules display", caption: "Quick access to league rules and settings" },
            { src: "/projects/responds.png", alt: "Bot interaction examples", caption: "Interactive responses to player queries" }
          ],
          sections: [
            {
              heading: "What it does",
              body: "Named after the legendary NBA executive known for his analytics-driven approach, @Sam_Hinkie_bot brings automation and real-time information to league management \u2014 and delivers daily Hinkie-inspired wisdom to keep the league faithful to the Process.",
              bullets: [
                "Real-time league standings and statistics on command",
                "Automated transaction notifications and updates",
                "Custom commands for league rules and information",
                "Interactive responses to player mentions and queries",
                "Scheduled reminders for important league deadlines"
              ],
              footer: "Built with Python and deployed on Railway for 24/7 uptime. Integrates with Telegram's Bot API for message handling, uses webhooks for real-time updates, and connects to the league database so every answer is live data."
            }
          ]
        },
        {
          name: "A.I.bert E.",
          tagline: "A self-hosted, AI-native personal health data lake operated entirely through a text message",
          iconName: "Activity",
          status: "Prod",
          sections: [
            {
              heading: "What it does",
              body: "Most health apps make you do the work, then hand your most sensitive data to a company. A.I.bert is the opposite: message it in plain English \u2014 \"wore red light glasses before bed,\" \"45 min shoulder workout at gym,\" \"took melatonin and collagen\" \u2014 and it turns the mess of daily life into clean, structured, timestamped health data on hardware I own. Send a selfie and computer vision tracks facial changes over time; send a lab PDF and it extracts every biomarker with reference ranges; a smart ring feeds sleep and steps automatically."
            },
            {
              heading: "How it works",
              body: "One process runs three subsystems over a single SQLite database:",
              bullets: [
                "Ingest \u2014 a Telegram bot handles text, photos, and documents: an LLM parses free text into structured entries, a vision model scores selfies for appearance trends, and a document model turns bloodwork into a biomarker time-series",
                "Wearables \u2014 automatic ingestion from an Oura ring (OAuth cloud pull) and a COLMi R02 read directly over Bluetooth \u2014 no vendor app, no cloud",
                "Analysis \u2014 an on-demand correlation engine (Claude Opus with adaptive thinking) builds timelines, hunts multi-day triggers, and proposes elimination tests \u2014 always citing dates and separating correlation from causation"
              ],
              footer: "The core architectural rule: capture everything raw before processing. Every inbound message is stored verbatim first; the structured layer is derived and always rebuildable. TypeScript (strict), Node.js, SQLite + Drizzle ORM, self-hosted on a Raspberry Pi. Built on one principle: capture everything, lose nothing, and never give it away."
            }
          ]
        },
        {
          name: "ITYSL Bot",
          tagline: "A Telegram inline meme bot for I Think You Should Leave clips \u2014 type a quote in any chat, tap the match, posted instantly",
          iconName: "Clapperboard",
          status: "Prod",
          images: [
            {
              src: "/projects/itysl_bot.png",
              alt: "ITYSL Bot inline search in Telegram",
              caption: "Type @itysl_bot plus a quote — the inline grid surfaces matching clips, tap to post"
            }
          ],
          sections: [
            {
              heading: "Why I built it",
              body: "@gif has been part of Telegram for almost a decade. Then Google shut down Tenor's search API, which suffocated ~90% of the GIFs Telegram surfaced and quietly wrecked an experience millions of people used every day. Someone needed to step up. \"Yeah, I'll do it.\" So I rebuilt the chat feature myself \u2014 stocked with the best meme kit from the show I Think You Should Leave."
            },
            {
              heading: "What it does",
              body: "Type @itysl_bot plus a quote in any chat \u2014 group or DM, without adding the bot \u2014 and a grid of matching clips pops up. Tap one and it posts instantly as you. It fills the hole left when Telegram's GIF search stopped surfacing niche sketch content.",
              bullets: [
                "Inline search everywhere \u2014 @itysl_bot sloppy steaks \u2192 animated thumbnail grid \u2192 tap \u2192 posted. Works in any chat because inline bots ride on Telegram itself; the bot never joins your groups",
                "Fuzzy, ranked matching \u2014 queries match against each clip's quotes (weighted highest, it's what people actually type), then title, then tags. Full phrases (\"who did this\") and loose descriptive words (\"baby award rigged\") both land the right clip",
                "Zero-friction library growth \u2014 DM the bot a GIF or video with a caption and it's saved and searchable in seconds; no redeploys, no file editing",
                "Private by design \u2014 only the admin's account (locked by Telegram user id) can DM it or add clips; everyone else can only use inline search"
              ]
            },
            {
              heading: "How it works",
              bullets: [
                "Telegram hosts all media \u2014 each clip is uploaded once and the bot stores only the returned file_id in a JSON library (~128 clips). Results are served as cached inline results: no CDN, no hosting bill, effectively instant",
                "In-memory fuzzy index \u2014 on boot (and on /reload) the clip library is validated with Zod and indexed with Fuse.js. Inline queries hit only this precomputed index \u2014 no database, no LLM, nothing async in the hot path, because inline results must render as you type",
                "Two media kinds \u2014 mpeg4gif (silent, looping, shows in the animated mosaic on all platforms) and video (keeps sound, previews on mobile; Telegram Desktop renders titled video results as a plain list \u2014 an API limitation)",
                "Self-healing long-polling \u2014 the bot polls Telegram outbound-only (runs behind any home router: no public URL, no webhook), and if polling is ever killed it logs and reconnects after 5s instead of dying silently"
              ],
              footer: "TypeScript on Node 20+, deliberately small: grammY for Telegram, Fuse.js for weighted fuzzy search, Zod for a schema-checked clip library, and a flat JSON file \u2014 git is the database. Supporting ffmpeg scripts handle poster frames, thumbnails, and batch backfills. The design bias throughout: no infrastructure. One process, one JSON file, Telegram as the CDN \u2014 the whole thing runs on a Raspberry Pi."
            }
          ]
        }
      ],
      callToAction: {
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
    techStack: ["Next.js", "TypeScript", "Neon Postgres", "Drizzle ORM", "Clerk Auth", "Claude API", "OpenAI API", "TanStack Query", "Tailwind CSS", "Vercel"],
    modalContent: {
      overview: "Run your trip. Crown your champion. Buddy Cup is a multi-tenant Ryder-Cup-style platform that brings real match-play scoring to the buddy golf trip — courses, players, tee times, matchups, live leaderboards, and the surrounding chaos, all managed from one phone.",
      detailSections: [
        {
          heading: "The idea",
          body: "Every buddy golf trip has the same problem: someone becomes the human spreadsheet. Tee times live in a group text, matchups on a napkin, and nobody can actually score match play with handicaps — so the \"cup\" gets settled by vibes. Buddy Cup replaces all of it. From signed-up to first tee shot in an afternoon: create the trip, invite your buddies, snap your scorecards, schedule your cup, and plan the surrounding chaos — flights, shuttles, dinners, the post-round bar stop — all on one shared, day-by-day timeline next to the golf."
        },
        {
          heading: "Signature features",
          bullets: [
            "Real match-play scoring — not stroke-play with a coat of paint. The engine speaks the actual language of the Ryder Cup: DORMIE, AS, 3&2. Handicap strokes are allocated USGA-style against each hole's stroke index, net scores are compared per hole, and closeouts are detected the moment a match becomes mathematically over. Supports singles, 2v2 best ball, two-man aggregate, scramble, and house formats — with multiple handicap methods selectable per match",
            "AI scorecard reader — adding a course used to mean typing 54+ numbers. Now you photograph the scorecard and Claude's vision model extracts par, stroke index, and per-tee yardage/rating/slope for all 18 holes — with validation that falls back to manual entry rather than ever writing garbage data",
            "Arcade matchup portraits — players upload a photo and an AI image pipeline returns a 1994-NBA-Jam-digitizer version of them: pixelated, palette-crushed, transparent background, composited onto gold-framed matchup cards with team-color glows, CRT scanlines, and handicap-driven rating bars. Matchup reveals feel like a fight card",
            "The feed — a team chat built for the trip, not for productivity. Score posts, hole-tagged photos, emoji reactions, and trash talk — auto-moderated by an image-moderation service so admins don't have to babysit",
            "Live cup scoreboard — broadcast-graphics hierarchy: team total on top (\"8½ – 6½, 6 points left\"), per-match status cards and an individual leaderboard below, updating as holes post",
            "Lazy-claim roster — the admin seeds every player slot with email, nickname, and handicap; players claim their slot on first login via magic link. The trip is fully operational on day one even if half the group never signs in"
          ]
        },
        {
          heading: "Build strategy",
          bullets: [
            "The scoring engine is a pure-function package: match-play math is the most algorithmically important code in the app, so it lives in its own workspace package with zero database or framework dependencies — inputs in, results out — covered by unit and property-based tests that make exotic formats safe to add",
            "Multi-tenant data, single-tenant UI: every domain table is trip-scoped from day one, but v1 ships hardcoded for a real 12-man trip. The schema is the cheap insurance, the trip-creation UI is the deferred scope — unlocking \"any group's trip\" is routing and forms, not a rewrite",
            "Permissions in the application layer: all authorization cascades through one set of helpers — platform admin → trip admin → captain → self — so a permission rule is one function, not a policy scattered across tables",
            "AI with a safety net: the scorecard reader validates its output and falls back to manual entry, and portrait generation never destroys the source photo. AI accelerates the happy path; it never gatekeeps it",
            "Polling-first realtime: golf doesn't need millisecond updates. TanStack Query polling keeps the leaderboard live with a fraction of the infrastructure of WebSockets — architecture matched to the actual problem",
            "Built against a real trip: the whole product is pressure-tested by an actual 12-man, 6-round cup — real handicaps, real tee times, real trash talk. Nothing ships that wouldn't survive contact with 12 opinionated golfers"
          ]
        }
      ],
      technicalDetails: "Next.js (App Router) with TypeScript and React Server Components — client components only where interactivity demands it. Neon serverless Postgres with Drizzle ORM (schema-as-code as the single source of truth); Clerk magic-link auth with a layered permission model. AI: Anthropic Claude (vision + extended thinking) for scorecard extraction, OpenAI gpt-image-1 for arcade portraits, Sightengine for feed moderation. UI: Tailwind CSS v4, Framer Motion, dnd-kit, and TanStack Query for server state and polling-based live updates. Vercel hosting with Vercel Blob storage, Sharp image processing, and Resend + React Email for delivery.",
      plannedFeatures: [
        "Native iOS and Android apps — the scorecard, feed, and live cup standings on true native mobile, with push notifications for match closeouts and dormie alerts",
        "Apple Watch app — enter hole scores from your wrist mid-round and glance at match status (2 UP, thru 14) without pulling out your phone",
        "Trip Memoir Engine — every hole-tagged photo, score, and feed post is already structured to fuel AI-generated nightly recaps and a post-trip highlight video (Remotion-based), with narrated audio",
        "GHIN integration, trophy room, and record book — season-over-season rivalry history"
      ],
      callToAction: {
        primary: {
          label: "Visit BuddyCup.golf",
          url: "https://www.buddycup.golf/"
        },
        secondary: {
          label: "Get in touch",
          url: "mailto:sean.munley@protonmail.com"
        }
      }
    }
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
    description: "An interactive data-storytelling experience that visualizes how the human diet stayed remarkably consistent for ~300,000 years — and then transformed almost overnight. Built as a scroll-driven \"camera zoom\" over a truthful, perfectly linear timeline, so the viewer physically feels how tiny the window of modern change really is.",
    iconName: "Beef",
    link: "https://www.human-diet.com/",
    ariaLabel: "View Human-Diet.com project page",
    requiresPassword: false,
    status: "Prod",
    techStack: ["React", "TypeScript", "Vite", "Canvas", "Framer Motion", "Tailwind CSS", "Vercel"],
    modalContent: {
      overview: "An interactive journey through 300,000 years of the human diet — a scroll-driven data story where the scale of time itself is the argument.",
      detailSections: [
        {
          heading: "The idea",
          body: "Most nutrition charts flatten history to make a point. I wanted to do the opposite: let the scale of time be the argument. The premise of Human Diet is simple and a little unsettling — for nearly all of human existence we ate one broadly stable diet, and then in the last ~200 years (seed oils, ultra-processed foods) we rewrote it. The whole design goal was to make someone feel that in their gut, not just read it."
        },
        {
          heading: "The learning goal",
          body: "I set out to learn honest data storytelling — how to build a narrative experience that's genuinely persuasive without ever distorting the underlying data. That turned into a deeper set of challenges: scroll-driven \"scrollytelling,\" high-performance canvas rendering, and designing a single experience that feels native on both a mouse and a touchscreen."
        },
        {
          heading: "The hardest (and most interesting) problem",
          body: "The core tension: on a truthful linear timeline, 300,000 years of change lives in the final 0.07% of the axis — so all the drama is invisible, crammed into a couple of pixels. The tempting shortcut is to warp the axis and give recent history more room. I built that version first, then threw it out: warping the axis literally inverts the thesis — it gives the last 200 years the same visual weight as 200,000 years, which is the exact lie the project exists to expose.",
          footer: "The solution keeps the data completely honest and solves legibility with navigation instead of distortion. The x-axis is always perfectly linear — every year gets equal weight. Scrolling doesn't warp anything; it drives an honest camera zoom toward the present, the way you'd zoom into the corner of a huge photograph. You open on the truthful whole-history frame — a vast flat expanse of \"one diet,\" with the modern era as a hair-thin sliver at the edge — then dive in to watch the change at full detail, with the present always pinned to the right edge. A live \"years on screen\" counter falls from 302,025 → 150 as you zoom, which became the emotional payload of the whole piece."
        },
        {
          heading: "How it's built",
          bullets: [
            "React 18 + TypeScript + Vite + Tailwind CSS for the app shell and design system",
            "Framer Motion links scroll position to the experience; discrete state (active chapter, phase) is decoupled from continuous values so scrolling never triggers unnecessary re-renders",
            "The visualization is a hand-built canvas streamgraph, not a charting library: it samples the diet composition across the visible year-window and renders stacked, gradient-filled bands driven imperatively through a requestAnimationFrame loop — 60fps while the camera zooms, with zero React renders per frame",
            "A small time-scale module encapsulates the camera math: an exponential zoom that naturally gives deep prehistory ~half the journey and recent history the other half, while the on-screen axis stays linear",
            "Responsive by input, not just width: vertical scroll is the native gesture on both touch and mouse; desktop additionally gets a hover-to-inspect readout, and the layout reflows to a swipeable key and repositioned narrative cards on mobile",
            "Diet composition data is a structured dataset of era-by-era estimates synthesized from anthropological, archaeological, and nutritional sources, with an interpolation layer that produces smooth transitions between periods"
          ]
        },
        {
          heading: "What it demonstrates",
          bullets: [
            "Concept — turning a data set into an argument you can feel: finding the one interaction (a truthful zoom) that makes the point land",
            "Judgment — recognizing and rejecting the \"easy\" version that would have quietly lied, and engineering a harder solution that keeps the data honest",
            "Execution — custom canvas rendering, scroll-linked animation, performance discipline, and a cohesive cross-device experience, end to end"
          ]
        }
      ],
      callToAction: {
        primary: {
          label: "Visit Human-Diet.com",
          url: "https://www.human-diet.com/"
        },
        secondary: {
          label: "Get in touch",
          url: "mailto:sean.munley@protonmail.com"
        }
      }
    }
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
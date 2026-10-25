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

// A visual inside a case-study section. Videos are silent loops that play
// only while on screen; srcMobile / posterMobile swap in a vertical cut on
// phones. width/height reserve the box so nothing jumps as media loads.
export interface ProjectMedia {
  type: 'video' | 'image' | 'diagram';
  src?: string;
  poster?: string;
  srcMobile?: string;
  posterMobile?: string;
  width?: number;
  height?: number;
  alt: string;
  caption?: string;
  diagram?: 'kinetic-pipeline' | 'buddycup-trip';
}

// A titled block of case-study prose: paragraph(s), optional media (shown
// after the opening paragraph), optional bullet list, optional closing
// paragraph after the bullets
export interface ProjectDetailSection {
  heading: string;
  body?: string;
  media?: ProjectMedia[];
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
  heroMedia?: ProjectMedia; // shown at the top of the content card, above the overview
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
  status: 'Dev' | 'MVP' | 'Prod';
  techStack: string[];
  isLive?: boolean; // If false, show modal instead of linking directly
  triggerAmberModal?: boolean;
  triggerOrdinalFrameModal?: boolean;
  triggerHinkieBotModal?: boolean;
  modalContent?: ProjectModalContent;
  repos?: string[]; // github.com/seanmun repos whose commits count toward this project
  showGitStats?: boolean; // false hides this project's commit stats (it still counts toward site totals)
  comingSoonApps?: ('ios' | 'android')[]; // native apps on the way: "coming soon" store badges under the page's CTAs
}

export const projects: Project[] = [
  {
    title: "Kinetic.email",
    slug: "kinetic-email",
    description: "AI-powered platform for building interactive emails — learn the techniques, generate production-ready code, and track engagement inside the inbox. Describe an email in plain English and get two parallel production builds (kinetic HTML and AMP4Email) from a staged multi-model Claude pipeline, backed by developer curricula, multi-tenant brand workspaces, and real-time in-email analytics.",
    iconName: "Zap",
    link: "https://www.kinetic.email/",
    ariaLabel: "View Kinetic.email website",
    status: "Prod",
    techStack: ["React", "TypeScript", "Vite", "Tailwind CSS", "Supabase", "Convex", "Claude API", "OpenAI API", "Pinecone", "Mailgun", "Vercel"],
    repos: ["kinetic-email", "kineticemail", "kinetic-email-factory"],
    // Media lives in public/media/kinetic (silent H.264 loops, see
    // FeatureMedia). Still to capture — add each as a `media` entry on its
    // section: Apple Mail (kinetic) vs Gmail (AMP) side-by-side of one email
    // [Describe an email]; a module with the code editor open [Learn the
    // craft]; Brand Builder with style theories + the Arc canvas [Manage
    // brands]; a ~5s loop clicking a tab while the tracking console updates
    // [Track engagement]; a ~4s loop of the speed reader [Waiting].
    modalContent: {
      heroMedia: {
        type: "video",
        src: "/media/kinetic/sizzle.mp4",
        poster: "/media/kinetic/sizzle-poster.jpg",
        srcMobile: "/media/kinetic/sizzle-vertical.mp4",
        posterMobile: "/media/kinetic/sizzle-vertical-poster.jpg",
        width: 1280,
        height: 720,
        alt: "Kinetic.email sizzle reel: describing an email and getting an interactive build, AMP running in Gmail, Kineticize, the team workspace and the Campaign Companion"
      },
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
          footer: "Kinetic.email solves all three: an education platform that teaches the techniques, an AI generation engine that writes the code, and a workspace where teams manage brands, campaigns, and real engagement analytics.",
          media: [
            { type: "image", src: "/media/kinetic/problem.jpg", width: 1280, height: 720, alt: "Static. Flat. Ignored. Every inbox looks the same." }
          ]
        },
        {
          heading: "Describe an email → get two production builds",
          body: "The AI Playground takes a plain-English prompt (or a saved brand profile) and generates two parallel builds of the same email: Kinetic HTML — CSS :checked interactivity for Apple Mail and iOS Mail, with Yahoo/AOL hacks, MSO conditionals, and graceful static fallback for everything else — and AMP4Email, using amp-carousel, amp-form, and amp-bind for dynamic content in Gmail and Yahoo. Both builds share a single design blueprint (palette, typography, spacing, button styles), so the visual experience is identical no matter which client opens it. They ship together as a tri-part MIME bundle — one send, and every inbox gets the best experience it supports. Kinetic.email is an approved AMP sender for Gmail and Yahoo Mail, so the AMP version renders live in their inboxes with no setup for the recipient.",
          media: [
            { type: "video", src: "/media/kinetic/generate.mp4", poster: "/media/kinetic/generate.jpg", width: 1100, height: 826, alt: "Describing an email in the AI Playground and getting an interactive build", caption: "Describe it, get an interactive email." },
            { type: "video", src: "/media/kinetic/amp.mp4", poster: "/media/kinetic/amp.jpg", width: 1100, height: 890, alt: "The AMP version of an email running interactively in Gmail", caption: "Real AMP, right in the inbox." }
          ]
        },
        {
          heading: "Kineticize: make existing emails interactive",
          body: "Most teams already have years of emails. Paste one in — a newsletter, a promo, a receipt — and Kineticize rebuilds it as an interactive kinetic + AMP pair while keeping what makes it yours. The design is read from the source itself, by role (its hero, buttons, body and footer), instead of being swapped for a generic template. In evals on ten real production emails, the copy came through 96–100% intact, with every link and image preserved.",
          media: [
            { type: "video", src: "/media/kinetic/kineticize.mp4", poster: "/media/kinetic/kineticize.jpg", width: 1100, height: 720, alt: "Kineticize turning an existing email into an interactive version", caption: "Got old emails? Kineticize them." }
          ]
        },
        {
          heading: "Campaign Companion",
          body: "A campaign strategist built into the workspace. Tell it what you're launching and it plans the campaign from the brand's industry, audience and sending platform, writing in the voice of the email you've starred as your best. It ends with ready-to-generate prompts, so a plan becomes built emails without rewriting a brief. Part of Premium and Enterprise.",
          media: [
            { type: "video", src: "/media/kinetic/companion.mp4", poster: "/media/kinetic/companion.jpg", width: 1100, height: 764, alt: "The Campaign Companion planning a campaign and handing off prompts to build", caption: "It plans the campaign. You hit build." }
          ]
        },
        {
          heading: "Learn the craft",
          body: "Six developer modules (the checkbox hack, kinetic lightswitch, tabbed elements, tracking, and more) plus marketing and coding curricula — with in-browser code editors, progress tracking, and badges. The education layer isn't a side feature: it feeds the token economy, and educated users become the platform's advocates."
        },
        {
          heading: "Manage brands and campaigns",
          body: "Multi-tenant workspaces built for teams:",
          media: [
            { type: "video", src: "/media/kinetic/workspace.mp4", poster: "/media/kinetic/workspace.jpg", width: 1100, height: 758, alt: "A shared Enterprise workspace with brands, projects and tracking databases", caption: "Your whole team. One shared workspace." }
          ],
          bullets: [
            "Brand Builder — colors, fonts, tone, logo, product catalog (manual + CSV/Shopify import), CAN-SPAM details, and one of eight \"style theories\" (editorial-minimal, bold-brutalist, luxe-premium…) that steer how the AI constructs the email, not just what colors it uses",
            "Projects & Emails — versioned email management with test sends via Mailgun",
            "Arc — a visual campaign canvas (React Flow) for composing email journeys, shareable with clients via tokenized links",
            "Enterprise workspaces — a shared workspace for a team or agency: owner, admin and member roles, email invites, and one shared credit pool, with nothing leaking between workspaces (enforced at the database level)",
            "Plans — Premium adds the Campaign Companion and higher limits (10,000 emails, 500 projects, 10 tracking databases); Enterprise brings all of it to every member of a team workspace"
          ]
        },
        {
          heading: "Track engagement inside the email",
          body: "Kinetic emails report interaction without JavaScript: when a :checked selector fires, a CSS background-image tracking pixel loads. AMP versions submit real forms. Both stream into a real-time Convex database — see which tab a subscriber opened, which carousel slide they stopped on, which survey answer they picked, all without a single click-through."
        },
        {
          heading: "The generation pipeline",
          body: "Email generation is a staged, multi-model pipeline — not a single prompt:",
          media: [
            { type: "diagram", diagram: "kinetic-pipeline", alt: "Generation pipeline: brief, blueprint, RAG, parallel kinetic and AMP builds, QA, curator" }
          ],
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
            "Multi-tenancy at the database layer: every Supabase table runs Row-Level Security — permissions are Postgres policies, not application code — with SECURITY DEFINER helpers to safely cross tenant boundaries and 150+ numbered SQL migrations tracking the schema's evolution",
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
          label: "Work with me",
          url: "/#work-with-me"
        }
      }
    }
  },
  {
    title: "Money Never Sleeps",
    slug: "money-never-sleeps",
    description: "A fantasy sports platform for groups who take it seriously: an NBA and WNBA dynasty on real contracts, NFL pick'em, fantasy golf, and March Madness, all in one app with one login. Every player carries his actual NBA deal, with a real salary cap and aprons that cost you. Bump, an AI general manager you talk to out loud, sets lineups, works the wire, and runs the trade math. The native iPhone app is in beta, with Android close behind.",
    iconName: "DollarSign",
    link: "https://mnsfantasy.com/",
    ariaLabel: "View MNS Fantasy website",
    status: "Prod",
    techStack: ["React", "TypeScript", "Vite", "Tailwind CSS", "Clerk", "Neon Postgres", "Drizzle ORM", "Claude API", "ElevenLabs", "SwiftUI", "Kotlin", "Alchemy API", "CoinGecko API", "Resend", "Vercel"],
    repos: ["mns", "mns-fantasy", "mns-ui", "bball-mns-fantasy", "nfl-mns-fantasy", "golf-mns-fantasy", "ncaa-mns-fantasy"],
    comingSoonApps: ["ios", "android"],
    // Media lives in public/media/mns: section crops of the live
    // mnsfantasy.com landing, the keeper planner (from the mns-fantasy
    // preview-shots), and a loop of Bump's sample carousel. Still wanted:
    // iPhone screenshots (Bump voice mode, a league Home) for the app section.
    modalContent: {
      heroMedia: {
        type: "image",
        src: "/media/mns/front-office.jpg",
        width: 1600,
        height: 1116,
        alt: "MNS Fantasy home: Run your team like a front office. A sample payroll on real NBA contracts sits $8.5M over the first apron, and Bump proposes a trade to get under it."
      },
      overview: "Money Never Sleeps started as one fantasy basketball dynasty league with real NBA salary cap rules and a prize pool held in crypto. It's now MNS Fantasy: a platform where five games share one app, one login, one design system, and one AI general manager. On October 12, 2026 every game moved into mnsfantasy.com in a single cutover, the NBA dynasty opened for its first season, and Bump learned to talk.",
      detailSections: [
        {
          heading: "A real league, with real money problems",
          body: "The NBA dynasty is the flagship. Every player costs what his actual NBA contract pays, so bargains are real bargains and stars come with real consequences. Teams build under a cap ladder that mirrors the NBA's: spend freely under the first apron, pay a one-time fee to cross it, pay per million over the second, and never cross the hard cap.",
          media: [
            { type: "image", src: "/media/mns/cap-ladder.jpg", width: 1600, height: 1098, alt: "The NBA dynasty rules: real contracts, nine head-to-head categories, eight keepers priced by round, nightly lineups, and the cap ladder from $0 to the $272M hard cap", caption: "Real contracts, nine categories, and a cap ladder with teeth." }
          ],
          bullets: [
            "Nine-category head-to-head matchups, with lineups set by the night; each player locks at his own tip-off",
            "Up to eight keepers, each priced by a draft round, with rookies priced by their draft slot",
            "Rookie draft on the shared draft engine, with traded picks changing hands on the board",
            "League setup reads the real NBA schedule, light weeks included",
            "The WNBA runs the same dynasty game on its own calendar, from the same module"
          ]
        },
        {
          heading: "Keeper season",
          body: "Before the season, every team plans its keepers with last season's stats on every player, sorted by a category z-score per dollar. Members save competing ideas, submit one, and can change their plan any time until the commissioner locks keepers. The cap meter and the cost of each open spot update as they go.",
          media: [
            { type: "image", src: "/media/mns/keepers.jpg", width: 1280, height: 1370, alt: "The keeper planner: a roster table with salary, keeper round and last season's nine-category stats, beside a cap meter and the team's draft rounds", caption: "Plan up to eight keepers against the cap." }
          ]
        },
        {
          heading: "Bump, your AI general manager",
          body: "Tap the mic and talk the way you'd talk to your GM. Bump answers out loud, streams his thinking as he goes, and puts the exact facts on screen (picks, spreads, salaries, rounds) while he speaks. He knows where your league is in its season, so he won't suggest a waiver claim during keeper season.",
          media: [
            { type: "video", src: "/media/mns/bump.mp4", poster: "/media/mns/bump.jpg", width: 900, height: 1280, alt: "Bump cycling through sample requests: a win-now trade, tonight's lineup, a move for more games this week, and a free agent who helps steals", caption: "Ask for a trade, a lineup, or a free agent. He shows his math." }
          ],
          bullets: [
            "Evaluates and proposes trades, running both sides' cap math before anything is sent",
            "Ranks the waiver wire by value per $1M and checks each claim fits your cap",
            "Sets a whole week of lineups at once, and saves and submits keeper plans",
            "In the NFL pool, reads out your picks and puts them on screen",
            "Acts with your own login, so he can do anything you can and nothing you can't, and reads back every move for your yes first"
          ],
          footer: "Voice runs on ElevenLabs with the device voice as a free fallback, and Bump stops talking the moment you talk over him."
        },
        {
          heading: "Track the pot like a portfolio",
          body: "The prize pool can sit in cash, crypto, or both. Point MNS at the league's public Ethereum wallet and the pot's live value counts in, priced in real time. Every payout is a share of the pot, so the champion's prize rises and falls with it. It's tracked, never handled: no money moves through MNS, and the commissioner holds the pot the way the league always has.",
          media: [
            { type: "image", src: "/media/mns/prize-pool.jpg", width: 1600, height: 1038, alt: "A sample prize pool held in Bitcoin, charted over 30 days, with each payout shown as a share of the pot", caption: "Every payout is a share of a live pot." }
          ]
        },
        {
          heading: "One login. Every game.",
          body: "NBA and WNBA dynasty leagues, NFL pick'em against the spread, PGA fantasy golf with waivers between events, and March Madness picked by seed tier. Each game used to be its own app on its own subdomain. Now each is a module inside one app, and every old link still lands on the same page. Sign in and you land in the league you were in last.",
          media: [
            { type: "image", src: "/media/mns/every-game.jpg", width: 1600, height: 772, alt: "The five MNS games: NBA Dynasty, NFL Pick'em, WNBA Dynasty, PGA Fantasy Golf, and March Madness", caption: "Five games, one app." }
          ],
          bullets: [
            "One navigation model everywhere: the same Home · Play · Standings tabs in every game, and one ☰ menu listing your active leagues",
            "A 60-second rule as a shipping gate: a member finishes the week's action in under a minute, at most two taps from login, or the design doesn't ship",
            "Built for everyone in the group, with an 18px base, large tap targets, and measured AA contrast in both light and dark themes"
          ]
        },
        {
          heading: "In your pocket",
          body: "Native iPhone (SwiftUI) and Android (Kotlin + Jetpack Compose) apps share the website's login and cover every game: NFL picks and manager tools, basketball leagues with the keeper planner, matchups and transactions, golf pools, NCAA leagues, and Bump in voice mode. The iPhone app is in beta on TestFlight, with the App Store and Google Play coming soon."
        },
        {
          heading: "Engineering details",
          bullets: [
            "The Singularity: five separate apps merged into one in a single cutover. Each old subdomain 308-redirects to mnsfantasy.com/<game> with its path and query intact, and its API is rewritten to the game's new endpoint, so open tabs and old links kept working",
            "Each game is a lazy-loaded module with its own strict TypeScript build and serverless API, so one game's update never ships inside another's code",
            "One hub owns drafts: a shared draft engine that knows nothing about any sport. Games push an item pool and read picks back",
            "Basketball is one module serving two sports, with each request scoped to its sport and separate Postgres schemas, so no rows are shared",
            "mns-ui, a shared design system (tokens, light and dark themes, components) synced into every app, so pages compose and never restyle",
            "Every commit and build is scanned for secrets before it can ship"
          ]
        }
      ],
      technicalDetails: "React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, and Framer Motion on the web, with Vercel serverless functions for the API. Clerk for one login across web and native; Neon serverless Postgres with Drizzle ORM, one schema per game. Bump runs on the Claude API with tool use against the same APIs the app calls, and speaks through ElevenLabs. Alchemy reads the league's wallet and CoinGecko prices it, and Resend sends the branded email suite. Native apps in SwiftUI and Kotlin/Jetpack Compose. Solo-built: product, design system, web, native apps, and the AI agent.",
      callToAction: {
        primary: {
          label: "Visit MNS Fantasy",
          url: "https://mnsfantasy.com/"
        },
        secondary: {
          label: "Work with me",
          url: "/#work-with-me"
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
    status: "Prod",
    techStack: ["Python", "TypeScript", "Node.js", "Telegram API", "Claude API", "SQLite", "Railway", "Raspberry Pi"],
    repos: ["HinkieBot", "track-everything"],
    showGitStats: false,
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
          label: "Work with me",
          url: "/#work-with-me"
        }
      }
    }
  },
  {
    title: "Buddy Cup",
    slug: "buddy-cup",
    description: "A multi-tenant Ryder-Cup-style platform that brings real match-play scoring to the buddy golf trip. Navigate actual match-play math with handicap strokes auto-allocated by stroke index, dormie tracking, and closeouts (3&2, 4&3) computed the moment the deciding hole posts. Manage your entire trip from one phone — courses, players, tee times, matchups, even the welcome dinner. Snap a scorecard photo and AI reads par and stroke index for all 18 holes. The team feed runs hot with score posts, trash talk, and photos, while team and individual leaderboards update the second a putt drops. Side games (skins, Nassau, Vegas, presses) run alongside the cup, and a native iPhone app with an Apple Watch companion puts score entry on your wrist. Defend the cup.",
    iconName: "LandPlot",
    link: "https://www.buddycup.golf/",
    ariaLabel: "View Buddy Cup website",
    status: "MVP",
    techStack: ["Next.js", "TypeScript", "Neon Postgres", "Drizzle ORM", "Clerk Auth", "Claude API", "OpenAI API", "TanStack Query", "Tailwind CSS", "SwiftUI", "Vercel"],
    repos: ["PERN"],
    comingSoonApps: ["ios"],
    // Media lives in public/media/buddycup: section crops of the live
    // buddycup.golf landing. Skip its hero: the golf-ball image behind the
    // logo carries an iStock watermark. Still wanted: iPhone + Watch shots.
    modalContent: {
      heroMedia: {
        type: "image",
        src: "/media/buddycup/arcade-matchup.jpg",
        width: 1060,
        height: 580,
        alt: "An arcade matchup card: two players from Hacks face two from Chunkers as pixelated NBA Jam-style portraits, with handicap-driven rating bars"
      },
      overview: "Run your trip. Crown your champion. Buddy Cup is a multi-tenant Ryder-Cup-style platform that brings real match-play scoring to the buddy golf trip — courses, players, tee times, matchups, live leaderboards, and the surrounding chaos, all managed from one phone.",
      detailSections: [
        {
          heading: "The idea",
          body: "Every buddy golf trip has the same problem: someone becomes the human spreadsheet. Tee times live in a group text, matchups on a napkin, and nobody can actually score match play with handicaps — so the \"cup\" gets settled by vibes. Buddy Cup replaces all of it. From signed-up to first tee shot in an afternoon: create the trip, invite your buddies, snap your scorecards, schedule your cup, and plan the surrounding chaos — flights, shuttles, dinners, the post-round bar stop — all on one shared, day-by-day timeline next to the golf.",
          media: [
            { type: "image", src: "/media/buddycup/schedule.jpg", width: 1600, height: 1178, alt: "The trip itinerary: a day's hotel check-in, three 2v2 match-play tee times with each player's handicap, and the welcome dinner", caption: "The whole trip on one day-by-day timeline." }
          ]
        },
        {
          heading: "Inside a trip",
          body: "Here's what a four-day cup looks like from the inside. Pick a day: the cup score updates through that day, every match shows its result or its live status, and every player's net score for the round sits beside it. Saturday is mid-round, so four singles matches are still live.",
          media: [
            { type: "diagram", diagram: "buddycup-trip", alt: "An interactive sample trip with day tabs: the cup score through each day, every match result or live status, and an individual net-to-par leaderboard", caption: "A sample trip. Tap a day." }
          ]
        },
        {
          heading: "Signature features",
          media: [
            { type: "image", src: "/media/buddycup/live-scoring.jpg", width: 980, height: 880, alt: "Live cup standings: Hacks 8½, Chunkers 6½ with 9 of 15 matches in the books, above an individual leaderboard", caption: "The leaderboard that fits in your back pocket." },
            { type: "image", src: "/media/buddycup/feed.jpg", width: 880, height: 1254, alt: "The trip feed: a posted round at Pinehurst No. 2, trash talk, and emoji reactions", caption: "Trash talk, photos, and receipts." }
          ],
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
          heading: "More games than the cup",
          body: "A buddy trip isn't only the cup. Every round can carry its own side action, scored by the same engine and kept separate from cup points:",
          bullets: [
            "Formats: singles, 2v2 best ball, two-man aggregate, scramble, and stroke play, resolved by match play, Stableford, or stroke",
            "30 Ball and 40 Ball: each side commits a budget of balls hole by hole, with a pace rule that keeps the budget reachable and scores net against par",
            "Bingo Bango Bongo, plus a game pack with Skins, Vegas, and Quota and a named Nassau preset",
            "Presses: match-play side bets tracked per match, never counted toward the cup"
          ]
        },
        {
          heading: "On the course: iPhone and Apple Watch",
          body: "A native SwiftUI iPhone app shares the website's Clerk sign-in and covers the trip end to end: the cup, the schedule, the feed, score entry, and even building matches and new events. An Apple Watch companion lets you pick your group and enter hole scores from your wrist, without pulling out your phone mid-round."
        },
        {
          heading: "Build strategy",
          bullets: [
            "The scoring engine is a pure-function package: match-play math is the most algorithmically important code in the app, so it lives in its own workspace package with zero database or framework dependencies — inputs in, results out — covered by unit and property-based tests that make exotic formats safe to add",
            "Multi-tenant from day one: every domain table was trip-scoped while v1 served a single real 12-man trip. That insurance paid off: the trip-creation wizard, invites, and trip kinds (multi-day trips, one-day outings, single matches) shipped as routing and forms, not a rewrite",
            "Permissions in the application layer: all authorization cascades through one set of helpers — platform admin → trip admin → captain → self — so a permission rule is one function, not a policy scattered across tables",
            "AI with a safety net: the scorecard reader validates its output and falls back to manual entry, and portrait generation never destroys the source photo. AI accelerates the happy path; it never gatekeeps it",
            "Polling-first realtime: golf doesn't need millisecond updates. TanStack Query polling keeps the leaderboard live with a fraction of the infrastructure of WebSockets — architecture matched to the actual problem",
            "Built against a real trip: the whole product is pressure-tested by an actual 12-man, 6-round cup — real handicaps, real tee times, real trash talk. Nothing ships that wouldn't survive contact with 12 opinionated golfers"
          ]
        }
      ],
      technicalDetails: "Next.js (App Router) with TypeScript and React Server Components — client components only where interactivity demands it. Neon serverless Postgres with Drizzle ORM (schema-as-code as the single source of truth); Clerk magic-link auth with a layered permission model. AI: Anthropic Claude (vision + extended thinking) for scorecard extraction, OpenAI gpt-image-1 for arcade portraits, Sightengine for feed moderation. UI: Tailwind CSS v4, Framer Motion, dnd-kit, and TanStack Query for server state and polling-based live updates. Vercel hosting with Vercel Blob storage, Sharp image processing, and Resend + React Email for delivery.",
      plannedFeatures: [
        "Trip Memoir Engine — every hole-tagged photo, score, and feed post is already structured to fuel AI-generated nightly recaps and a post-trip highlight video (Remotion-based), with narrated audio",
        "GHIN integration, trophy room, and record book — season-over-season rivalry history"
      ],
      callToAction: {
        primary: {
          label: "Visit BuddyCup.golf",
          url: "https://www.buddycup.golf/"
        },
        secondary: {
          label: "Work with me",
          url: "/#work-with-me"
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
    status: "Dev",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Supabase", "Deepgram", "Claude API", "ElevenLabs", "Zustand", "Vercel"],
    repos: ["story-vault"],
  },
  {
    title: "Rocket Pool Tour",
    slug: "rocket-pool-tour",
    description: "The full stack for a new professional billiards league founded by World Champion \"Rocket\" Rodney Morris. A public site teaches Rocket Run-Out©, the league's scoring format. A live score tracker turns every rack into a rating and a handicap. Behind the team login, a partnership CRM tracks deals, and a deck engine generates a custom sponsorship pitch for each brand. Season 1 tips off in 2027.",
    iconName: "Rocket",
    link: "https://therocketpooltour.com/",
    ariaLabel: "View Rocket Pool Tour website",
    status: "Dev",
    techStack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Upstash Redis", "Zod", "Vitest", "ElevenLabs", "Vercel"],
    repos: ["rocket"],
    // Media lives in public/media/rocket. The CRM and deck shots are the real
    // components rendered locally with FICTIONAL partners (Northwind Air,
    // Crestline Beverage...): the live pipeline holds real brands, contacts,
    // deal amounts and private deck links, none of which may appear here. The
    // deck's closing slide is left out because it carries Rodney's phone and
    // email. The tracker loop is the public demo on /rpt-app.
    modalContent: {
      heroMedia: {
        type: "image",
        src: "/media/rocket/home.jpg",
        width: 1600,
        height: 1000,
        alt: "The Rocket Pool Tour homepage: the RPT logo, the next event in Las Vegas, and the line 40 elite players, 15 weeks, $1.5M+ in prizes, one groundbreaking new format"
      },
      overview: "The Rocket Pool Tour is a professional billiards league built around a new game, Rocket Run-Out©, created by World Champion and Hall of Famer \"Rocket\" Rodney Morris. I built everything the league runs on before its first rack is broken: the public site, the rules, the score tracker and rating system, and the private tools the founders use to sell the league to sponsors.",
      detailSections: [
        {
          heading: "A sport with a scoreboard",
          body: "Most pool is win or lose. In Rocket Run-Out every rack produces a number. A break and run scores 200, a dry break and run 150, a ball-in-hand run 100, and a miss scores 10 points per ball. Players shoot their own racks, so every shot is offense. The format comes in two versions: a 9-ball game for venues and leagues, and an 11-ball Pro game for the tour.",
          media: [
            { type: "image", src: "/media/rocket/scoring.jpg", width: 1240, height: 1110, alt: "The Rocket Run-Out scoring system: 200 for a break and run, 150 for a dry break and run, 100 for a ball-in-hand run, 60 for a salvage after a scratch, and 0 to 50 for an incomplete run", caption: "Five outcomes, each one a number." }
          ],
          footer: "A score on every rack is the point of the whole project. It is what makes ratings, handicaps, leaderboards, and live betting lines possible in a sport that has never had them."
        },
        {
          heading: "The RRO app: every rack, rated",
          body: "The score tracker is live on the web. Choose 9 or 11 balls and 5 or 10 racks, then score each rack with four inputs: the break, ball-in-hand, balls pocketed, and the 8. The score updates as you tap. Finish a five-rack match and it counts toward your rating. The app page runs the real tracker on the real rules, with nothing saved, so visitors can try it before they sign up.",
          media: [
            { type: "video", src: "/media/rocket/tracker.mp4", poster: "/media/rocket/tracker.jpg", width: 600, height: 1200, alt: "The Rocket Run-Out tracker scoring a five-rack match: a break and run for 200, a dry break and run for 150, a ball-in-hand run for 100, a salvage for 30, and another break and run, for 680 in total and a 136.0 average", caption: "A full match in the live demo: five racks, 680 points." }
          ],
          bullets: [
            "One rules engine, written twice: a TypeScript mirror for instant feedback in the UI, and the same rules in Postgres, with a parity test that proves they agree",
            "60 unit tests on the scoring, match and rating math",
            "Usernames as the public identity, and a leaderboard players opt into",
            "Guest opponents in seat two, and native iPhone and Android apps on the same data model next"
          ]
        },
        {
          heading: "The database is the referee",
          body: "No client can post a score. The app sends only what happened at the table, and a Postgres trigger computes the points. Ratings have no write policy at all: only the match-completion function can recompute them. A phone app, a modified browser, or a direct API call gets the same result as the official tracker.",
          media: [
            { type: "image", src: "/media/rocket/rating.jpg", width: 1240, height: 1500, alt: "The Rating and Handicap rules: a rating is the average of your best 8 of your last 11 matches on a 0 to 200 scale, and your handicap is 80% of 200 minus your rating, rounded to the nearest 5", caption: "Best 8 of your last 11 matches makes a rating. The handicap follows from it." }
          ],
          bullets: [
            "Your rating is the average of your best 8 of your last 11 matches, with fewer counted while you build a history",
            "Handicap is 80% of the gap to 200, so a 120 player gets 65 a rack and a handicapped match still rewards skill",
            "Calculated from raw scores only, and tracked separately for each game",
            "The tour plays on raw points. The handicap is for venues and leagues"
          ]
        },
        {
          heading: "A pitch deck for every partner",
          body: "Every brand the league pitches gets its own deck, with its logo on the cover and a case written for its industry: why an airline, a watchmaker, or a sportsbook belongs in pool, and where its name goes on the players, the tables, and the broadcast. Each deck is generated from a single partner record and an industry template, so a new deck is one new record. Sportsbook and technology partners get an extra integration slide.",
          media: [
            { type: "video", src: "/media/rocket/deck.mp4", poster: "/media/rocket/deck.jpg", width: 1600, height: 1000, alt: "A generated sponsorship deck for a sample partner, Northwind Air: the cover, the opportunity, the audience, the three sponsorship surfaces, why now, what RPT is, the format, and the founders", caption: "A generated deck for a sample partner. Real decks go out one brand at a time." }
          ],
          bullets: [
            "More than two dozen bespoke decks across ten industries, all from one slide system",
            "Each deck is shared by an unguessable link. It is rendered on the server, so a recipient's browser never receives another partner's terms",
            "Deck links are kept out of search engines, referrers and caches, and internal previews are for team members only",
            "A separate investor deck lays out the league's thesis, with ElevenLabs narration on mobile"
          ]
        },
        {
          heading: "A CRM built for the deal flow",
          body: "The team portal turns those decks into a pipeline. Every partner appears as a card showing its deal status, how warm the lead is, the main contact, the latest note, and any funding secured. Open a card and you can move the deal, add contacts, and log calls, emails and meetings. Status changes are logged automatically.",
          media: [
            { type: "image", src: "/media/rocket/crm.jpg", width: 1600, height: 1445, alt: "The deal pipeline: totals for deals, active pipeline, closed won and funding secured, filters by status, industry and temperature, and a grid of partner cards", caption: "The pipeline at a glance, shown with sample partners." },
            { type: "image", src: "/media/rocket/crm-detail.jpg", width: 1600, height: 1125, alt: "A deal opened in a side drawer: the deck link, status and temperature controls, funding secured, notes, contacts and the activity log", caption: "Every deal in one drawer: status, contacts and history." }
          ],
          bullets: [
            "Search and filter by status, industry and lead temperature, with hot, active deals sorted to the top",
            "Every write is a server action that checks the input, confirms the user is an admin, and is rate limited per user",
            "Team members are managed from the portal, alongside subscribers and email assets"
          ]
        },
        {
          heading: "Engineering details",
          bullets: [
            "Row-level security on every table, with each admin check going through one Postgres function, so a policy can't quietly fall back to letting everyone in",
            "Privileged database functions trust the logged-in user's session, never an ID passed in the request",
            "Tutorials stream from Supabase Storage with range requests, so the video starts playing before it has fully downloaded",
            "Magic-link and Google sign-in through Supabase Auth, with every team page and deck preview checked for admin access on the server"
          ]
        }
      ],
      technicalDetails: "Next.js 16 with the App Router and React 19 server components, TypeScript and Tailwind CSS 4, deployed on Vercel. Supabase provides Postgres with row-level security, auth and storage. Scoring and ratings run as Postgres triggers and SECURITY DEFINER functions, mirrored in TypeScript and tested with Vitest. Zod validates server actions, and Upstash Redis rate-limits them. Solo-built for the founders: brand site, rules, score tracker, CRM and deck engine.",
      callToAction: {
        primary: {
          label: "Visit the Rocket Pool Tour",
          url: "https://therocketpooltour.com/"
        },
        secondary: {
          label: "Work with me",
          url: "/#work-with-me"
        }
      }
    }
  },
  {
    title: "Amber Mode",
    slug: "amber-mode",
    description: "Amber Mode is a custom screen theme designed to reduce blue light exposure and support healthy circadian rhythms. By shifting to warm amber tones, it minimizes melatonin disruption during evening use while maintaining readability and visual comfort. Try it yourself using the accessibility settings menu above!",
    iconName: "Sun",
    link: "",
    ariaLabel: "Amber Mode modal",
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
    isLive: false, // Not publicly launched yet - show modal
    status: "MVP",
    techStack: ["Python", "React", "Raspberry Pi", "JavaScript"],
    repos: ["ordinalframe"],
    showGitStats: false,
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
          label: "Work with me",
          url: "/#work-with-me"
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
    status: "Prod",
    techStack: ["React", "Typescript", "Next.js", "Express.js", "PostgreSQL", "Node.js", "Vercel"],
    repos: ["RumbleRaffle"],
  },
  {
    title: "Human-Diet.com",
    slug: "human-diet",
    description: "An interactive data-storytelling experience that visualizes how the human diet stayed remarkably consistent for ~300,000 years — and then transformed almost overnight. Built as a scroll-driven \"camera zoom\" over a truthful, perfectly linear timeline, so the viewer physically feels how tiny the window of modern change really is.",
    iconName: "Beef",
    link: "https://www.human-diet.com/",
    ariaLabel: "View Human-Diet.com project page",
    status: "Prod",
    techStack: ["React", "TypeScript", "Vite", "Canvas", "Framer Motion", "Tailwind CSS", "Vercel"],
    repos: ["1-pixel-health"],
    showGitStats: false,
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
          label: "Work with me",
          url: "/#work-with-me"
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
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    repos: ["nba-lotto"],
  },
  {
    title: "DraftDayTrades.com",
    slug: "draftdaytrades",
    description: "Draft Day Trades lets sports fans create confidence-based draft prediction pools for NFL, NBA, WNBA, NHL, and MLB drafts. Users predict which players will be drafted at each position and assign strategic confidence points to their picks. The platform features real-time leaderboards and scoring during draft night, creating a competitive experience for friends to enjoy together.",
    iconName: "Trophy",
    link: "https://draftdaytrades.com/",
    ariaLabel: "View Draft Day Trades website",
    status: "Prod",
    techStack: ["React", "Next.js", "TypeScript", "Firebase", "Tailwind CSS", "Vercel"],
    repos: ["draft"],
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